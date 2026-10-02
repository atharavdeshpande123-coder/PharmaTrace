import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signToken, setAuthCookie, hashPassword, publicUser } from '@/lib/auth/server'
import { fail, ok, withHandler } from '@/lib/api'

const VALID_ROLES = ['MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'PHARMACY', 'ADMIN', 'CUSTOMER']
const AVATAR_COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#60a5fa', '#f472b6']

export const POST = withHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}))
  const { name, email, password, role, organization, location } = body as {
    name?: string; email?: string; password?: string; role?: string
    organization?: string; location?: string
  }
  if (!name || !email || !password) return fail('Missing required fields')
  if (password.length < 6) return fail('Password must be at least 6 characters')
  const userRole = (role ?? 'CUSTOMER').toUpperCase()
  if (!VALID_ROLES.includes(userRole)) return fail('Invalid role')
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) return fail('Email is already registered', 409)
  const passwordHash = await hashPassword(password)
  const user = await db.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: userRole,
      organization: organization ?? null,
      location: location ?? null,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    },
  })
  const token = signToken({ sub: user.id, email: user.email, role: user.role as never, name: user.name })
  await setAuthCookie(token)
  return ok({ user: publicUser(user), token })
})
