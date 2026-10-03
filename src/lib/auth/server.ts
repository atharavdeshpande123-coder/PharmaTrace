/**
 * Auth utilities — Supabase Auth (primary) + JWT/bcrypt fallback (legacy).
 *
 * ── Supabase mode (production / Vercel) ─────────────────────────────
 *   When NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are set,
 *   authentication is delegated to Supabase Auth. The browser uses the
 *   @supabase/ssr browser client; the server resolves the session via
 *   cookies and links the Supabase user (by `supabaseUid`) to a
 *   PharmaTrace `User` profile row (which holds the role + organization).
 *
 * ── Legacy mode (local dev without Supabase) ─────────────────────────
 *   Falls back to a JWT cookie (`pharmatrace_token`) + bcrypt password
 *   hash stored on the `User.passwordHash` column. This keeps the app
 *   runnable before Supabase credentials are configured.
 *
 * Tokens / sessions are stored in httpOnly cookies. Roles:
 *   MANUFACTURER, DISTRIBUTOR, WHOLESALER, PHARMACY, ADMIN, CUSTOMER
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import {
  createAdminSupabase,
  createServerSupabase,
  isSupabaseConfigured,
} from '@/lib/supabase'

const JWT_SECRET = process.env.JWT_SECRET || 'pharmatrace_dev_secret'
export const COOKIE_NAME = 'pharmatrace_token'

export type Role =
  | 'MANUFACTURER'
  | 'DISTRIBUTOR'
  | 'WHOLESALER'
  | 'PHARMACY'
  | 'ADMIN'
  | 'CUSTOMER'

export interface JwtPayload {
  sub: string
  email: string
  role: Role
  name: string
}

/* ------------------------------------------------------------------ */
/*  Password hashing (legacy fallback only)                           */
/* ------------------------------------------------------------------ */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  if (!hash) return false // Supabase-only account — no local password
  return bcrypt.compare(plain, hash)
}

/* ------------------------------------------------------------------ */
/*  Legacy JWT cookie helpers                                          */
/* ------------------------------------------------------------------ */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string) {
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearAuthCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function getAuthToken(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value
}

/* ------------------------------------------------------------------ */
/*  Current user resolution — Supabase first, then legacy JWT          */
/* ------------------------------------------------------------------ */
export async function getCurrentUser() {
  // 1) Supabase session (production / Vercel)
  if (isSupabaseConfigured) {
    const supabase = await createServerSupabase()
    if (supabase) {
      const {
        data: { user: sbUser },
      } = await supabase.auth.getUser()
      if (sbUser) {
        const profile = await db.user.findUnique({
          where: { supabaseUid: sbUser.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organization: true,
            location: true,
            avatarColor: true,
            createdAt: true,
          },
        })
        if (profile) return profile

        // Supabase user exists but no PharmaTrace profile yet → auto-provision
        // a CUSTOMER profile row so they can use the app immediately.
        const AVATAR_COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#60a5fa']
        const newProfile = await db.user.create({
          data: {
            email: sbUser.email ?? '',
            name:
              (sbUser.user_metadata as { name?: string } | null)?.name ??
              sbUser.email?.split('@')[0] ??
              'User',
            supabaseUid: sbUser.id,
            role: 'CUSTOMER',
            passwordHash: '',
            avatarColor:
              AVATAR_COLORS[
                Math.floor(Math.random() * AVATAR_COLORS.length)
              ],
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
          },
        })
        return newProfile
      }
      // No Supabase session — fall through to legacy JWT check
    }
  }

  // 2) Legacy JWT cookie
  const token = await getAuthToken()
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organization: true,
      location: true,
      avatarColor: true,
      createdAt: true,
    },
  })
  return user
}

/**
 * Require an authenticated user; throws an Error with code 'UNAUTHORIZED'
 * if no user is found. Used by API route handlers.
 */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    const err = new Error('UNAUTHORIZED') as Error & { status?: number }
    err.status = 401
    throw err
  }
  return user
}

/**
 * Require a user that has one of the supplied roles.
 */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser()
  if (!roles.includes(user.role as Role)) {
    const err = new Error('FORBIDDEN') as Error & { status?: number }
    err.status = 403
    throw err
  }
  return user
}

/* ------------------------------------------------------------------ */
/*  Public-safe user shape                                             */
/* ------------------------------------------------------------------ */
export function publicUser(user: {
  id: string
  email: string
  name: string
  role: string
  organization?: string | null
  location?: string | null
  avatarColor?: string | null
  createdAt: Date
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organization: user.organization ?? null,
    location: user.location ?? null,
    avatarColor: user.avatarColor ?? null,
    createdAt: user.createdAt,
  }
}

/* ------------------------------------------------------------------ */
/*  Supabase admin lookup (server-only)                               */
/* ------------------------------------------------------------------ */
/** Look up a Supabase Auth user by their id (server-only, uses service role). */
export async function getSupabaseUserById(uid: string) {
  const admin = createAdminSupabase()
  if (!admin) return null
  const { data } = await admin.auth.admin.getUserById(uid)
  return data?.user ?? null
}
