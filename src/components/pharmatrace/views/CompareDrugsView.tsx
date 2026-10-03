'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { PageHeader, LoadingState, EmptyState, ErrorState } from '../States'
import { GlassCard } from '../GlassCard'
import { StatusBadge } from '../Badges'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiGet } from '@/lib/client/api'
import { fmtDate } from '@/lib/client/format'
import { GitCompare, Boxes, ShieldCheck, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DrugItem {
  id: string; drugId: string; drugName: string; genericName: string | null
  manufacturerName: string; batchNumber: string; serialNumber: string
  manufacturingDate: string; expiryDate: string; quantity: number
  drugCategory: string | null; dosageForm: string | null
  storageRequirement: string | null; manufacturingLocation: string | null
  status: string; currentLocation: string | null
  manufacturer: { name: string; organization: string | null }
  currentOwner: { name: string; organization: string | null; role: string }
}

interface DrugDetail {
  id: string
  status: string
  registrationBlockNumber: number | null
  supplyChainEvents: any[]
  transactions: any[]
  verifications: any[]
}

export function CompareDrugsView() {
  const { navigate } = useRouter()
  const [allDrugs, setAllDrugs] = useState<DrugItem[]>([])
  const [drugA, setDrugA] = useState<DrugItem | null>(null)
  const [drugB, setDrugB] = useState<DrugItem | null>(null)
  const [detailA, setDetailA] = useState<DrugDetail | null>(null)
  const [detailB, setDetailB] = useState<DrugDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<{ drugs: DrugItem[] }>('/api/drugs?limit=50')
      .then((res) => setAllDrugs(res.drugs))
      .finally(() => setLoading(false))
  }, [])

  // Fetch details when selections change
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!drugA) { if (!cancelled) setDetailA(null); return }
      try {
        const res = await apiGet<{ drug: DrugDetail }>(`/api/drugs/${drugA.drugId}`)
        if (!cancelled) setDetailA(res.drug)
      } catch { if (!cancelled) setDetailA(null) }
    }
    run()
    return () => { cancelled = true }
  }, [drugA])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!drugB) { if (!cancelled) setDetailB(null); return }
      try {
        const res = await apiGet<{ drug: DrugDetail }>(`/api/drugs/${drugB.drugId}`)
        if (!cancelled) setDetailB(res.drug)
      } catch { if (!cancelled) setDetailB(null) }
    }
    run()
    return () => { cancelled = true }
  }, [drugB])

  if (loading) return <LoadingState label="Loading drugs…" />

  const fields = [
    { key: 'drugName', label: 'Drug Name', mono: false },
    { key: 'genericName', label: 'Generic Name', mono: false },
    { key: 'manufacturerName', label: 'Manufacturer', mono: false },
    { key: 'batchNumber', label: 'Batch Number', mono: true },
    { key: 'serialNumber', label: 'Serial Number', mono: true },
    { key: 'drugCategory', label: 'Category', mono: false },
    { key: 'dosageForm', label: 'Dosage Form', mono: false },
    { key: 'quantity', label: 'Quantity', mono: false },
    { key: 'manufacturingDate', label: 'Manufacturing Date', mono: false, formatDate: true },
    { key: 'expiryDate', label: 'Expiry Date', mono: false, formatDate: true },
    { key: 'storageRequirement', label: 'Storage', mono: false },
    { key: 'manufacturingLocation', label: 'Mfg Location', mono: false },
    { key: 'currentLocation', label: 'Current Location', mono: false },
    { key: 'manufacturerOrg', label: 'Mfg Organization', mono: false },
    { key: 'currentOwnerOrg', label: 'Current Owner', mono: false },
  ] as const

  const getVal = (drug: DrugItem | null, key: string): string => {
    if (!drug) return '—'
    if (key === 'manufacturerOrg') return drug.manufacturer?.organization ?? drug.manufacturer?.name ?? '—'
    if (key === 'currentOwnerOrg') return drug.currentOwner?.organization ?? drug.currentOwner?.name ?? '—'
    const val = (drug as Record<string, unknown>)[key]
    if (val == null || val === '') return '—'
    return String(val)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('drugs')}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Drugs</Button>
      </div>
      <PageHeader
        icon={<GitCompare className="h-5 w-5" />}
        title="Compare Drug Batches"
        subtitle="Select two batches to compare their details side by side."
      />

      {/* Selectors */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Batch A</label>
          <Select
            value={drugA?.drugId ?? ''}
            onValueChange={(v) => setDrugA(allDrugs.find((d) => d.drugId === v) ?? null)}
          >
            <SelectTrigger><SelectValue placeholder="Select first batch" /></SelectTrigger>
            <SelectContent>
              {allDrugs.map((d) => (
                <SelectItem key={d.id} value={d.drugId}>{d.drugName} · {d.batchNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Batch B</label>
          <Select
            value={drugB?.drugId ?? ''}
            onValueChange={(v) => setDrugB(allDrugs.find((d) => d.drugId === v) ?? null)}
          >
            <SelectTrigger><SelectValue placeholder="Select second batch" /></SelectTrigger>
            <SelectContent>
              {allDrugs.map((d) => (
                <SelectItem key={d.id} value={d.drugId}>{d.drugName} · {d.batchNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comparison table */}
      {drugA && drugB ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="overflow-hidden p-0">
            {/* Header row */}
            <div className="grid grid-cols-3 gap-0 border-b border-border/60 bg-muted/30">
              <div className="p-3 text-xs uppercase tracking-wider text-muted-foreground">Field</div>
              <div className="p-3 border-l border-border/60">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{drugA.drugName}</span>
                  <StatusBadge status={drugA.status} />
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">{drugA.batchNumber}</div>
              </div>
              <div className="p-3 border-l border-border/60">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{drugB.drugName}</span>
                  <StatusBadge status={drugB.status} />
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">{drugB.batchNumber}</div>
              </div>
            </div>
            {/* Data rows */}
            {fields.map((field, i) => {
              const valA = field.formatDate ? fmtDate(getVal(drugA, field.key)) : getVal(drugA, field.key)
              const valB = field.formatDate ? fmtDate(getVal(drugB, field.key)) : getVal(drugB, field.key)
              const same = valA === valB
              return (
                <div
                  key={field.key}
                  className={cn('grid grid-cols-3 gap-0 border-b border-border/40 hover:bg-muted/20 transition-colors', i % 2 === 0 && 'bg-muted/10')}
                >
                  <div className="p-2.5 text-xs text-muted-foreground uppercase tracking-wider">{field.label}</div>
                  <div className={cn('p-2.5 border-l border-border/60 text-sm', field.mono && 'font-mono text-xs', !same && valA !== '—' && valB !== '—' && 'bg-amber-500/5')}>
                    {valA}
                  </div>
                  <div className={cn('p-2.5 border-l border-border/60 text-sm', field.mono && 'font-mono text-xs', !same && valA !== '—' && valB !== '—' && 'bg-amber-500/5')}>
                    {valB}
                  </div>
                </div>
              )
            })}
            {/* Blockchain stats row */}
            <div className="grid grid-cols-3 gap-0 border-b border-border/40">
              <div className="p-2.5 text-xs text-muted-foreground uppercase tracking-wider">Block #</div>
              <div className="p-2.5 border-l border-border/60 text-sm font-mono">{detailA?.registrationBlockNumber ?? '—'}</div>
              <div className="p-2.5 border-l border-border/60 text-sm font-mono">{detailB?.registrationBlockNumber ?? '—'}</div>
            </div>
            <div className="grid grid-cols-3 gap-0 border-b border-border/40">
              <div className="p-2.5 text-xs text-muted-foreground uppercase tracking-wider">Supply Events</div>
              <div className="p-2.5 border-l border-border/60 text-sm">{detailA?.supplyChainEvents.length ?? '—'}</div>
              <div className="p-2.5 border-l border-border/60 text-sm">{detailB?.supplyChainEvents.length ?? '—'}</div>
            </div>
            <div className="grid grid-cols-3 gap-0">
              <div className="p-2.5 text-xs text-muted-foreground uppercase tracking-wider">Verifications</div>
              <div className="p-2.5 border-l border-border/60 text-sm">{detailA?.verifications.length ?? '—'}</div>
              <div className="p-2.5 border-l border-border/60 text-sm">{detailB?.verifications.length ?? '—'}</div>
            </div>
          </GlassCard>

          {/* Summary */}
          <GlassCard className="mt-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Comparison Summary
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                <div className="text-xs text-muted-foreground mb-1">Identical fields</div>
                <div className="text-2xl font-bold text-emerald-300">
                  {fields.filter((f) => getVal(drugA, f.key) === getVal(drugB, f.key) && getVal(drugA, f.key) !== '—').length}
                </div>
              </div>
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                <div className="text-xs text-muted-foreground mb-1">Different fields</div>
                <div className="text-2xl font-bold text-amber-300">
                  {fields.filter((f) => getVal(drugA, f.key) !== getVal(drugB, f.key) && getVal(drugA, f.key) !== '—' && getVal(drugB, f.key) !== '—').length}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ) : (
        <GlassCard>
          <EmptyState
            icon={<GitCompare className="h-6 w-6 text-cyan-300/60" />}
            title="Select two batches to compare"
            description="Choose two drug batches from the dropdowns above to see a side-by-side comparison of all fields, blockchain records, and supply-chain history."
          />
        </GlassCard>
      )}
    </div>
  )
}
