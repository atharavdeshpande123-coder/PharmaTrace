/**
 * Auth utilities — JWT issue/verify + bcrypt password hashing + role guards.
 *
 * Tokens are stored in an httpOnly cookie named `pharmatrace_token`.
 * Roles: MANUFACTURER, DISTRIBUTOR, WHOLESALER, PHARMACY, ADMIN, CUSTOMER
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

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

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

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

/**
 * Resolve the currently authenticated user (or null).
 */
export async function getCurrentUser() {
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

/**
 * Public-safe user shape (never exposes passwordHash).
 */
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
