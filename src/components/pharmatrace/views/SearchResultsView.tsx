'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { PageHeader, LoadingState, EmptyState } from '../States'
import { GlassCard } from '../GlassCard'
import { TxTypeBadge, StatusBadge, VerificationBadge } from '../Badges'
import { Input } from '@/components/ui/input'
import { apiGet } from '@/lib/client/api'
import { fmtRelative, shortHash } from '@/lib/client/format'
import {
  Search, Boxes, Activity, Network, ArrowRight, FileText,
  ShieldCheck, LayoutDashboard, BarChart3, Truck, Info,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface SearchResult {
  id: string
  type: 'drug' | 'transaction' | 'block' | 'page'
  title: string
  subtitle: string
  badge?: string
  action: () => void
}

interface DrugItem { id: string; drugId: string; drugName: string; batchNumber: string; status: string }
interface TxItem { id: string; transactionHash: string; type: string; drug: { drugId: string; drugName: string; batchNumber: string } | null; block: { blockNumber: number } | null; timestamp: string }
interface BlockItem { blockNumber: number; hash: string; transactions: { id: string }[] }

export function SearchResultsView() {
  const { params, navigate } = useRouter()
  const initialQuery = params.q || ''
  const [query, setQuery] = useState(initialQuery)
  const [drugs, setDrugs] = useState<DrugItem[]>([])
  const [txs, setTxs] = useState<TxItem[]>([])
  const [blocks, setBlocks] = useState<BlockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)

  // Load all data once
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [d, t, b] = await Promise.all([
          apiGet<{ drugs: DrugItem[] }>('/api/drugs?limit=100'),
          apiGet<{ transactions: TxItem[] }>('/api/blockchain/transactions?limit=200'),
          apiGet<{ blocks: BlockItem[] }>('/api/blockchain/blocks?limit=50'),
        ])
        if (cancelled) return
        setDrugs(d.drugs)
        setTxs(t.transactions)
        setBlocks(b.blocks.map((blk: BlockItem) => ({ blockNumber: blk.blockNumber, hash: blk.hash, transactions: blk.transactions || [] })))
      } catch { /* ignore */ }
      finally { if (!cancelled) { setLoading(false); setSearched(true) } }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Filter results based on query
  const q = query.toLowerCase().trim()
  const filteredDrugs = q ? drugs.filter((d) =>
    d.drugName.toLowerCase().includes(q) ||
    d.drugId.toLowerCase().includes(q) ||
    d.batchNumber.toLowerCase().includes(q)
  ) : drugs.slice(0, 5)

  const filteredTxs = q ? txs.filter((t) =>
    t.transactionHash.toLowerCase().includes(q) ||
    (t.drug?.drugName ?? '').toLowerCase().includes(q) ||
    (t.drug?.batchNumber ?? '').toLowerCase().includes(q)
  ) : txs.slice(0, 5)

  const filteredBlocks = q ? blocks.filter((b) =>
    String(b.blockNumber).includes(q) ||
    b.hash.toLowerCase().includes(q)
  ) : blocks.slice(0, 5)

  // Page suggestions (static)
  const pageSuggestions = q ? [
    { route: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { route: 'verify', label: 'Verify Drug', icon: <ShieldCheck className="h-4 w-4" /> },
    { route: 'supply-chain', label: 'Supply Chain', icon: <Truck className="h-4 w-4" /> },
    { route: 'blockchain', label: 'Blockchain', icon: <Network className="h-4 w-4" /> },
    { route: 'transactions', label: 'Transactions', icon: <Activity className="h-4 w-4" /> },
    { route: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { route: 'drugs', label: 'Drug Batches', icon: <Boxes className="h-4 w-4" /> },
    { route: 'about', label: 'About', icon: <Info className="h-4 w-4" /> },
  ].filter((p) => p.label.toLowerCase().includes(q)) : []

  const totalResults = filteredDrugs.length + filteredTxs.length + filteredBlocks.length + pageSuggestions.length

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Search className="h-5 w-5" />}
        title="Search Results"
        subtitle={q ? `Searching for "${query}"` : 'Browse all drugs, transactions, blocks, and pages.'}
      />

      {/* Search input */}
      <GlassCard className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drugs, transactions, blocks, or pages…"
            className="pl-9"
            autoFocus
          />
        </div>
      </GlassCard>

      {loading ? <LoadingState label="Loading search index…" /> : (
        <>
          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {totalResults} result{totalResults !== 1 ? 's' : ''} {q && `for "${query}"`}
          </div>

          {/* Page suggestions */}
          {pageSuggestions.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Pages
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {pageSuggestions.map((p) => (
                  <motion.button
                    key={p.route}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => navigate(p.route as never)}
                    className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 hover:bg-muted/40 transition-colors text-sm text-left"
                  >
                    <span className="text-primary">{p.icon}</span>
                    <span className="flex-1">{p.label}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Drugs */}
          {filteredDrugs.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-2 flex items-center gap-1.5">
                <Boxes className="h-3.5 w-3.5" /> Drugs ({filteredDrugs.length})
              </h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {filteredDrugs.slice(0, 10).map((d) => (
                  <motion.button
                    key={d.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('drug-detail', { id: d.drugId })}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{d.drugName}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">{d.batchNumber}</div>
                    </div>
                    <StatusBadge status={d.status} />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Transactions */}
          {filteredTxs.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-2 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" /> Transactions ({filteredTxs.length})
              </h3>
              <div className="space-y-1.5">
                {filteredTxs.slice(0, 10).map((t) => (
                  <motion.button
                    key={t.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => t.drug ? navigate('drug-detail', { id: t.drug.drugId }) : t.block ? navigate('blockchain-detail', { number: String(t.block.blockNumber) }) : undefined}
                    className="w-full flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <TxTypeBadge type={t.type} />
                      <span className="text-sm truncate">{t.drug?.drugName ?? '—'}</span>
                      <span className="text-xs text-muted-foreground font-mono">{shortHash(t.transactionHash, 8, 4)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{fmtRelative(t.timestamp)}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Blocks */}
          {filteredBlocks.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-2 flex items-center gap-1.5">
                <Network className="h-3.5 w-3.5" /> Blocks ({filteredBlocks.length})
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredBlocks.slice(0, 9).map((b) => (
                  <motion.button
                    key={b.blockNumber}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => navigate('blockchain-detail', { number: String(b.blockNumber) })}
                    className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 hover:bg-muted/40 transition-colors text-left"
                  >
                    <Network className="h-4 w-4 text-cyan-300 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm">Block #{b.blockNumber}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">{shortHash(b.hash, 8, 4)}</div>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalResults === 0 && q && (
            <GlassCard>
              <EmptyState
                icon={<Search className="h-6 w-6 text-muted-foreground" />}
                title={`No results for "${query}"`}
                description="Try searching for a drug name, batch number, transaction hash, or block number."
              />
            </GlassCard>
          )}

          {/* No query — show all */}
          {!q && totalResults > 0 && (
            <GlassCard>
              <p className="text-sm text-muted-foreground text-center">
                Showing top results across all categories. Type above to filter.
              </p>
            </GlassCard>
          )}
        </>
      )}
    </div>
  )
}
