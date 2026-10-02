import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { fail, ok, withHandler } from '@/lib/api'

// GET /api/supply-chain/:drugId — return the supply-chain timeline for a drug
export const GET = withHandler(async (_req: NextRequest, ctx) => {
  const { drugId } = await ctx!.params
  const drug = await db.drug.findFirst({
    where: { OR: [{ id: drugId }, { drugId }, { batchNumber: drugId }, { qrToken: drugId }] },
    select: { id: true },
  })
  if (!drug) return fail('Drug not found', 404)
  const events = await db.supplyChainEvent.findMany({
    where: { drugId: drug.id },
    orderBy: { timestamp: 'asc' },
    include: {
      fromUser: { select: { id: true, name: true, organization: true, location: true, role: true } },
      toUser: { select: { id: true, name: true, organization: true, location: true, role: true } },
    },
  })
  return ok({ drugId: drug.id, events })
})
