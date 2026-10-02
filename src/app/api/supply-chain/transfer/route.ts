import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth/server'
import { transferDrug } from '@/lib/blockchain/contracts'
import { fail, ok, withHandler } from '@/lib/api'

// POST /api/supply-chain/transfer — transfer a drug batch to another party.
// Body: { drugId, fromId?, toId, destination?, quantity?, notes? }
export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser()
  const body = await req.json().catch(() => ({}))
  const { drugId, toId, destination, quantity, notes } = body as {
    drugId?: string; toId?: string; destination?: string; quantity?: number; notes?: string
  }
  if (!drugId || !toId) return fail('drugId and toId are required')
  const drug = await db.drug.findFirst({
    where: { OR: [{ id: drugId }, { drugId }, { batchNumber: drugId }, { qrToken: drugId }] },
    select: { id: true, currentOwnerId: true },
  })
  if (!drug) return fail('Drug not found', 404)
  if (drug.currentOwnerId !== user.id && user.role !== 'ADMIN') {
    return fail('Only the current owner can transfer this batch', 403)
  }
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
