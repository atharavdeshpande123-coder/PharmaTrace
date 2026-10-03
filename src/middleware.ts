import { NextResponse, type NextRequest } from 'next/server'
import {
  createServerClient,
  type CookieOptions,
} from '@supabase/ssr'

/**
 * Middleware — refreshes the Supabase Auth session on each request so the
 * server components / route handlers always see the current user.
 *
 * Skips work entirely when Supabase env vars are not configured (local dev
 * with the legacy JWT fallback).
 */
export async function middleware(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Newer Supabase projects expose a "publishable key"; older ones expose an "anon key".
  const supabaseAnon =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnon) return NextResponse.next()

  const res = NextResponse.next({ request: req })

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        req.cookies.set({ name, value, ...options })
        res.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        req.cookies.set({ name, value: '', ...options })
        res.cookies.set({ name, value: '', ...options })
      },
    },
  })

  // Refreshing the session is enough; we don't gate routes here.
  await supabase.auth.getSession()
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets, Next internals, and
     * the public QR verify API (which must remain cookie-independent).
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
}
