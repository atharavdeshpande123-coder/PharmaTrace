/**
 * Supabase clients — browser + server + admin.
 *
 * Configuration:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY   (safe for browser)
 *   SUPABASE_SERVICE_ROLE_KEY       (server-only, bypasses RLS)
 *
 * When Supabase env vars are NOT set (e.g. local dev without Supabase),
 * `isSupabaseConfigured` returns false and the app falls back to the
 * legacy JWT + Prisma-User auth in `lib/auth/server.ts`.
 */
import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

/** True when both public Supabase env vars are present. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/** True when the server-side service-role key is present. */
export const isSupabaseAdminConfigured = Boolean(
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY,
)

/**
 * Browser Supabase client (uses NEXT_PUBLIC_* vars).
 * Safe to import from client components.
 */
export function createBrowserSupabase() {
  if (!isSupabaseConfigured) return null
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

/**
 * Server-side Supabase client using the anon key + the user's session
 * cookies (resolves the current user server-side via getUser()).
 * Use inside Server Components / Route Handlers.
 */
export function createServerSupabase() {
  if (!isSupabaseConfigured) return null
  // Lazy import to avoid loading cookies() in the browser bundle.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { cookies } = require('next/headers') as typeof import('next/headers')
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookies().getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookies().set(name, value, options),
          )
        } catch {
          // Called from a Server Component — safe to ignore (middleware refreshes).
        }
      },
    },
  })
}

/**
 * Admin Supabase client using the service-role key.
 * Server-only. Bypasses RLS. Use for seeding/looking-up users by id.
 */
export function createAdminSupabase() {
  if (!isSupabaseAdminConfigured) return null
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
