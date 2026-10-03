import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  signToken,
  setAuthCookie,
  hashPassword,
  publicUser,
} from '@/lib/auth/server'
import { fail, ok, withHandler } from '@/lib/api'

const VALID_ROLES = [
  'MANUFACTURER',
  'DISTRIBUTOR',
  'WHOLESALER',
  'PHARMACY',
  'ADMIN',
  'CUSTOMER',
]
const AVATAR_COLORS = [
  '#22d3ee',
  '#a78bfa',
  '#34d399',
  '#fbbf24',
  '#fb7185',
  '#60a5fa',
  '#f472b6',
]

/**
 * POST /api/auth/register
 * Body: { name, email, password, role?, organization?, location? }
 *
 * - Supabase configured → creates a Supabase Auth user, then a PharmaTrace
 *   profile row (role, organization, etc.) linked via `supabaseUid`.
 * - Legacy fallback → bcrypt hash + Prisma User + JWT cookie.
 */
export const POST = withHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}))
  const { name, email, password, role, organization, location } = body as {
    name?: string
    email?: string
    password?: string
    role?: string
    organization?: string
    location?: string
  }
  if (!name || !email || !password)
    return fail('Missing required fields')
  if (password.length < 6)
    return fail('Password must be at least 6 characters')
  const userRole = (role ?? 'CUSTOMER').toUpperCase()
  if (!VALID_ROLES.includes(userRole)) return fail('Invalid role')

  const lowerEmail = email.toLowerCase()
  const avatarColor =
    AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]

  // ── Supabase path ────────────────────────────────────────────────
  if (isSupabaseConfigured) {
    // Lazy import to keep this route server-only.
    const { createServerSupabase } = await import('@/lib/supabase')
    const supabase = await createServerSupabase()
    if (!supabase) return fail('Auth service unavailable', 503)

    // Make sure no PharmaTrace profile already exists for this email.
    const existing = await db.user.findUnique({
      where: { email: lowerEmail },
      select: { id: true },
    })
    if (existing) return fail('Email is already registered', 409)

    const { data, error } = await supabase.auth.signUp({
      email: lowerEmail,
      password,
      options: {
        data: { name, role: userRole, avatarColor },
      },
    })
    if (error) {
      return fail(error.message || 'Supabase sign-up failed', 400)
    }
    const sbUser = data.user
    // Create the PharmaTrace profile row linked by supabaseUid.
    const user = await db.user.create({
      data: {
        name,
        email: lowerEmail,
        passwordHash: '',
        supabaseUid: sbUser?.id ?? null,
        role: userRole,
        organization: organization ?? null,
        location: location ?? null,
        avatarColor,
      },
    })
    return ok({
      user: publicUser(user),
      provider: 'supabase',
      // With email confirmations enabled, session may be null until verified.
      session: data.session ? { access_token: 'set' } : null,
    })
  }

  // ── Legacy fallback ─────────────────────────────────────────────
  const existing = await db.user.findUnique({
    where: { email: lowerEmail },
  })
  if (existing) return fail('Email is already registered', 409)
  const passwordHash = await hashPassword(password)
  const user = await db.user.create({
    data: {
      name,
      email: lowerEmail,
      passwordHash,
      role: userRole,
      organization: organization ?? null,
      location: location ?? null,
      avatarColor,
    },
  })
  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role as never,
    name: user.name,
  })
  await setAuthCookie(token)
  return ok({ user: publicUser(user), token, provider: 'legacy' })
})
