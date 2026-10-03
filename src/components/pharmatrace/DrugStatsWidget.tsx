'use client'
import { useEffect, useState } from 'react'
import { GlassCard } from './GlassCard'
import { LoadingState, ErrorState } from './States'
import { apiGet } from '@/lib/client/api'
import { fmtRelative } from '@/lib/client/format'
import {
  ShieldCheck, Truck, CheckCircle2, XCircle, AlertTriangle,
  Calendar, TrendingUp, Activity, Clock, Package,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DrugStats {
  drugId: string
  drugName: string
  batchNumber: string
  status: string
  verificationCount: number
  authenticCount: number
  failedCount: number
  expiredCount: number
  transferCount: number
  receiveCount: number
  daysSinceManufacture: number
  daysUntilExpiry: number
  shelfLifeTotalDays: number
  shelfLifeUsedPct: number
  lastVerification: string | null
  lastTransfer: string | null
  authenticityRate: number | null
}

export function DrugStatsWidget({ drugId }: { drugId: string }) {
  const [stats, setStats] = useState<DrugStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const s = await apiGet<DrugStats>(`/api/drugs/${drugId}/stats`)
        if (!cancelled) { setStats(s); setLoading(false) }
      } catch (e) {
        if (!cancelled) { setError((e as Error).message); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [drugId])

  if (loading) return <GlassCard><LoadingState label="Loading stats…" /></GlassCard>
  if (error || !stats) return <GlassCard><ErrorState description={error ?? undefined} /></GlassCard>

  const shelfColor =
    stats.shelfLifeUsedPct >= 100 ? 'rose' :
    stats.shelfLifeUsedPct >= 80 ? 'amber' :
    'emerald'
  const shelfColorMap: Record<string, { text: string; bg: string; bar: string }> = {
    emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/15', bar: 'bg-emerald-400' },
    amber: { text: 'text-amber-300', bg: 'bg-amber-500/15', bar: 'bg-amber-400' },
    rose: { text: 'text-rose-300', bg: 'bg-rose-500/15', bar: 'bg-rose-400' },
  }
  const sc = shelfColorMap[shelfColor]

  return (
    <GlassCard>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-cyan-300" />
        Batch Analytics
      </h3>

      {/* Mini stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <MiniStat
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Verifications"
          value={stats.verificationCount}
          accent="text-cyan-300"
          bg="bg-cyan-500/15"
        />
        <MiniStat
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Authentic"
          value={stats.authenticCount}
          accent="text-emerald-300"
          bg="bg-emerald-500/15"
        />
        <MiniStat
          icon={<Truck className="h-4 w-4" />}
          label="Transfers"
          value={stats.transferCount}
          accent="text-violet-300"
          bg="bg-violet-500/15"
        />
        <MiniStat
          icon={<Package className="h-4 w-4" />}
          label="Received"
          value={stats.receiveCount}
          accent="text-sky-300"
          bg="bg-sky-500/15"
        />
      </div>

      {/* Shelf life progress */}
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Shelf Life
          </span>
          <span className={cn('text-xs font-semibold', sc.text)}>
            {stats.shelfLifeUsedPct >= 100 ? 'Expired' : `${stats.shelfLifeUsedPct}% used`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.shelfLifeUsedPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full rounded-full', sc.bar)}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{stats.daysSinceManufacture} days since manufacture</span>
          <span>
            {stats.daysUntilExpiry < 0
              ? `${Math.abs(stats.daysUntilExpiry)} days past expiry`
              : `${stats.daysUntilExpiry} days remaining`}
          </span>
        </div>
      </div>

      {/* Authenticity rate */}
      {stats.authenticityRate != null && (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Authenticity Rate
            </span>
            <span className={cn(
              'text-sm font-bold',
              stats.authenticityRate >= 80 ? 'text-emerald-300' :
              stats.authenticityRate >= 50 ? 'text-amber-300' : 'text-rose-300'
            )}>
              {stats.authenticityRate}%
            </span>
          </div>
        </div>
      )}

      {/* Last activity */}
      <div className="space-y-1.5 text-xs">
        {stats.lastVerification && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Last verification
            </span>
            <span>{fmtRelative(stats.lastVerification)}</span>
          </div>
        )}
        {stats.lastTransfer && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Truck className="h-3 w-3" /> Last transfer
            </span>
            <span>{fmtRelative(stats.lastTransfer)}</span>
          </div>
        )}
        {stats.failedCount > 0 && (
          <div className="flex items-center justify-between text-amber-300">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" /> Failed/Flagged verifications
            </span>
            <span>{stats.failedCount}</span>
          </div>
        )}
      </div>
    </GlassCard>
  )
}

function MiniStat({ icon, label, value, accent, bg }: {
  icon: React.ReactNode; label: string; value: number; accent: string; bg: string
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
      <div className={cn('inline-flex rounded-md p-1.5 mb-1.5', bg, accent)}>{icon}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  )
}
