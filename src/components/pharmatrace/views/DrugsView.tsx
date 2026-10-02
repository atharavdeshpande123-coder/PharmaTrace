'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../States'
import { GlassCard } from '../GlassCard'
import { StatusBadge } from '../Badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiGet } from '@/lib/client/api'
import { fmtDate } from '@/lib/client/format'
import { Boxes, Search, PackagePlus, QrCode, ArrowRight, Plus, Download, GitCompare, GitBranch } from 'lucide-react'
import { motion } from 'framer-motion'
import { exportToCsv } from '@/lib/client/csv'
import { FavoriteButton } from '../FavoriteButton'

interface DrugListItem {
  id: string; drugId: string; drugName: string; genericName: string | null
  manufacturerName: string; batchNumber: string; serialNumber: string
  manufacturingDate: string; expiryDate: string; quantity: number
  drugCategory: string | null; dosageForm: string | null
  status: string; currentLocation: string | null
  manufacturer: { name: string; organization: string | null }
  currentOwner: { name: string; organization: string | null }
}

export function DrugsView() {
  const { navigate } = useRouter()
  const { user } = useAuth()
  const [drugs, setDrugs] = useState<DrugListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status !== 'ALL') params.set('status', status)
      const res = await apiGet<{ drugs: DrugListItem[] }>(`/api/drugs?${params}`)
      setDrugs(res.drugs)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [search, status])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Boxes className="h-5 w-5" />}
        title="Drug Batches"
        subtitle="Browse all pharmaceutical batches registered on the PharmaTrace ledger."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportToCsv(`pharmatrace-drugs-${new Date().toISOString().slice(0, 10)}.csv`, drugs.map((d) => ({
              drugId: d.drugId,
              drugName: d.drugName,
              genericName: d.genericName ?? '',
              manufacturerName: d.manufacturerName,
              batchNumber: d.batchNumber,
              serialNumber: d.serialNumber,
              manufacturingDate: new Date(d.manufacturingDate).toISOString().slice(0, 10),
              expiryDate: new Date(d.expiryDate).toISOString().slice(0, 10),
              quantity: d.quantity,
              status: d.status,
              currentLocation: d.currentLocation ?? '',
              owner: d.currentOwner.organization ?? d.currentOwner.name,
            })), [
              { key: 'drugId', label: 'Drug ID' },
              { key: 'drugName', label: 'Drug Name' },
              { key: 'genericName', label: 'Generic Name' },
              { key: 'manufacturerName', label: 'Manufacturer' },
              { key: 'batchNumber', label: 'Batch Number' },
              { key: 'serialNumber', label: 'Serial Number' },
              { key: 'manufacturingDate', label: 'Manufacturing Date' },
              { key: 'expiryDate', label: 'Expiry Date' },
              { key: 'quantity', label: 'Quantity' },
              { key: 'status', label: 'Status' },
              { key: 'currentLocation', label: 'Current Location' },
              { key: 'owner', label: 'Current Owner' },
            ])} disabled={drugs.length === 0}>
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('compare-drugs')}>
              <GitCompare className="h-4 w-4 mr-1.5" /> Compare
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('lineage')}>
              <GitBranch className="h-4 w-4 mr-1.5" /> Lineage
            </Button>
            {(user?.role === 'MANUFACTURER' || user?.role === 'ADMIN') && (
              <Button size="sm" onClick={() => navigate('register-drug')}>
                <PackagePlus className="h-4 w-4 mr-1.5" /> Register Drug
              </Button>
            )}
          </div>
        }
      />

      <GlassCard className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by drug name, batch, ID, manufacturer…"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {['REGISTERED', 'IN_TRANSIT', 'DELIVERED', 'VERIFIED', 'FLAGGED', 'EXPIRED', 'DISPENSED'].map((s) => (
                <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {loading ? <LoadingState label="Loading drugs…" /> :
        error ? <ErrorState description={error} onRetry={load} /> :
        drugs.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon={<Boxes className="h-6 w-6 text-muted-foreground" />}
              title="No drugs found"
              description="Try a different search or status filter, or register a new batch."
            />
          </GlassCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {drugs.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <DrugCard drug={d} onClick={() => navigate('drug-detail', { id: d.drugId })} />
              </motion.div>
            ))}
          </div>
        )}
    </div>
  )
}

function DrugCard({ drug, onClick }: { drug: DrugListItem; onClick: () => void }) {
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => { if (e.key === 'Enter') onClick() }} className="text-left w-full group/card relative cursor-pointer">
      {/* Shimmer sweep on hover */}
      <span className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden opacity-0 group-hover/card:opacity-100 transition-opacity">
        <span className="absolute -inset-y-4 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent skew-x-12 group-hover/card:translate-x-[300%] transition-transform duration-1000 ease-out" />
      </span>
      <GlassCard className="hover:-translate-y-0.5 transition-transform h-full relative">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">{drug.drugName}</span>
              <StatusBadge status={drug.status} />
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">{drug.genericName ?? drug.drugCategory ?? '—'}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <FavoriteButton drugId={drug.drugId} drugName={drug.drugName} />
            <div className="rounded-lg bg-primary/15 p-1.5 text-primary ring-1 ring-primary/30">
              <QrCode className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <Meta label="Batch" value={drug.batchNumber} mono />
          <Meta label="Qty" value={String(drug.quantity)} />
          <Meta label="Mfg" value={fmtDate(drug.manufacturingDate)} />
          <Meta label="Exp" value={fmtDate(drug.expiryDate)} />
          <Meta label="Manufacturer" value={drug.manufacturer.organization ?? drug.manufacturer.name} />
          <Meta label="Owner" value={drug.currentOwner.organization ?? drug.currentOwner.name} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">{drug.drugId.slice(0, 18)}…</span>
          <span className="text-primary inline-flex items-center">View <ArrowRight className="h-3 w-3 ml-0.5" /></span>
        </div>
      </GlassCard>
    </div>
  )
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</div>
      <div className={mono ? 'font-mono text-xs truncate' : 'truncate'}>{value}</div>
    </div>
  )
}
