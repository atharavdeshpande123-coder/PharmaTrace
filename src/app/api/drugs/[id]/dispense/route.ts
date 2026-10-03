import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/server'
import { dispenseDrug } from '@/lib/blockchain/contracts'
import { fail, ok, withHandler } from '@/lib/api'

// POST /api/drugs/:id/dispense — pharmacy marks batch as dispensed
export const POST = withHandler(async (req: NextRequest, ctx) => {
  const { id } = await ctx!.params
  const user = await requireRole('PHARMACY', 'ADMIN')
  const drug = await db.drug.findFirst({
    where: { OR: [{ id }, { drugId: id }, { batchNumber: id }, { qrToken: id }] },
    select: { id: true, currentOwnerId: true },
  })
  if (!drug) return fail('Drug not found', 404)
  const body = await req.json().catch(() => ({}))
  const { notes } = body as { notes?: string }
  try {
    const result = await dispenseDrug({ drugId: drug.id, userId: user.id, notes })
    return ok(result)
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'NOT_CURRENT_OWNER') return fail('Only the current owner can dispense this batch', 403)
    return fail(msg || 'Dispense failed', 400)
  }
})
