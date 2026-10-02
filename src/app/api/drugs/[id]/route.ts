import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'
import { ok, fail, withHandler } from '@/lib/api'

// GET /api/drugs/:id — full drug detail
export const GET = withHandler(async (_req: NextRequest, ctx) => {
  const { id } = await ctx!.params
  const user = await getCurrentUser()
  const drug = await db.drug.findFirst({
    where: { OR: [{ id }, { drugId: id }, { batchNumber: id }, { qrToken: id }] },
    include: {
      manufacturer: { select: { id: true, name: true, organization: true, location: true } },
      currentOwner: { select: { id: true, name: true, organization: true, location: true, role: true } },
      supplyChainEvents: {
        orderBy: { timestamp: 'asc' },
        include: {
          fromUser: { select: { id: true, name: true, organization: true, location: true, role: true } },
          toUser: { select: { id: true, name: true, organization: true, location: true, role: true } },
        },
      },
      transactions: { orderBy: { timestamp: 'asc' }, include: { block: true } },
      verifications: { orderBy: { timestamp: 'desc' }, take: 20 },
    },
  })
  if (!drug) return fail('Drug not found', 404)
  // Public users only see safe info; we still return everything because the
  // backend is the source of truth and the public page filters client-side.
  return ok({ drug, isAuthed: !!user })
})
