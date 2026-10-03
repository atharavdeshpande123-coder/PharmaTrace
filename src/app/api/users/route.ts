import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/server'
import { publicUser } from '@/lib/auth/server'
import { ok, withHandler } from '@/lib/api'

// GET /api/users — admin only
export const GET = withHandler(async (req: NextRequest) => {
  await requireRole('ADMIN')
  const url = new URL(req.url)
  const role = url.searchParams.get('role') || ''
  const where: Record<string, unknown> = {}
  if (role) where.role = role
  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, name: true, role: true, organization: true,
      location: true, avatarColor: true, createdAt: true,
      _count: { select: { registeredDrugs: true, ownedDrugs: true } },
    },
  })
  return ok({ users: users.map((u) => ({ ...publicUser(u), drugCount: u._count.registeredDrugs + u._count.ownedDrugs })) })
})
