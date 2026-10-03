/**
 * Supabase clients — browser + server + admin.
 *
 * Configuration:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  (newer Supabase projects, sb_publishable_...)
 *     OR NEXT_PUBLIC_SUPABASE_ANON_KEY    (older projects, eyJ...)
 *   SUPABASE_SERVICE_ROLE_KEY             (server-only, bypasses RLS)
 *
 * When Supabase env vars are NOT set (e.g. local dev without Supabase),
 * `isSupabaseConfigured` returns false and the app falls back to the
 * legacy JWT + Prisma-User auth in `lib/auth/server.ts`.
 */
import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
// Newer Supabase projects expose a "publishable key" (sb_publishable_...);
// older projects expose an "anon key" (eyJ...). Both work with the JS SDK.
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''
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
 *
 * Note on Next.js 16 cookies() API: `cookies()` returns a
 * ReadonlyRequestCookies store. `.getAll()` is the correct method on the
 * store. In some Next 16 versions `cookies()` itself is async, so we await it.
 */
export async function createServerSupabase() {
  if (!isSupabaseConfigured) return null
  // Dynamic import keeps `next/headers` out of the browser bundle (it is
  // server-only). Awaited because Next.js 16 cookies() may be async.
  const { cookies } = await import('next/headers')
  const store = await cookies()
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return store.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          )
        } catch {
          // Called from a Server Component (read-only store) — safe to ignore;
          // the middleware refreshes the session on the next request.
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
