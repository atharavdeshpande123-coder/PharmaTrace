import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  comparePassword,
  publicUser,
  setAuthCookie,
  signToken,
} from '@/lib/auth/server'
import { fail, ok, withHandler } from '@/lib/api'

/**
 * POST /api/auth/login
 * Body: { email, password }
 *
 * - Supabase configured → supabase.auth.signInWithPassword; the @supabase/ssr
 *   browser client sets the session cookies automatically. The PharmaTrace
 *   profile row is resolved by the user's email.
 * - Legacy fallback → bcrypt verify + JWT cookie.
 */
export const POST = withHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}))
  const { email, password } = body as { email?: string; password?: string }
  if (!email || !password)
    return fail('Email and password are required')

  const lowerEmail = email.toLowerCase()

  // ── Supabase path ────────────────────────────────────────────────
  if (isSupabaseConfigured) {
    const { createServerSupabase } = await import('@/lib/supabase')
    const supabase = await createServerSupabase()
    if (!supabase) return fail('Auth service unavailable', 503)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: lowerEmail,
      password,
    })

    if (!error && data.user) {
      // Resolve the linked PharmaTrace profile row.
      let user = await db.user.findUnique({
        where: { email: lowerEmail },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organization: true,
          location: true,
          avatarColor: true,
          createdAt: true,
          supabaseUid: true,
        },
      })

      // Auto-link / auto-provision if the Supabase user has no profile yet.
      if (!user) {
        const AVATAR_COLORS = [
          '#22d3ee',
          '#a78bfa',
          '#34d399',
          '#fbbf24',
          '#fb7185',
          '#60a5fa',
        ]
        user = await db.user.create({
          data: {
            email: lowerEmail,
            name:
              (data.user.user_metadata as { name?: string } | null)?.name ??
              lowerEmail.split('@')[0] ??
              'User',
            supabaseUid: data.user.id,
            role: 'CUSTOMER',
            passwordHash: '',
            avatarColor:
              AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organization: true,
            location: true,
            avatarColor: true,
            createdAt: true,
            supabaseUid: true,
          },
        })
      } else if (!user.supabaseUid) {
        // Profile existed (legacy) — link it to this Supabase user.
        user = await db.user.update({
          where: { id: user.id },
          data: { supabaseUid: data.user.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organization: true,
            location: true,
            avatarColor: true,
            createdAt: true,
            supabaseUid: true,
          },
        })
      }

      return ok({ user: publicUser(user), provider: 'supabase' })
    }

    // Supabase auth failed — fall through to the legacy bcrypt check
    // below. This lets demo users (seeded directly in the DB with a
    // passwordHash but not in Supabase Auth) still log in.
  }

  // ── Legacy fallback (also reached when Supabase auth fails) ──────
  const user = await db.user.findUnique({ where: { email: lowerEmail } })
  if (!user) return fail('Invalid email or password', 401)
  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) return fail('Invalid email or password', 401)
  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role as never,
    name: user.name,
  })
  await setAuthCookie(token)
  return ok({ user: publicUser(user), provider: 'legacy' })
})
