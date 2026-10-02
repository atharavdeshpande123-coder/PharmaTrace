import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth/server'
import { receiveDrug } from '@/lib/blockchain/contracts'
import { fail, ok, withHandler } from '@/lib/api'

// POST /api/drugs/:id/receive — acknowledge receipt of a transferred batch
export const POST = withHandler(async (req: NextRequest, ctx) => {
  const { id } = await ctx!.params
  const user = await requireUser()
  const drug = await db.drug.findFirst({
    where: { OR: [{ id }, { drugId: id }, { batchNumber: id }, { qrToken: id }] },
    select: { id: true, currentOwnerId: true },
  })
  if (!drug) return fail('Drug not found', 404)
  const body = await req.json().catch(() => ({}))
  const { location, notes } = body as { location?: string; notes?: string }
  try {
    const result = await receiveDrug({
      drugId: drug.id,
      userId: user.id,
      location,
      notes,
    })
    return ok(result)
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'NOT_ASSIGNED_TO_USER') return fail('You are not the assigned recipient of this batch', 403)
    return fail(msg || 'Receive failed', 400)
  }
})
