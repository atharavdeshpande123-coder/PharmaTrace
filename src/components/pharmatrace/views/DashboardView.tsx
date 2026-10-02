'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/store/auth'
import { useRouter } from '@/store/router'
import { StatCard } from '../StatCard'
import { GlassCard } from '../GlassCard'
import { PageHeader, LoadingState, ErrorState } from '../States'
import { StatusBadge, TxTypeBadge, VerificationBadge } from '../Badges'
import { apiGet } from '@/lib/client/api'
import { shortHash, fmtDate, fmtRelative } from '@/lib/client/format'
import {
  Boxes, ShieldCheck, Truck, AlertTriangle, Activity, Network,
  Package, ArrowRight, CheckCircle2, XCircle, Clock, Cpu,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface DashboardData {
  stats: {
    totalDrugs: number
    verifiedDrugs: number
    pendingTransfers: number
    expiredDrugs: number
    flaggedDrugs: number
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
    lastBlockHash: string | null
    lastBlockTime: string | null
    networkStatus: string
    verificationStatus: string
  }
  recentDrugs: Array<{
    id: string; drugId: string; drugName: string; batchNumber: string; status: string
    manufacturer: { name: string; organization: string | null }
    currentOwner: { name: string; organization: string | null }
    createdAt: string
  }>
  recentTransactions: Array<{
    id: string; transactionHash: string; type: string; timestamp: string
    drug: { drugId: string; drugName: string; batchNumber: string } | null
    block: { blockNumber: number; hash: string } | null
  }>
  recentVerifications: Array<{
    id: string; result: string; verificationMethod: string; timestamp: string
    drug: { drugId: string; drugName: string; batchNumber: string } | null
  }>
}

export function DashboardView() {
  const { user, loading: authLoading } = useAuth()
  const { navigate } = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const d = await apiGet<DashboardData>('/api/analytics/dashboard')
      setData(d)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  if (authLoading || (!user && loading)) return <LoadingState label="Loading dashboard…" />
  if (!user) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-muted-foreground">Please sign in to access your dashboard.</p>
        <Button className="mt-4" onClick={() => navigate('login')}>Sign in</Button>
      </div>
    )
  }
  if (loading) return <LoadingState label="Loading dashboard…" />
  if (error || !data) return <ErrorState description={error ?? undefined} onRetry={load} />

  const { stats, blockchain, recentDrugs, recentTransactions, recentVerifications } = data

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Boxes className="h-5 w-5" />}
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        subtitle="Your pharmaceutical supply chain is being monitored."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('register-drug')}>
              <Package className="h-4 w-4 mr-1.5" /> Register Drug
            </Button>
            <Button size="sm" onClick={() => navigate('verify')}>
              <ShieldCheck className="h-4 w-4 mr-1.5" /> Verify
            </Button>
          </div>
        }
      />

      {/* Blockchain status strip */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard glow="cyan" className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatusItem label="Blockchain" value={blockchain.connected ? 'CONNECTED' : 'OFFLINE'} ok={blockchain.connected} icon={<Network className="h-4 w-4" />} />
            <StatusItem label="Chain Integrity" value={blockchain.chainIntegrity} ok={blockchain.chainIntegrity === 'VERIFIED'} icon={<ShieldCheck className="h-4 w-4" />} />
            <StatusItem label="Last Block" value={`#${blockchain.lastBlock}`} icon={<Cpu className="h-4 w-4" />} mono />
            <StatusItem label="Network" value={blockchain.networkStatus} ok={blockchain.networkStatus === 'ONLINE'} icon={<Activity className="h-4 w-4" />} />
            <StatusItem label="Verification" value={blockchain.verificationStatus} ok icon={<CheckCircle2 className="h-4 w-4" />} />
          </div>
        </GlassCard>
      </motion.div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Drugs" value={stats.totalDrugs} accent="cyan" icon={<Boxes className="h-5 w-5" />} />
        <StatCard label="Verified" value={stats.verifiedDrugs} accent="emerald" icon={<ShieldCheck className="h-5 w-5" />} />
        <StatCard label="In Transit" value={stats.pendingTransfers} accent="violet" icon={<Truck className="h-5 w-5" />} />
        <StatCard label="Expired" value={stats.expiredDrugs} accent="amber" icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Flagged" value={stats.flaggedDrugs} accent="rose" icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Transactions" value={stats.totalTransactions} accent="sky" icon={<Activity className="h-5 w-5" />} />
      </div>

      {user.role === 'ADMIN' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Users" value={stats.totalUsers} accent="cyan" icon={<Boxes className="h-5 w-5" />} />
          <StatCard label="Manufacturers" value={stats.totalManufacturers} accent="violet" icon={<Package className="h-5 w-5" />} />
          <StatCard label="Distributors" value={stats.totalDistributors} accent="sky" icon={<Truck className="h-5 w-5" />} />
          <StatCard label="Pharmacies" value={stats.totalPharmacies} accent="emerald" icon={<ShieldCheck className="h-5 w-5" />} />
        </div>
      )}

      {/* Recent activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Transactions</h3>
            <button onClick={() => navigate('transactions')} className="text-xs text-primary hover:underline inline-flex items-center">
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No transactions yet.</p>
            ) : recentTransactions.map((tx) => (
              <button
                key={tx.id}
                onClick={() => {
                  if (tx.drug?.drugId) navigate('drug-detail', { id: tx.drug.drugId })
                  else if (tx.block?.blockNumber) navigate('blockchain-detail', { number: String(tx.block.blockNumber) })
                }}
                className="w-full flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-left hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <TxTypeBadge type={tx.type} />
                  <span className="text-sm truncate">{tx.drug?.drugName ?? '—'}</span>
                  <span className="text-xs text-muted-foreground font-mono">{tx.drug?.batchNumber}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground font-mono">#{tx.block?.blockNumber ?? '—'}</div>
                  <div className="text-[10px] text-muted-foreground">{fmtRelative(tx.timestamp)}</div>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Verifications</h3>
            <button onClick={() => navigate('analytics')} className="text-xs text-primary hover:underline inline-flex items-center">
              Analytics <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {recentVerifications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No verifications yet.</p>
            ) : recentVerifications.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  {v.result === 'AUTHENTIC' ? <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" /> :
                    v.result === 'NOT_FOUND' ? <XCircle className="h-4 w-4 text-rose-300 shrink-0" /> :
                    <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0" />}
                  <span className="text-sm truncate">{v.drug?.drugName ?? v.drug?.batchNumber ?? 'Unknown'}</span>
                </div>
                <div className="text-right shrink-0">
                  <VerificationBadge result={v.result} />
                  <div className="text-[10px] text-muted-foreground mt-0.5">{fmtRelative(v.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Recent drugs */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Recent Drug Batches</h3>
          <button onClick={() => navigate('drugs')} className="text-xs text-primary hover:underline inline-flex items-center">
            View all <ArrowRight className="h-3 w-3 ml-1" />
          </button>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
              <tr>
                <th className="py-2 pr-3">Drug</th>
                <th className="py-2 pr-3">Batch</th>
                <th className="py-2 pr-3 hidden md:table-cell">Manufacturer</th>
                <th className="py-2 pr-3 hidden md:table-cell">Owner</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3 hidden sm:table-cell">Registered</th>
              </tr>
            </thead>
            <tbody>
              {recentDrugs.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => navigate('drug-detail', { id: d.drugId })}
                  className="border-b border-border/40 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="py-2 pr-3 font-medium">{d.drugName}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{d.batchNumber}</td>
                  <td className="py-2 pr-3 hidden md:table-cell text-muted-foreground">{d.manufacturer.organization ?? d.manufacturer.name}</td>
                  <td className="py-2 pr-3 hidden md:table-cell text-muted-foreground">{d.currentOwner.organization ?? d.currentOwner.name}</td>
                  <td className="py-2 pr-3"><StatusBadge status={d.status} /></td>
                  <td className="py-2 pr-3 hidden sm:table-cell text-muted-foreground text-xs">{fmtDate(d.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}

function StatusItem({ label, value, ok, icon, mono }: {
  label: string; value: string; ok?: boolean; icon?: React.ReactNode; mono?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-lg p-2 ring-1 ${ok === false ? 'bg-rose-500/15 text-rose-300 ring-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'}`}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
        <div className={`text-sm font-semibold ${mono ? 'font-mono' : ''} ${ok === false ? 'text-rose-300' : 'text-emerald-300'}`}>
          {value}
        </div>
      </div>
    </div>
  )
}
