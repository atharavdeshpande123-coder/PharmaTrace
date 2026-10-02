'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { apiGet } from '@/lib/client/api'
import { TxTypeBadge, VerificationBadge } from './Badges'
import { fmtRelative, shortHash } from '@/lib/client/format'
import { motion } from 'framer-motion'
import { Activity, ArrowRight, Clock } from 'lucide-react'

interface TxItem {
  id: string
  transactionHash: string
  type: string
  timestamp: string
  drug: { drugId: string; drugName: string; batchNumber: string } | null
  block: { blockNumber: number } | null
}

export function LandingActivityWidget() {
  const { navigate } = useRouter()
  const [txs, setTxs] = useState<TxItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await apiGet<{ transactions: TxItem[] }>('/api/blockchain/transactions?limit=6')
        if (!cancelled) { setTxs(res.transactions); setLoading(false) }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-300" />
          Live Blockchain Activity
        </h3>
        <button
          onClick={() => navigate('transactions')}
          className="text-xs text-primary hover:underline inline-flex items-center"
        >
          View all <ArrowRight className="h-3 w-3 ml-1" />
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded-lg skeleton-shimmer" />
          ))}
        </div>
      ) : txs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>
      ) : (
        <div className="space-y-1.5">
          {txs.map((tx, i) => (
            <motion.button
              key={tx.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => {
                if (tx.drug) navigate('drug-detail', { id: tx.drug.drugId })
                else if (tx.block) navigate('blockchain-detail', { number: String(tx.block.blockNumber) })
              }}
              className="w-full flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 hover:bg-muted/40 transition-colors text-left group"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <TxTypeBadge type={tx.type} />
                <span className="text-sm truncate">
                  {tx.drug?.drugName ?? 'Verification'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                <span className="font-mono">#{tx.block?.blockNumber ?? '—'}</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {fmtRelative(tx.timestamp)}
                </span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
