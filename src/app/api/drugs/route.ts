import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, requireUser } from '@/lib/auth/server'
import { generateUniqueDrugIdentifiers } from '@/lib/auth/qr'
import { registerDrug } from '@/lib/blockchain/contracts'
import { ensureGenesisBlock } from '@/lib/blockchain/service'
import { fail, ok, withHandler } from '@/lib/api'

// GET /api/drugs — list drugs visible to current user
export const GET = withHandler(async (req: NextRequest) => {
  const user = await getCurrentUser()
  const url = new URL(req.url)
  const search = url.searchParams.get('search') || ''
  const status = url.searchParams.get('status') || ''
  const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 100)

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { drugName: { contains: search } },
      { drugId: { contains: search } },
      { batchNumber: { contains: search } },
      { manufacturerName: { contains: search } },
    ]
  }
  if (user) {
    if (user.role === 'MANUFACTURER') {
      where.manufacturerId = user.id
    } else if (user.role === 'DISTRIBUTOR' || user.role === 'WHOLESALER' || user.role === 'PHARMACY') {
      where.OR = [
        { manufacturerId: user.id },
        { currentOwnerId: user.id },
      ]
    }
    // ADMIN and CUSTOMER see all
  }
  const drugs = await db.drug.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      manufacturer: { select: { id: true, name: true, organization: true, location: true } },
      currentOwner: { select: { id: true, name: true, organization: true, location: true } },
    },
  })
  return ok({ drugs })
})

// POST /api/drugs — register a new drug batch
export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser()
  if (user.role !== 'MANUFACTURER' && user.role !== 'ADMIN') {
    return fail('Only manufacturers can register drug batches', 403)
  }
  await ensureGenesisBlock()
  const body = await req.json().catch(() => ({}))
  const {
    drugName, genericName, batchNumber, serialNumber,
    manufacturingDate, expiryDate, quantity,
    drugCategory, dosageForm, storageRequirement,
    manufacturingLocation, description,
  } = body as Record<string, unknown>

  if (!drugName || !batchNumber || !serialNumber || !manufacturingDate || !expiryDate || !quantity) {
    return fail('Missing required fields')
  }
  const mfgDate = new Date(manufacturingDate as string)
  const expDate = new Date(expiryDate as string)
  if (isNaN(mfgDate.getTime()) || isNaN(expDate.getTime())) return fail('Invalid dates')
  if (expDate <= mfgDate) return fail('Expiry date must be after manufacturing date')
  const qty = Number(quantity)
  if (!Number.isFinite(qty) || qty <= 0) return fail('Quantity must be a positive number')

  // Check uniqueness of user-supplied batch & serial
  const dup = await db.drug.findFirst({
    where: { OR: [{ batchNumber: String(batchNumber) }, { serialNumber: String(serialNumber) }] },
    select: { id: true },
  })
  if (dup) return fail('Batch number or serial number already exists', 409)

  const ids = await generateUniqueDrugIdentifiers()
  // Use user-supplied batch/serial if provided; otherwise fall back to generated ones.
  const finalBatch = String(batchNumber)
  const finalSerial = String(serialNumber)

  const { drug, transaction } = await registerDrug({
    drugId: ids.drugId,
    drugName: String(drugName),
    genericName: genericName ? String(genericName) : undefined,
    manufacturerName: user.organization ?? user.name,
    manufacturerId: user.id,
    batchNumber: finalBatch,
    serialNumber: finalSerial,
    manufacturingDate: mfgDate,
    expiryDate: expDate,
    quantity: qty,
    drugCategory: drugCategory ? String(drugCategory) : undefined,
    dosageForm: dosageForm ? String(dosageForm) : undefined,
    storageRequirement: storageRequirement ? String(storageRequirement) : undefined,
    manufacturingLocation: manufacturingLocation ? String(manufacturingLocation) : user.location ?? undefined,
    description: description ? String(description) : undefined,
    qrToken: ids.qrToken,
  })

  return ok({ drug, transaction, qrToken: ids.qrToken, drugId: ids.drugId }, 201)
})
