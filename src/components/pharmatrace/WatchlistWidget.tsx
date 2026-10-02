'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { useWatchlist } from '@/store/watchlist'
import { GlassCard } from './GlassCard'
import { StatusBadge } from './Badges'
import { EmptyState, LoadingState } from './States'
import { apiGet } from '@/lib/client/api'
import { Star, ArrowRight, Boxes } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface FavDrug {
  id: string
  drugId: string
  drugName: string
  batchNumber: string
  status: string
  currentLocation: string | null
}

export function WatchlistWidget() {
  const { navigate } = useRouter()
  const { favorites, load, loaded } = useWatchlist()
  const [drugs, setDrugs] = useState<FavDrug[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [load])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!loaded || favorites.length === 0) {
        if (!cancelled) { setDrugs([]); setLoading(false) }
        return
      }
      try {
        const res = await apiGet<{ drugs: FavDrug[] }>('/api/drugs?limit=100')
        if (!cancelled) {
          setDrugs(res.drugs.filter((d) => favorites.includes(d.drugId)))
          setLoading(false)
        }
      } catch {
        if (!cancelled) { setDrugs([]); setLoading(false) }
      }
    }
    run()
    return () => { cancelled = true }
  }, [favorites, loaded])

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-300" />
          My Watchlist
          {favorites.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5">
              {favorites.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => navigate('drugs')}
          className="text-xs text-primary hover:underline inline-flex items-center"
        >
          Browse all <ArrowRight className="h-3 w-3 ml-1" />
        </button>
      </div>

      {loading ? (
        <LoadingState label="Loading watchlist…" />
      ) : drugs.length === 0 ? (
        <EmptyState
          icon={<Star className="h-6 w-6 text-amber-300/60" />}
          title="No favorites yet"
          description="Star drugs from the Drugs page to track them here."
          action={<Button size="sm" variant="outline" onClick={() => navigate('drugs')}><Boxes className="h-3.5 w-3.5 mr-1.5" /> Browse Drugs</Button>}
          className="py-6"
        />
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
          {drugs.map((d, i) => (
            <motion.button
              key={d.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate('drug-detail', { id: d.drugId })}
              className="w-full flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 hover:bg-muted/40 transition-colors text-left group"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Star className="h-3.5 w-3.5 text-amber-300 fill-amber-300/40 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{d.drugName}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">{d.batchNumber}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={d.status} />
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </GlassCard>
  )
}
