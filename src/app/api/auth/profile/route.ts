import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, requireUser, publicUser, signToken, setAuthCookie } from '@/lib/auth/server'
import { fail, ok, withHandler } from '@/lib/api'

/**
 * PATCH /api/auth/profile
 *
 * Updates the current user's profile (name, organization, location, avatarColor).
 * Email and role cannot be changed here (email is the unique identifier, role
 * changes should be admin-only). Re-issues the JWT so the new name appears in
 * the token payload.
 *
 * Body: { name?, organization?, location?, avatarColor? }
 */
export const PATCH = withHandler(async (req: NextRequest) => {
  const user = await requireUser()
  const body = await req.json().catch(() => ({})) as {
    name?: string; organization?: string | null; location?: string | null; avatarColor?: string
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim().length >= 2) updates.name = body.name.trim()
  if ('organization' in body) updates.organization = body.organization ?? null
  if ('location' in body) updates.location = body.location ?? null
  if (typeof body.avatarColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.avatarColor)) {
    updates.avatarColor = body.avatarColor
  }

  if (Object.keys(updates).length === 0) {
    return fail('No valid fields to update')
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: updates,
    select: {
      id: true, email: true, name: true, role: true, organization: true,
      location: true, avatarColor: true, createdAt: true,
    },
  })

  // Re-issue JWT with updated name
  const token = signToken({
    sub: updated.id,
    email: updated.email,
    role: updated.role as never,
    name: updated.name,
  })
  await setAuthCookie(token)

  return ok({ user: publicUser(updated) })
})

/**
 * GET /api/auth/profile — returns the current user's full profile (same as /me)
 */
export const GET = withHandler(async () => {
  const user = await getCurrentUser()
  if (!user) return fail('Unauthorized', 401)
  return ok({ user })
})
