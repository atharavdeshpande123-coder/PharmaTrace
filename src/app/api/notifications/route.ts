import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, requireUser } from '@/lib/auth/server'
import { fail, ok, withHandler } from '@/lib/api'

// GET /api/notifications — list notifications for the current user
export const GET = withHandler(async (req: NextRequest) => {
  const user = await requireUser()
  const url = new URL(req.url)
  const unreadOnly = url.searchParams.get('unreadOnly') === 'true'
  const notifications = await db.notification.findMany({
    where: { userId: user.id, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  const unreadCount = await db.notification.count({
    where: { userId: user.id, read: false },
  })
  return ok({ notifications, unreadCount })
})

// POST /api/notifications — mark as read (body: { id } or { all: true })
export const POST = withHandler(async (req: NextRequest) => {
  const user = await requireUser()
  const body = await req.json().catch(() => ({}))
  const { id, all } = body as { id?: string; all?: boolean }
  if (all) {
    await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } })
    return ok({ success: true, updated: 'all' })
  }
  if (id) {
    await db.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } })
    return ok({ success: true, updated: id })
  }
  return fail('Provide { id } or { all: true }')
})
