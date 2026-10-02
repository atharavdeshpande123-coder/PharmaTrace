/**
 * Lightweight client-side router store. PharmaTrace is rendered as a
 * single Next.js page (`/`) — navigation happens client-side via this
 * store so the project complies with the "only one route" sandbox rule
 * while still feeling like a multi-page app to the user.
 *
 * Routes supported (mirrors the spec's route list):
 *   landing, login, register, dashboard, verify, verify-result,
 *   register-drug, supply-chain, blockchain, blockchain-detail,
 *   transactions, analytics, drugs, drug-detail, about, admin-users,
 *   profile
 */

import { create } from 'zustand'

export type RouteName =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'verify'
  | 'verify-result'
  | 'register-drug'
  | 'supply-chain'
  | 'blockchain'
  | 'blockchain-detail'
  | 'transactions'
  | 'analytics'
  | 'drugs'
  | 'drug-detail'
  | 'about'
  | 'admin-users'
  | 'profile'

interface RouteState {
  route: RouteName
  params: Record<string, string>
  navigate: (route: RouteName, params?: Record<string, string>) => void
}

export const useRouter = create<RouteState>((set) => ({
  route: 'landing',
  params: {},
  navigate: (route, params = {}) => {
    set({ route, params })
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },
}))

export function useNavigate() {
  return useRouter((s) => s.navigate)
}
