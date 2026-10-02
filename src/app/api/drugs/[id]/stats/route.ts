import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { fail, ok, withHandler } from '@/lib/api'

/**
 * GET /api/drugs/:id/stats
 *
 * Returns aggregated stats for a single drug batch:
 *   - verificationCount (total verifications)
 *   - authenticCount
 *   - failedCount (NOT_FOUND + FLAGGED)
 *   - expiredCount
 *   - transferCount (supply-chain TRANSFERRED events)
 *   - receiveCount
 *   - daysSinceManufacture
 *   - daysUntilExpiry (negative if expired)
 *   - shelfLifeTotalDays (total shelf life at manufacture)
 *   - shelfLifeUsedPct (0-100)
 *   - lastVerificationDate
 *   - lastTransferDate
 *
 * Public endpoint (no login required) — same visibility rules as the drug
 * detail itself.
 */
export const GET = withHandler(async (_req: NextRequest, ctx) => {
  const { id } = await ctx!.params
  const drug = await db.drug.findFirst({
    where: { OR: [{ id }, { drugId: id }, { batchNumber: id }, { qrToken: id }] },
    select: {
      id: true, drugName: true, batchNumber: true,
      manufacturingDate: true, expiryDate: true, status: true, createdAt: true,
    },
  })
  if (!drug) return fail('Drug not found', 404)

  const [verifications, events] = await Promise.all([
    db.verificationRecord.findMany({
      where: { drugId: drug.id },
      orderBy: { timestamp: 'desc' },
      select: { result: true, timestamp: true },
    }),
    db.supplyChainEvent.findMany({
      where: { drugId: drug.id },
      orderBy: { timestamp: 'desc' },
      select: { eventType: true, timestamp: true },
    }),
  ])

  const verificationCount = verifications.length
  const authenticCount = verifications.filter((v) => v.result === 'AUTHENTIC').length
  const failedCount = verifications.filter((v) => v.result === 'NOT_FOUND' || v.result === 'FLAGGED').length
  const expiredCount = verifications.filter((v) => v.result === 'EXPIRED').length
  const transferCount = events.filter((e) => e.eventType === 'TRANSFERRED').length
  const receiveCount = events.filter((e) => e.eventType === 'RECEIVED').length

  const now = new Date()
  const mfg = new Date(drug.manufacturingDate)
  const exp = new Date(drug.expiryDate)
  const daysSinceManufacture = Math.floor((now.getTime() - mfg.getTime()) / (1000 * 60 * 60 * 24))
  const daysUntilExpiry = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const shelfLifeTotalDays = Math.floor((exp.getTime() - mfg.getTime()) / (1000 * 60 * 60 * 24))
  const shelfLifeUsedPct = shelfLifeTotalDays > 0
    ? Math.min(100, Math.max(0, Math.round((daysSinceManufacture / shelfLifeTotalDays) * 100)))
    : 100

  const lastVerification = verifications[0]?.timestamp ?? null
  const lastTransfer = events.find((e) => e.eventType === 'TRANSFERRED')?.timestamp ?? null

  return ok({
    drugId: drug.id,
    drugName: drug.drugName,
    batchNumber: drug.batchNumber,
    status: drug.status,
    verificationCount,
    authenticCount,
    failedCount,
    expiredCount,
    transferCount,
    receiveCount,
    daysSinceManufacture,
    daysUntilExpiry,
    shelfLifeTotalDays,
    shelfLifeUsedPct,
    lastVerification,
    lastTransfer,
    authenticityRate: verificationCount > 0 ? Math.round((authenticCount / verificationCount) * 100) : null,
  })
})
