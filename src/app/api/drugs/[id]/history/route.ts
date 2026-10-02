import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { fail, ok, withHandler } from '@/lib/api'
import { getDrugHistory } from '@/lib/blockchain/contracts'

// GET /api/drugs/:id/history — full audit trail (events + txs + verifications)
export const GET = withHandler(async (_req: NextRequest, ctx) => {
  const { id } = await ctx!.params
  const drug = await db.drug.findFirst({
    where: { OR: [{ id }, { drugId: id }, { batchNumber: id }, { qrToken: id }] },
    select: { id: true },
  })
  if (!drug) return fail('Drug not found', 404)
  const history = await getDrugHistory(drug.id)
  return ok({ drugId: drug.id, ...history })
})
