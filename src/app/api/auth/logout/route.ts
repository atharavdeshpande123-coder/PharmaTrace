import { isSupabaseConfigured } from '@/lib/supabase'
import { clearAuthCookie } from '@/lib/auth/server'
import { ok, withHandler } from '@/lib/api'

/**
 * POST /api/auth/logout
 * - Supabase → supabase.auth.signOut() + clear legacy cookie
 * - Legacy   → clear JWT cookie
 */
export const POST = withHandler(async () => {
  if (isSupabaseConfigured) {
    const { createServerSupabase } = await import('@/lib/supabase')
    const supabase = await createServerSupabase()
    if (supabase) {
      await supabase.auth.signOut()
    }
  }
  await clearAuthCookie()
  return ok({ success: true })
})
