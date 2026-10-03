'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { apiGet } from '@/lib/client/api'
import { TxTypeBadge, VerificationBadge } from './Badges'
import { fmtRelative, shortHash } from '@/lib/client/format'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedItem {
  id: string
  kind: 'tx' | 'verif' | 'drug'
  timestamp: string
  title: string
  sublabel: string
  badge?: React.ReactNode
  navigateTo?: () => void
}

export function ActivityFeed({ pollMs = 15000 }: { pollMs?: number }) {
  const { navigate } = useRouter()
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pulse, setPulse] = useState(false)

  const load = async () => {
    try {
      const [d, v] = await Promise.all([
        apiGet<{ recentTransactions: any[]; recentVerifications: any[] }>('/api/analytics/dashboard'),
        apiGet<{ transactions: any[] }>('/api/blockchain/transactions?limit=15'),
      ])
      const txItems: FeedItem[] = (d.recentTransactions ?? []).slice(0, 6).map((tx: any) => ({
        id: 'tx-' + tx.id,
        kind: 'tx' as const,
        timestamp: tx.timestamp,
        title: tx.drug?.drugName ?? 'Verification',
        sublabel: `${tx.type.replace(/_/g, ' ').toLowerCase()} · #${tx.block?.blockNumber ?? '—'}`,
        badge: <TxTypeBadge type={tx.type} />,
        navigateTo: () => tx.drug ? navigate('drug-detail', { id: tx.drug.drugId }) : tx.block ? navigate('blockchain-detail', { number: String(tx.block.blockNumber) }) : undefined,
      }))
      const verifItems: FeedItem[] = (d.recentVerifications ?? []).slice(0, 4).map((v: any) => ({
        id: 'vf-' + v.id,
        kind: 'verif' as const,
        timestamp: v.timestamp,
        title: v.drug?.drugName ?? 'Unknown drug',
        sublabel: `${v.verificationMethod.replace(/_/g, ' ').toLowerCase()}`,
        badge: <VerificationBadge result={v.result} />,
        navigateTo: () => v.drug ? navigate('drug-detail', { id: v.drug.drugId }) : undefined,
      }))
      const merged = [...txItems, ...verifItems]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8)
      setItems(merged)
      setPulse(true)
      setTimeout(() => setPulse(false), 800)
    } catch (e) {
      // silent
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
    const id = setInterval(load, pollMs)
    return () => clearInterval(id)
  }, [pollMs])

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-300" />
          Live Activity Feed
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <span className={cn('h-1.5 w-1.5 rounded-full', pulse ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/40')} />
          {pulse ? 'Updated' : 'Live'}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading activity…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">No recent activity.</div>
      ) : (
        <div className="relative">
          {/* Pulsing line */}
          <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/40 via-violet-500/40 to-emerald-500/40" />
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {items.map((item, i) => (
                <motion.button
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  onClick={item.navigateTo}
                  className="relative w-full text-left flex items-center gap-3 pl-6 pr-3 py-2 rounded-lg hover:bg-muted/40 transition-colors group"
                >
                  <span className={cn(
                    'absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ring-2 ring-background',
                    item.kind === 'tx' ? 'bg-cyan-400' : item.kind === 'verif' ? 'bg-emerald-400' : 'bg-violet-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.badge}
                      <span className="text-sm font-medium truncate">{item.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{item.sublabel}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-muted-foreground">{fmtRelative(item.timestamp)}</div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity inline-block mt-0.5" />
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
