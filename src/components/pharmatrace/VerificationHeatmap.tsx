'use client'
import { useEffect, useState } from 'react'
import { GlassCard } from './GlassCard'
import { LoadingState } from './States'
import { apiGet } from '@/lib/client/api'
import { fmtDate } from '@/lib/client/format'
import { motion } from 'framer-motion'
import { Calendar, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerificationRecord {
  id: string
  timestamp: string
  result: string
}

interface DayCell {
  date: Date
  dateStr: string
  count: number
  results: { AUTHENTIC: number; NOT_FOUND: number; FLAGGED: number; EXPIRED: number }
}

/**
 * Verification Heatmap — GitHub-style activity calendar showing verification
 * activity over the last 12 weeks (84 days). Each cell is colored by the
 * number of verifications that day.
 */
export function VerificationHeatmap() {
  const [records, setRecords] = useState<VerificationRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await apiGet<{ byResult: { result: string; _count: number }[]; total: number }>('/api/analytics/verifications')
        if (cancelled) return
        // We need raw timestamps — the /api/analytics/verifications endpoint returns
        // timeseries grouped by day, but we need individual records. Let's fetch
        // transactions (DRUG_VERIFIED type) as a proxy for verification activity.
        const txRes = await apiGet<{ transactions: { id: string; timestamp: string; type: string }[] }>('/api/blockchain/transactions?limit=200')
        if (cancelled) return
        const verifTxs = txRes.transactions.filter((t) => t.type === 'DRUG_VERIFIED')
        setRecords(verifTxs.map((t) => ({ id: t.id, timestamp: t.timestamp, result: 'VERIFIED' })))
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return <GlassCard><LoadingState label="Loading heatmap…" /></GlassCard>

  // Build the last 84 days (12 weeks)
  const days: DayCell[] = []
  const now = new Date()
  now.setHours(23, 59, 59, 999)
  const dayMap = new Map<string, DayCell>()

  for (let i = 83; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const cell: DayCell = { date: new Date(d), dateStr, count: 0, results: { AUTHENTIC: 0, NOT_FOUND: 0, FLAGGED: 0, EXPIRED: 0 } }
    days.push(cell)
    dayMap.set(dateStr, cell)
  }

  // Populate from records
  for (const r of records) {
    const dateStr = new Date(r.timestamp).toISOString().slice(0, 10)
    const cell = dayMap.get(dateStr)
    if (cell) {
      cell.count++
      // We don't have the result from transactions, so just count total
    }
  }

  // Split into weeks (columns)
  const weeks: DayCell[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const maxCount = Math.max(1, ...days.map((d) => d.count))
  const totalThisPeriod = days.reduce((s, d) => s + d.count, 0)

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-muted/30'
    const ratio = count / maxCount
    if (ratio > 0.75) return 'bg-emerald-500/80'
    if (ratio > 0.5) return 'bg-emerald-500/60'
    if (ratio > 0.25) return 'bg-emerald-500/40'
    return 'bg-emerald-500/20'
  }

  const monthLabels = weeks.map((week, i) => {
    const firstDay = week[0]
    if (firstDay && firstDay.date.getDate() <= 7) {
      return fmtDate(firstDay.dateStr).slice(0, 3)
    }
    return ''
  })

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-300" />
          Verification Activity Heatmap
        </h3>
        <div className="text-xs text-muted-foreground">
          <span className="text-emerald-300 font-semibold">{totalThisPeriod}</span> verifications in last 84 days
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto scrollbar-thin pb-2">
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Month labels */}
          <div className="flex gap-1 mb-1">
            {monthLabels.map((m, i) => (
              <div key={i} className="w-3.5 text-[9px] text-muted-foreground text-center">
                {m}
              </div>
            ))}
          </div>
          {/* Weeks */}
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  <motion.div
                    key={di}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (wi * 7 + di) * 0.005, duration: 0.2 }}
                    className={cn(
                      'h-3.5 w-3.5 rounded-sm hover:ring-1 hover:ring-foreground/40 transition-all cursor-pointer',
                      getIntensity(day.count),
                    )}
                    title={`${fmtDate(day.dateStr)}: ${day.count} verification${day.count !== 1 ? 's' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <div className="h-2.5 w-2.5 rounded-sm bg-muted/30" />
          <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/20" />
          <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/40" />
          <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/60" />
          <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/80" />
          <span>More</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Peak day: {maxCount} verification{maxCount !== 1 ? 's' : ''}
        </div>
      </div>
    </GlassCard>
  )
}
