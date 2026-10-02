'use client'
import { useState } from 'react'
import { useRouter } from '@/store/router'
import { PageHeader, LoadingState, EmptyState, ErrorState } from '../States'
import { GlassCard } from '../GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiGet } from '@/lib/client/api'
import { fmtDate } from '@/lib/client/format'
import {
  Search, AlertTriangle, ExternalLink, Database,
  ShieldCheck, CheckCircle2, XCircle, Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface SourceInfo {
  dataSource: string
  sourceName: string
  sourceUrl: string
  retrievedAt: string
  sourceIdentifier: string
  country?: string
}

interface PharmaRecord {
  drugName: string
  genericName: string | null
  brandName: string | null
  dosageForm: string | null
  strength: string | null
  route: string | null
  activeIngredients: string | null
  purpose: string | null
  warnings: string | null
  manufacturerName: string | null
  manufacturerId: string | null
  ndc: string | null
  productType: string | null
  source: SourceInfo
}

interface SearchResult {
  results: PharmaRecord[]
  total: number
  source: string
  query: string
  retrievedAt: string
}

export function DrugSearchView() {
  const { navigate } = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SearchResult | null>(null)

  const search = async () => {
    if (query.trim().length < 2) {
      toast.error('Enter at least 2 characters')
      return
    }
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await apiGet<SearchResult>(`/api/drugs/search?q=${encodeURIComponent(query.trim())}`)
      setResult(res)
    } catch (e) {
      setError((e as Error).message || 'Live source temporarily unavailable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Search className="h-5 w-5" />}
        title="Search Real Pharmaceutical Database"
        subtitle="Search authoritative drug information from real regulatory sources (openFDA, CDSCO)."
      />

      {/* Search bar */}
      <GlassCard className="p-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter drug name, brand, NDC, or manufacturer (e.g. paracetamol, aspirin, ibuprofen)"
              className="pl-9"
              onKeyDown={(e) => { if (e.key === 'Enter') search() }}
            />
          </div>
          <Button onClick={search} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Search className="h-4 w-4 mr-1.5" />}
            SEARCH
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Data source: <strong className="text-cyan-300">openFDA (U.S. FDA)</strong> — Real regulatory drug data
        </p>
      </GlassCard>

      {/* Loading */}
      {loading && <LoadingState label="Querying real pharmaceutical database…" />}

      {/* Error */}
      {error && !loading && (
        <ErrorState
          title="LIVE SOURCE TEMPORARILY UNAVAILABLE"
          description={error}
          onRetry={search}
        />
      )}

      {/* No results */}
      {!loading && !error && result && result.results.length === 0 && (
        <GlassCard>
          <EmptyState
            icon={<XCircle className="h-6 w-6 text-amber-300" />}
            title="NO AUTHORITATIVE RECORD FOUND"
            description={`No results found for "${query}" from the configured authoritative source.`}
          />
        </GlassCard>
      )}

      {/* Results */}
      {!loading && !error && result && result.results.length > 0 && (
        <>
          <div className="text-sm text-muted-foreground">
            <span className="text-emerald-300 font-semibold">{result.total}</span> records found from{' '}
            <span className="text-cyan-300 font-semibold">{result.source}</span> ·
            Retrieved at: {fmtDate(result.retrievedAt, true)}
          </div>
          {result.results.map((drug, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard>
                {/* Source badge */}
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {drug.source.dataSource === 'openFDA' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-medium text-cyan-300 border border-cyan-500/30">
                        <Database className="h-3 w-3" /> FDA / openFDA SOURCE
                      </span>
                    )}
                    {drug.source.dataSource === 'CDSCO/SUGAM' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300 border border-violet-500/30">
                        <Database className="h-3 w-3" /> CDSCO VERIFIED SOURCE
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3" /> REAL RECORD
                    </span>
                  </div>
                  {drug.source.country && (
                    <span className="text-xs text-muted-foreground">{drug.source.country}</span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Product info */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">PRODUCT INFORMATION</h4>
                    <div className="space-y-1.5 text-sm">
                      <Row label="Drug Name" value={drug.drugName} />
                      <Row label="Brand Name" value={drug.brandName} />
                      <Row label="Generic Name" value={drug.genericName} />
                      <Row label="Strength" value={drug.strength} />
                      <Row label="Route" value={drug.route} />
                      <Row label="Product Type" value={drug.productType} />
                      <Row label="NDC" value={drug.ndc} mono />
                    </div>
                  </div>

                  {/* Manufacturer + Source */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">MANUFACTURER & SOURCE</h4>
                    <div className="space-y-1.5 text-sm">
                      <Row label="Manufacturer" value={drug.manufacturerName} />
                      <Row label="Manufacturer ID" value={drug.manufacturerId} mono />
                      <Row label="Source" value={drug.source.sourceName} />
                      <Row label="Source Identifier" value={drug.source.sourceIdentifier} mono />
                      <Row label="Retrieved At" value={fmtDate(drug.source.retrievedAt, true)} />
                    </div>
                    {drug.source.sourceUrl && (
                      <a href={drug.source.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> VIEW ORIGINAL SOURCE
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                {drug.warnings && (
                  <div className="mt-3 rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs">
                    <AlertTriangle className="h-3 w-3 inline mr-1 text-amber-300" />
                    <strong className="text-amber-300">Warnings:</strong> {drug.warnings.slice(0, 200)}
                    {drug.warnings.length > 200 ? '…' : ''}
                  </div>
                )}

                {/* Disclaimer */}
                <div className="mt-3 text-[10px] text-muted-foreground border-t border-border/40 pt-2">
                  Source: {drug.source.sourceName} · Country: {drug.source.country ?? 'N/A'} ·
                  This data is retrieved from a real authoritative source.
                  PharmaTrace does not claim FDA/CDSCO approval — only that the source record was found.
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </>
      )}

      {/* Empty initial state */}
      {!loading && !error && !result && (
        <GlassCard>
          <EmptyState
            icon={<Search className="h-6 w-6 text-cyan-300/60" />}
            title="Search Real Pharmaceutical Records"
            description="Enter a drug name above to search real FDA drug data. No demo or placeholder data — all results come from authoritative regulatory sources."
          />
        </GlassCard>
      )}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`${mono ? 'font-mono text-xs' : 'text-sm'} ${!value || value === 'null' ? 'text-muted-foreground italic' : ''}`}>
        {value && value !== 'null' ? value : 'NOT AVAILABLE FROM SOURCE'}
      </span>
    </div>
  )
}
