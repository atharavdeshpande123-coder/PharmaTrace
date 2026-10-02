import { clearAuthCookie } from '@/lib/auth/server'
import { ok, withHandler } from '@/lib/api'

export const POST = withHandler(async () => {
  await clearAuthCookie()
  return ok({ success: true })
})
