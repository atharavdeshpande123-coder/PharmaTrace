'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../States'
import { GlassCard } from '../GlassCard'
import { StatusBadge } from '../Badges'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiGet } from '@/lib/client/api'
import { fmtDate } from '@/lib/client/format'
import { Truck, Search, ArrowRight, Boxes, MapPin, Clock, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'

interface DrugItem {
  id: string; drugId: string; drugName: string; batchNumber: string
  status: string; currentLocation: string | null
  manufacturingDate: string; expiryDate: string; quantity: number
  manufacturer: { name: string; organization: string | null }
  currentOwner: { name: string; organization: string | null }
}

export function SupplyChainView() {
  const { navigate } = useRouter()
  const [drugs, setDrugs] = useState<DrugItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiGet<{ drugs: DrugItem[] }>(`/api/drugs?limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`)
      setDrugs(res.drugs)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [search])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Truck className="h-5 w-5" />}
        title="Supply Chain Tracking"
        subtitle="Track every drug batch through its supply-chain journey."
      />

      <GlassCard className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search batches…" className="pl-9" />
        </div>
      </GlassCard>

      {/* Flow legend */}
      <GlassCard className="bg-grid">
        <div className="flex flex-col md:flex-row items-stretch gap-3 md:items-center justify-between">
          {[
            { label: 'Manufacturer', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' },
            { label: 'Distributor', color: 'bg-violet-500/15 text-violet-300 border-violet-500/40' },
            { label: 'Wholesaler', color: 'bg-sky-500/15 text-sky-300 border-sky-500/40' },
            { label: 'Pharmacy', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
            { label: 'Customer', color: 'bg-amber-500/15 text-amber-300 border-amber-500/40' },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-2 md:flex-1 md:justify-center">
              <div className={`rounded-xl border px-3 py-2 text-xs font-medium ${s.color}`}>
                {i + 1}. {s.label}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {loading ? <LoadingState label="Loading batches…" /> :
        error ? <ErrorState description={error} onRetry={load} /> :
        drugs.length === 0 ? (
          <GlassCard><EmptyState title="No batches found" /></GlassCard>
        ) : (
          <div className="space-y-3">
            {drugs.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <button onClick={() => navigate('drug-detail', { id: d.drugId })} className="w-full text-left">
                  <GlassCard className="hover:-translate-y-0.5 transition-transform">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{d.drugName}</span>
                          <StatusBadge status={d.status} />
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground font-mono">{d.batchNumber}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {d.manufacturer.organization ?? d.manufacturer.name} → {d.currentOwner.organization ?? d.currentOwner.name}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <Meta icon={<Clock className="h-3 w-3" />} label="Mfg" value={fmtDate(d.manufacturingDate)} />
                        <Meta icon={<MapPin className="h-3 w-3" />} label="Location" value={d.currentLocation ?? '—'} />
                        <Meta icon={<Boxes className="h-3 w-3" />} label="Qty" value={String(d.quantity)} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-primary">
                        Track <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </GlassCard>
                </button>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  )
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider flex items-center gap-1">{icon}{label}</div>
      <div className="truncate">{value}</div>
    </div>
  )
}
