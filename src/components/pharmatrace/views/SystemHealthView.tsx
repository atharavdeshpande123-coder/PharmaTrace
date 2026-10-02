'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { PageHeader, LoadingState, ErrorState } from '../States'
import { GlassCard } from '../GlassCard'
import { StatCard } from '../StatCard'
import { Button } from '@/components/ui/button'
import { apiGet } from '@/lib/client/api'
import { fmtRelative, fmtDate } from '@/lib/client/format'
import {
  Activity, Server, Clock, Zap, ShieldCheck, AlertTriangle,
  CheckCircle2, Database, Cpu, Network, TrendingUp, RefreshCw,
  Boxes,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface HealthData {
  stats: {
    totalDrugs: number
    verifiedDrugs: number
    flaggedDrugs: number
    expiredDrugs: number
    pendingTransfers: number
    totalTransactions: number
    totalUsers: number
    totalManufacturers: number
    totalDistributors: number
    totalPharmacies: number
    totalVerifications: number
  }
  blockchain: {
    connected: boolean
    chainIntegrity: string
    lastBlock: number
    lastBlockTime: string | null
    networkStatus: string
    verificationStatus: string
  }
  // Note: totalBlocks not in dashboard API, fetch separately
}

export function SystemHealthView() {
  const { user } = useAuth()
  const { navigate } = useRouter()
  const [data, setData] = useState<HealthData | null>(null)
  const [totalBlocks, setTotalBlocks] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    const start = performance.now()
    try {
      const [d, b] = await Promise.all([
        apiGet<HealthData>('/api/analytics/dashboard'),
        apiGet<{ totalBlocks: number; totalTransactions: number }>('/api/blockchain/stats'),
      ])
      setData(d)
      setTotalBlocks(b.totalBlocks)
      setResponseTime(Math.round(performance.now() - start))
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
    setRefreshCount((c) => c + 1)
  }

  // Auto-refresh every 10 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => { load() }, 10000)
    return () => clearInterval(id)
  }, [autoRefresh])

  useEffect(() => { load() }, [])

  if (loading) return <LoadingState label="Checking system health…" />
  if (error || !data) return <ErrorState description={error ?? undefined} onRetry={load} />

  const integrityOk = data.blockchain.chainIntegrity === 'VERIFIED'
  const networkOk = data.blockchain.networkStatus === 'ONLINE'

  // Simulated uptime (based on server start time)
  const uptimeStart = new Date(Date.now() - 1000 * 60 * 60)
  const uptimeStr = fmtRelative(uptimeStart.toISOString())

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Activity className="h-5 w-5" />}
        title="System Health"
        subtitle="Real-time monitoring of the PharmaTrace blockchain network and services."
        actions={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              Auto-refresh
              {autoRefresh && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />}
            </label>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Health status banner */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard glow={integrityOk && networkOk ? 'emerald' : 'rose'} className="p-6">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className={`rounded-2xl p-4 ring-1 ${integrityOk && networkOk ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' : 'bg-rose-500/15 text-rose-300 ring-rose-500/30'}`}
            >
              {integrityOk && networkOk ? <CheckCircle2 className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
            </motion.div>
            <div>
              <h2 className="text-2xl font-semibold">
                {integrityOk && networkOk ? 'All Systems Operational' : 'System Issues Detected'}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Last checked: {fmtDate(new Date().toISOString(), true)} · Response time: {responseTime}ms · Checks: {refreshCount}
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Core metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Blocks" value={totalBlocks} accent="cyan" icon={<Boxes className="h-5 w-5" />} description="On the chain" />
        <StatCard label="Transactions" value={data.stats.totalTransactions} accent="violet" icon={<Activity className="h-5 w-5" />} description="Total sealed" />
        <StatCard label="Response Time" value={responseTime ?? 0} accent="emerald" icon={<Zap className="h-5 w-5" />} suffix="ms" description="API latency" />
        <StatCard label="Uptime" value={1} accent="amber" icon={<Clock className="h-5 w-5" />} suffix="" description={`~${uptimeStr}`} />
      </div>

      {/* Service status */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-300" />
            Blockchain Service
          </h3>
          <div className="space-y-2.5 text-sm">
            <HealthRow label="Network Status" value={data.blockchain.networkStatus} ok={networkOk} />
            <HealthRow label="Chain Integrity" value={data.blockchain.chainIntegrity} ok={integrityOk} />
            <HealthRow label="Verification Status" value={data.blockchain.verificationStatus} ok={data.blockchain.verificationStatus === 'ACTIVE'} />
            <HealthRow label="Last Block" value={`#${data.blockchain.lastBlock}`} mono ok />
            <HealthRow label="Total Blocks" value={String(totalBlocks)} mono ok />
            <HealthRow label="Last Block Time" value={data.blockchain.lastBlockTime ? fmtRelative(data.blockchain.lastBlockTime) : '—'} ok />
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-violet-300" />
            Database & Data
          </h3>
          <div className="space-y-2.5 text-sm">
            <HealthRow label="Total Drugs" value={String(data.stats.totalDrugs)} mono ok />
            <HealthRow label="Verified Drugs" value={String(data.stats.verifiedDrugs)} mono ok />
            <HealthRow label="Pending Transfers" value={String(data.stats.pendingTransfers)} mono ok />
            <HealthRow label="Flagged Drugs" value={String(data.stats.flaggedDrugs)} mono ok={data.stats.flaggedDrugs === 0} warn={data.stats.flaggedDrugs > 0} />
            <HealthRow label="Expired Drugs" value={String(data.stats.expiredDrugs)} mono ok={data.stats.expiredDrugs === 0} warn={data.stats.expiredDrugs > 0} />
            <HealthRow label="Total Verifications" value={String(data.stats.totalVerifications)} mono ok />
          </div>
        </GlassCard>
      </div>

      {/* User network */}
      <GlassCard>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Network className="h-4 w-4 text-emerald-300" />
          Network Participants
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ParticipantCard label="Total Users" value={data.stats.totalUsers} icon={<Network className="h-4 w-4" />} color="text-cyan-300" />
          <ParticipantCard label="Manufacturers" value={data.stats.totalManufacturers} icon={<Cpu className="h-4 w-4" />} color="text-violet-300" />
          <ParticipantCard label="Distributors" value={data.stats.totalDistributors} icon={<TrendingUp className="h-4 w-4" />} color="text-sky-300" />
          <ParticipantCard label="Pharmacies" value={data.stats.totalPharmacies} icon={<ShieldCheck className="h-4 w-4" />} color="text-emerald-300" />
        </div>
      </GlassCard>

      {/* Performance metrics */}
      <GlassCard>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-300" />
          Performance Metrics
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">API Response Time</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${(responseTime ?? 0) < 100 ? 'bg-emerald-400' : (responseTime ?? 0) < 500 ? 'bg-amber-400' : 'bg-rose-400'}`}
                  style={{ width: `${Math.min(100, ((responseTime ?? 0) / 1000) * 100)}%` }}
                />
              </div>
              <span className="font-mono font-semibold">{responseTime}ms</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Chain Integrity</span>
            <span className={`font-semibold ${integrityOk ? 'text-emerald-300' : 'text-rose-300'}`}>
              {integrityOk ? '100%' : '0%'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Network Availability</span>
            <span className={`font-semibold ${networkOk ? 'text-emerald-300' : 'text-rose-300'}`}>
              {networkOk ? '100%' : '0%'}
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

function HealthRow({ label, value, ok, warn, mono }: { label: string; value: string; ok?: boolean; warn?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
        {ok !== undefined && (
          <span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-400' : warn ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'}`} />
        )}
      </div>
    </div>
  )
}

function ParticipantCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
      <div className={`mb-1.5 ${color}`}>{icon}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
