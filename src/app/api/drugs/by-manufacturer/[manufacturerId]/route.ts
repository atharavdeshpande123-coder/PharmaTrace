import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { fail, ok, withHandler } from '@/lib/api'

/**
 * GET /api/drugs/by-manufacturer/:manufacturerId
 *
 * Returns all drug batches registered by the given manufacturer, plus
 * aggregate stats (total batches, total quantity, verified count, etc.).
 * Public endpoint (drug info is public).
 */
export const GET = withHandler(async (_req: NextRequest, ctx) => {
  const { manufacturerId } = await ctx!.params
  // manufacturerId can be the user id, or the organization name
  const manufacturer = await db.user.findFirst({
    where: {
      OR: [
        { id: manufacturerId },
        { organization: manufacturerId },
      ],
    },
    select: { id: true, name: true, organization: true, location: true, role: true, createdAt: true },
  })
  if (!manufacturer) return fail('Manufacturer not found', 404)

  const drugs = await db.drug.findMany({
    where: { manufacturerId: manufacturer.id },
    orderBy: { createdAt: 'desc' },
    include: {
      currentOwner: { select: { id: true, name: true, organization: true, role: true } },
      supplyChainEvents: { select: { id: true, eventType: true, timestamp: true } },
      transactions: { select: { id: true, type: true, blockNumber: true } },
      verifications: { select: { id: true, result: true } },
    },
  })

  const stats = {
    totalBatches: drugs.length,
    totalQuantity: drugs.reduce((s, d) => s + d.quantity, 0),
    verifiedCount: drugs.filter((d) => d.status === 'VERIFIED').length,
    inTransitCount: drugs.filter((d) => d.status === 'IN_TRANSIT').length,
    deliveredCount: drugs.filter((d) => d.status === 'DELIVERED').length,
    flaggedCount: drugs.filter((d) => d.status === 'FLAGGED').length,
    expiredCount: drugs.filter((d) => new Date() > d.expiryDate).length,
    dispensedCount: drugs.filter((d) => d.status === 'DISPENSED').length,
    totalTransactions: drugs.reduce((s, d) => s + d.transactions.length, 0),
    totalVerifications: drugs.reduce((s, d) => s + d.verifications.length, 0),
  }

  return ok({ manufacturer, drugs, stats })
})
