'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../States'
import { GlassCard } from '../GlassCard'
import { StatCard } from '../StatCard'
import { StatusBadge } from '../Badges'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiGet } from '@/lib/client/api'
import { fmtDate, fmtRelative } from '@/lib/client/format'
import {
  GitBranch, ArrowLeft, Boxes, Package, ShieldCheck, Truck,
  AlertTriangle, Activity, Network, Building2, MapPin, Calendar,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Manufacturer {
  id: string
  name: string
  organization: string | null
  location: string | null
  role: string
  createdAt: string
}

interface LineageDrug {
  id: string
  drugId: string
  drugName: string
  genericName: string | null
  batchNumber: string
  serialNumber: string
  manufacturingDate: string
  expiryDate: string
  quantity: number
  status: string
  currentLocation: string | null
  currentOwner: { name: string; organization: string | null; role: string }
  supplyChainEvents: { id: string; eventType: string; timestamp: string }[]
  transactions: { id: string; type: string; blockNumber: number | null }[]
  verifications: { id: string; result: string }[]
}

interface LineageStats {
  totalBatches: number
  totalQuantity: number
  verifiedCount: number
  inTransitCount: number
  deliveredCount: number
  flaggedCount: number
  expiredCount: number
  dispensedCount: number
  totalTransactions: number
  totalVerifications: number
}

interface LineageData {
  manufacturer: Manufacturer
  drugs: LineageDrug[]
  stats: LineageStats
}

interface DrugItem {
  id: string
  drugId: string
  drugName: string
  manufacturerName: string
  manufacturerId: string
  batchNumber: string
}

export function LineageView() {
  const { params, navigate } = useRouter()
  const [allDrugs, setAllDrugs] = useState<DrugItem[]>([])
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>(params.manufacturerId || '')
  const [data, setData] = useState<LineageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all drugs to populate manufacturer dropdown
  useEffect(() => {
    let cancelled = false
    apiGet<{ drugs: DrugItem[] }>('/api/drugs?limit=100')
      .then((res) => {
        if (cancelled) return
        setAllDrugs(res.drugs)
        // If no manufacturer selected, auto-select the first one
        if (!selectedManufacturerId && res.drugs.length > 0) {
          setSelectedManufacturerId(res.drugs[0].manufacturerId)
        }
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Load lineage data when manufacturer changes
  useEffect(() => {
    if (!selectedManufacturerId) { setData(null); return }
    let cancelled = false
    const run = async () => {
      try {
        setLoading(true); setError(null)
        const d = await apiGet<LineageData>(`/api/drugs/by-manufacturer/${selectedManufacturerId}`)
        if (!cancelled) setData(d)
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [selectedManufacturerId])

  // Get unique manufacturers from all drugs
  const manufacturers = allDrugs.reduce((acc, d) => {
    if (!acc.find((m) => m.id === d.manufacturerId)) {
      acc.push({ id: d.manufacturerId, name: d.manufacturerName })
    }
    return acc
  }, [] as { id: string; name: string }[])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('drugs')}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Drugs</Button>
      </div>
      <PageHeader
        icon={<GitBranch className="h-5 w-5" />}
        title="Drug Lineage"
        subtitle="View all batches from a single manufacturer — the complete family tree of drug batches."
        actions={
          <Select value={selectedManufacturerId} onValueChange={setSelectedManufacturerId}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Select manufacturer" /></SelectTrigger>
            <SelectContent>
              {manufacturers.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {loading && !data ? <LoadingState label="Loading lineage…" /> :
       error ? <ErrorState description={error} /> :
       !data ? <GlassCard><EmptyState icon={<GitBranch className="h-6 w-6 text-muted-foreground" />} title="Select a manufacturer" description="Choose a manufacturer to see all their registered drug batches." /></GlassCard> : (
        <>
          {/* Manufacturer info card */}
          <GlassCard glow="violet">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-violet-500/15 p-4 ring-1 ring-violet-500/30 text-violet-300 shrink-0">
                <Building2 className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{data.manufacturer.organization ?? data.manufacturer.name}</h2>
                <p className="text-sm text-muted-foreground">{data.manufacturer.name}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {data.manufacturer.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {data.manufacturer.location}</span>}
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Joined {fmtDate(data.manufacturer.createdAt)}</span>
                  <span className="flex items-center gap-1"><Network className="h-3 w-3" /> Manufacturer ID: {data.manufacturer.id.slice(-8)}</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Stats grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total Batches" value={data.stats.totalBatches} accent="cyan" icon={<Boxes className="h-5 w-5" />} />
            <StatCard label="Total Quantity" value={data.stats.totalQuantity} accent="violet" icon={<Package className="h-5 w-5" />} />
            <StatCard label="Delivered" value={data.stats.deliveredCount} accent="emerald" icon={<ShieldCheck className="h-5 w-5" />} />
            <StatCard label="Flagged" value={data.stats.flaggedCount} accent="rose" icon={<AlertTriangle className="h-5 w-5" />} />
            <StatCard label="Transactions" value={data.stats.totalTransactions} accent="amber" icon={<Activity className="h-5 w-5" />} />
          </div>

          {/* Timeline / family tree */}
          <GlassCard>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-cyan-300" />
              Batch Family Tree
            </h3>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/60 via-violet-500/60 to-emerald-500/60" />
              <div className="space-y-3">
                {data.drugs.map((d, i) => {
                  const isExpired = new Date() > new Date(d.expiryDate)
                  const isFlagged = d.status === 'FLAGGED'
                  const color = isFlagged ? 'rose' : isExpired ? 'amber' : d.status === 'DISPENSED' ? 'emerald' : 'cyan'
                  const colorMap: Record<string, string> = {
                    cyan: 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/40',
                    violet: 'bg-violet-500/15 text-violet-300 ring-violet-500/40',
                    emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
                    amber: 'bg-amber-500/15 text-amber-300 ring-amber-500/40',
                    rose: 'bg-rose-500/15 text-rose-300 ring-rose-500/40',
                  }
                  return (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative pl-12"
                    >
                      <div className={`absolute left-3 top-3 h-4 w-4 rounded-full ring-2 ${colorMap[color]}`} />
                      <div
                        className="rounded-lg border border-border/50 bg-muted/20 p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => navigate('drug-detail', { id: d.drugId })}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-sm">{d.drugName}</span>
                            <StatusBadge status={d.status} />
                          </div>
                          <div className="text-xs text-muted-foreground">{fmtDate(d.manufacturingDate)}</div>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground">
                          <span className="font-mono">{d.batchNumber}</span>
                          <span>Qty: {d.quantity}</span>
                          <span>{d.supplyChainEvents.length} events</span>
                          <span>{d.transactions.length} txs</span>
                          <span>{d.verifications.length} verifications</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Owner: {d.currentOwner.organization ?? d.currentOwner.name}
                          {d.currentLocation && ` · 📍 ${d.currentLocation}`}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </GlassCard>

          {/* Summary by status */}
          <GlassCard>
            <h3 className="font-semibold mb-3">Status Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <StatusRow icon={<ShieldCheck className="h-4 w-4" />} label="Delivered" count={data.stats.deliveredCount} color="text-emerald-300" />
              <StatusRow icon={<Truck className="h-4 w-4" />} label="In Transit" count={data.stats.inTransitCount} color="text-violet-300" />
              <StatusRow icon={<AlertTriangle className="h-4 w-4" />} label="Flagged" count={data.stats.flaggedCount} color="text-rose-300" />
              <StatusRow icon={<Calendar className="h-4 w-4" />} label="Expired" count={data.stats.expiredCount} color="text-amber-300" />
            </div>
          </GlassCard>
        </>
      )}
    </div>
  )
}

function StatusRow({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-3 flex items-center gap-2">
      <span className={color}>{icon}</span>
      <div>
        <div className={`text-lg font-bold ${color}`}>{count}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
