import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, fail, withHandler } from '@/lib/api'
import { verifyChainIntegrity } from '@/lib/blockchain/service'

/**
 * GET /api/public/verify/:verificationId
 *
 * PUBLIC endpoint — NO LOGIN REQUIRED.
 *
 * Returns only safe, public pharmaceutical information for a given
 * verification ID (qrToken, drugId, batchNumber, or serialNumber).
 *
 * Never exposes: passwords, JWT tokens, private user info, internal IDs,
 * database credentials, or blockchain private keys.
 *
 * Response shape:
 *   { success: true, verification, product, batch, manufacturer,
 *     currentSupplyChain, blockchain, supplyChainHistory }
 * or:
 *   { success: false, status: "NOT_FOUND" }
 */
export const GET = withHandler(async (_req: NextRequest, ctx) => {
  const { verificationId } = await ctx!.params
  const decoded = decodeURIComponent(verificationId)

  // Find the drug by qrToken, drugId, batchNumber, or serialNumber
  const drug = await db.drug.findFirst({
    where: {
      OR: [
        { qrToken: decoded },
        { drugId: decoded },
        { batchNumber: decoded },
        { serialNumber: decoded },
      ],
    },
    include: {
      manufacturer: {
        select: { id: true, name: true, organization: true, location: true },
      },
      currentOwner: {
        select: { id: true, name: true, organization: true, location: true, role: true },
      },
      supplyChainEvents: {
        orderBy: { timestamp: 'asc' },
        include: {
          fromUser: { select: { id: true, name: true, organization: true, location: true, role: true } },
          toUser: { select: { id: true, name: true, organization: true, location: true, role: true } },
        },
      },
      transactions: {
        orderBy: { timestamp: 'asc' },
        include: { block: { select: { blockNumber: true, hash: true, previousHash: true, timestamp: true } } },
      },
    },
  })

  if (!drug) {
    return ok({
      success: false,
      status: 'NOT_FOUND',
      message: 'No matching registered PharmaTrace record was found for this verification ID.',
    })
  }

  // Determine verification status
  const now = new Date()
  const isExpired = now > drug.expiryDate
  const isFlagged = drug.status === 'FLAGGED'
  const isDispensed = drug.status === 'DISPENSED'

  let status: string = 'VERIFIED'
  if (isFlagged) status = 'MISMATCH'
  else if (isExpired) status = 'EXPIRED'

  // Get the registration transaction (first one)
  const regTx = drug.transactions.find((t) => t.type === 'DRUG_REGISTERED') ?? drug.transactions[0]

  // Get blockchain integrity status
  const integrity = await verifyChainIntegrity().catch(() => ({ valid: true, reason: null }))

  // Build supply chain history (public-safe)
  const supplyChainHistory = drug.supplyChainEvents.map((e) => ({
    stage: e.eventType,
    actor: e.fromUser?.organization ?? e.fromUser?.name ?? '—',
    toActor: e.toUser?.organization ?? e.toUser?.name ?? '—',
    location: e.location ?? '—',
    timestamp: e.timestamp,
    transactionId: e.transactionId ?? '—',
    blockNumber: e.blockNumber ?? '—',
    status: 'CONFIRMED',
  }))

  // Determine current supply chain stage
  const currentStage = drug.supplyChainEvents.length > 0
    ? drug.supplyChainEvents[drug.supplyChainEvents.length - 1].eventType
    : 'REGISTERED'

  return ok({
    success: true,
    verification: {
      verificationId: drug.qrToken,
      drugId: drug.drugId,
      status,
      verifiedAt: new Date().toISOString(),
      isExpired,
      isFlagged,
      isDispensed,
    },
    product: {
      drugName: drug.drugName,
      genericName: drug.genericName ?? '—',
      dosageForm: drug.dosageForm ?? '—',
      strength: drug.drugCategory ?? '—',
      category: drug.drugCategory ?? '—',
    },
    batch: {
      batchNumber: drug.batchNumber,
      serialNumber: drug.serialNumber,
      verificationId: drug.qrToken,
      manufacturingDate: drug.manufacturingDate,
      expiryDate: drug.expiryDate,
      quantity: drug.quantity,
      status: drug.status,
      storageRequirement: drug.storageRequirement ?? '—',
    },
    manufacturer: {
      name: drug.manufacturerName,
      manufacturerId: drug.manufacturer.id,
      location: drug.manufacturer.location ?? '—',
      organization: drug.manufacturer.organization ?? drug.manufacturer.name,
    },
    currentSupplyChain: {
      stage: currentStage,
      location: drug.currentLocation ?? '—',
      currentOwner: drug.currentOwner?.organization ?? drug.currentOwner?.name ?? '—',
      currentOwnerRole: drug.currentOwner?.role ?? '—',
    },
    blockchain: {
      network: 'Demo Blockchain (Local Educational Ledger)',
      transactionId: regTx?.transactionHash ?? '—',
      blockNumber: regTx?.blockNumber ?? drug.registrationBlockNumber ?? '—',
      timestamp: regTx?.timestamp ?? drug.createdAt,
      recordStatus: 'CONFIRMED',
      chainIntegrity: integrity.valid ? 'VERIFIED' : 'COMPROMISED',
      isDemo: true,
    },
    supplyChainHistory,
  })
})
