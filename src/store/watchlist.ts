'use client'
/**
 * Drug Watchlist store — persists favorite drug IDs to localStorage.
 * Used by the Dashboard "Watchlist" widget and the star toggle on drug cards/detail.
 */
import { create } from 'zustand'

const STORAGE_KEY = 'pharmatrace_watchlist'

interface WatchlistState {
  favorites: string[] // drugId values
  loaded: boolean
  load: () => void
  toggle: (drugId: string) => void
  isFavorite: (drugId: string) => boolean
  clear: () => void
}

export const useWatchlist = create<WatchlistState>((set, get) => ({
  favorites: [],
  loaded: false,
  load: () => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const favorites = raw ? JSON.parse(raw) : []
      set({ favorites: Array.isArray(favorites) ? favorites : [], loaded: true })
    } catch {
      set({ favorites: [], loaded: true })
    }
  },
  toggle: (drugId: string) => {
    if (typeof window === 'undefined') return
    const current = get().favorites
    const favorites = current.includes(drugId)
      ? current.filter((id) => id !== drugId)
      : [...current, drugId]
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)) } catch { /* ignore */ }
    set({ favorites })
  },
  isFavorite: (drugId: string) => get().favorites.includes(drugId),
  clear: () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    set({ favorites: [] })
  },
}))
