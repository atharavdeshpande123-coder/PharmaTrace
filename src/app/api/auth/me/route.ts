import { getCurrentUser, publicUser } from '@/lib/auth/server'
import { ok, withHandler } from '@/lib/api'

export const GET = withHandler(async () => {
  const user = await getCurrentUser()
  if (!user) return ok({ user: null })
  return ok({ user: publicUser(user) })
})
