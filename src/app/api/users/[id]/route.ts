import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, publicUser } from '@/lib/auth/server'
import { fail, ok, withHandler } from '@/lib/api'

// GET /api/users/:id — admin only
export const GET = withHandler(async (_req: NextRequest, ctx) => {
  await requireRole('ADMIN')
  const { id } = await ctx!.params
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, name: true, role: true, organization: true,
      location: true, avatarColor: true, createdAt: true,
      _count: { select: { registeredDrugs: true, ownedDrugs: true } },
    },
  })
  if (!user) return fail('User not found', 404)
  return ok({ user: { ...publicUser(user), drugCount: user._count.registeredDrugs + user._count.ownedDrugs } })
})
