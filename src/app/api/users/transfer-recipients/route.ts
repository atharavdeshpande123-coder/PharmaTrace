import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth/server'
import { ok, withHandler } from '@/lib/api'

/**
 * GET /api/users/transfer-recipients
 *
 * Returns the list of users that the current user is allowed to transfer
 * drug batches to. Available to any authenticated user (not just admins).
 *
 * Returns only the public-safe fields needed by the TransferDialog:
 *   id, name, organization, location, role
 *
 * The current user is excluded from the list (you can't transfer to yourself).
 */
export const GET = withHandler(async () => {
  const me = await requireUser()
  const users = await db.user.findMany({
    where: { id: { not: me.id } },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      organization: true,
      location: true,
      role: true,
    },
  })
  return ok({ users })
})
