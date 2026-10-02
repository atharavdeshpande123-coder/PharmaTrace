import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth/server'
import { transferDrug } from '@/lib/blockchain/contracts'
import { fail, ok, withHandler } from '@/lib/api'

// POST /api/drugs/:id/transfer — move ownership of a drug batch
export const POST = withHandler(async (req: NextRequest, ctx) => {
  const { id } = await ctx!.params
  const user = await requireUser()
  const drug = await db.drug.findFirst({
    where: { OR: [{ id }, { drugId: id }, { batchNumber: id }, { qrToken: id }] },
    select: { id: true, currentOwnerId: true, status: true },
  })
  if (!drug) return fail('Drug not found', 404)
  if (drug.currentOwnerId !== user.id && user.role !== 'ADMIN') {
    return fail('Only the current owner can transfer this batch', 403)
  }
  const body = await req.json().catch(() => ({}))
  const { toId, destination, quantity, notes } = body as {
    toId?: string; destination?: string; quantity?: number; notes?: string
  }
  if (!toId) return fail('A destination party (toId) is required')
  const toUser = await db.user.findUnique({ where: { id: toId } })
  if (!toUser) return fail('Destination user not found', 404)
  try {
    const result = await transferDrug({
      drugId: drug.id,
      fromId: user.id,
      toId,
      destination,
      quantity,
      notes,
    })
    return ok(result)
  } catch (e) {
    const msg = (e as Error).message
    const map: Record<string, [string, number]> = {
      DRUG_NOT_FOUND: ['Drug not found', 404],
      NOT_CURRENT_OWNER: ['Only the current owner can transfer this batch', 403],
      DRUG_FLAGGED: ['This batch is flagged and cannot be transferred', 400],
      DRUG_DISPENSED: ['This batch has already been dispensed', 400],
      DRUG_EXPIRED: ['Expired drugs cannot be transferred', 400],
      INVALID_PARTY: ['Invalid transfer party', 400],
    }
    const [message, status] = map[msg] ?? ['Transfer failed', 400]
    return fail(message, status)
  }
})
