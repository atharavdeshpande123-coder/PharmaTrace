import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { comparePassword, publicUser, setAuthCookie, signToken } from '@/lib/auth/server'
import { fail, ok, withHandler } from '@/lib/api'

export const POST = withHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}))
  const { email, password } = body as { email?: string; password?: string }
  if (!email || !password) return fail('Email and password are required')
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) return fail('Invalid email or password', 401)
  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) return fail('Invalid email or password', 401)
  const token = signToken({ sub: user.id, email: user.email, role: user.role as never, name: user.name })
  await setAuthCookie(token)
  return ok({ user: publicUser(user) })
})
