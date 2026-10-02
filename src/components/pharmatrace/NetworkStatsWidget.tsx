'use client'
import { useEffect, useState } from 'react'
import { GlassCard } from './GlassCard'
import { apiGet } from '@/lib/client/api'
import { fmtRelative } from '@/lib/client/format'
import { motion } from 'framer-motion'
import { Cpu, Zap, Network, Clock, Activity, Boxes } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NetStats {
  connected: boolean
  chainIntegrity: string
  lastBlock: number
  lastBlockHash: string | null
  lastBlockTime: string | null
  totalBlocks: number
  totalTransactions: number
  networkStatus: string
  verificationStatus: string
}

interface BlockInfo {
  blockNumber: number
  timestamp: string
  nonce: number
  transactions: any[]
}

export function NetworkStatsWidget() {
  const [stats, setStats] = useState<NetStats | null>(null)
  const [recentBlocks, setRecentBlocks] = useState<BlockInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [s, b] = await Promise.all([
          apiGet<NetStats>('/api/blockchain/stats'),
          apiGet<{ blocks: BlockInfo[] }>('/api/blockchain/blocks?limit=10'),
        ])
        if (cancelled) return
        setStats(s)
        setRecentBlocks(b.blocks.slice(0, 10).reverse()) // chronological for block-time calc
        setLoading(false)
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const id = setInterval(load, 20000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  if (loading || !stats) {
    return (
      <GlassCard>
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 mr-2 animate-spin" /> Loading network stats…
        </div>
      </GlassCard>
    )
  }

  // Calculate average block time from recent blocks
  let avgBlockTimeMs = 0
  if (recentBlocks.length >= 2) {
    const times = recentBlocks.map((b) => new Date(b.timestamp).getTime())
    const diffs = []
    for (let i = 1; i < times.length; i++) diffs.push(times[i] - times[i - 1])
    avgBlockTimeMs = diffs.reduce((a, b) => a + b, 0) / diffs.length
  }
  const avgBlockTimeStr = avgBlockTimeMs > 0
    ? avgBlockTimeMs < 1000 ? `${Math.round(avgBlockTimeMs)}ms` : `${(avgBlockTimeMs / 1000).toFixed(1)}s`
    : '—'

  // "Hash rate" — rough estimate based on avg nonce / avg block time
  const avgNonce = recentBlocks.length > 0
    ? recentBlocks.reduce((s, b) => s + b.nonce, 0) / recentBlocks.length
    : 0
  const hashRate = avgBlockTimeMs > 0 ? Math.round(avgNonce / (avgBlockTimeMs / 1000)) : 0
  const hashRateStr = hashRate > 1000 ? `${(hashRate / 1000).toFixed(1)}kH/s` : `${hashRate}H/s`

  // Simulated nodes
  const nodes = [
    { name: 'novaCure-mumbai', status: 'online', latency: 12 },
    { name: 'medicore-bangalore', status: 'online', latency: 18 },
    { name: 'astranova-hyderabad', status: 'online', latency: 22 },
    { name: 'xyzdist-pune', status: 'online', latency: 8 },
    { name: 'healthplus-pune', status: 'online', latency: 14 },
  ]

  return (
    <GlassCard glow="cyan" className="relative overflow-hidden">
      {/* Animated background pulse */}
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl animate-pulse-glow" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Network className="h-4 w-4 text-cyan-300" />
            Blockchain Network
          </h3>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em]">
            <motion.span
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-emerald-400"
            />
            <span className="text-emerald-300">Online</span>
          </div>
        </div>

        {/* Network metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Metric
            icon={<Boxes className="h-3.5 w-3.5" />}
            label="Block Height"
            value={`#${stats.lastBlock}`}
            accent="text-cyan-300"
          />
          <Metric
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Avg Block Time"
            value={avgBlockTimeStr}
            accent="text-violet-300"
          />
          <Metric
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Hash Rate"
            value={hashRateStr}
            accent="text-amber-300"
          />
          <Metric
            icon={<Cpu className="h-3.5 w-3.5" />}
            label="Avg Nonce"
            value={Math.round(avgNonce).toString()}
            accent="text-emerald-300"
          />
        </div>

        {/* Node network visualization */}
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">Network Nodes</div>
          <div className="space-y-1.5">
            {nodes.map((n, i) => (
              <motion.div
                key={n.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                  />
                  <span className="font-mono text-muted-foreground">{n.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{n.latency}ms</span>
                  <span className="text-emerald-300 text-[10px] uppercase">●</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Last block info */}
        {stats.lastBlockTime && (
          <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Last block: {fmtRelative(stats.lastBlockTime)}</span>
            <span className="font-mono">{stats.totalBlocks} blocks · {stats.totalTransactions} txs</span>
          </div>
        )}
      </div>
    </GlassCard>
  )
}

function Metric({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string; accent: string
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className={cn('text-sm font-bold tabular-nums', accent)}>{value}</div>
    </div>
  )
}
