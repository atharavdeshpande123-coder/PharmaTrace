/**
 * Auth store — keeps the current user + helper actions. Talks to the
 * `/api/auth/*` endpoints (which themselves delegate to Supabase when
 * configured). The user object is populated on first mount of the shell
 * via `/api/auth/me`.
 */

import { create } from 'zustand'

export interface AppUser {
  id: string
  email: string
  name: string
  role:
    | 'MANUFACTURER'
    | 'DISTRIBUTOR'
    | 'WHOLESALER'
    | 'PHARMACY'
    | 'ADMIN'
    | 'CUSTOMER'
  organization: string | null
  location: string | null
  avatarColor: string | null
  createdAt: string
}

interface AuthState {
  user: AppUser | null
  loading: boolean
  setUser: (user: AppUser | null) => void
  setLoading: (loading: boolean) => void
  fetchMe: () => Promise<AppUser | null>
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  fetchMe: async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      const data = await res.json()
      const user = data.user ?? null
      set({ user, loading: false })
      return user
    } catch {
      set({ user: null, loading: false })
      return null
    }
  },
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    set({ user: null })
  },
}))
