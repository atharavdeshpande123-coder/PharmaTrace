'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../States'
import { GlassCard } from '../GlassCard'
import { TxTypeBadge } from '../Badges'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiGet } from '@/lib/client/api'
import { fmtDate, fmtRelative, shortHash, copyToClipboard } from '@/lib/client/format'
import { toast } from 'sonner'
import { Activity, Search, Hash, ArrowRight, Copy, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { exportToCsv } from '@/lib/client/csv'

interface TxItem {
  id: string
  transactionHash: string
  type: string
  drugId: string | null
  fromId: string | null
  toId: string | null
  data: string
  blockNumber: number | null
  timestamp: string
  drug: { drugId: string; drugName: string; batchNumber: string } | null
  block: { blockNumber: number; hash: string } | null
}

const TX_TYPES = ['DRUG_REGISTERED', 'DRUG_RECEIVED', 'DRUG_TRANSFERRED', 'DRUG_VERIFIED', 'DRUG_FLAGGED', 'DRUG_DISPENSED']

export function TransactionsView() {
  const { navigate } = useRouter()
  const [txs, setTxs] = useState<TxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('ALL')
  const [page, setPage] = useState(0)
  const pageSize = 12

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (type !== 'ALL') params.set('type', type)
      params.set('limit', '200')
      const res = await apiGet<{ transactions: TxItem[] }>(`/api/blockchain/transactions?${params}`)
      setTxs(res.transactions)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [search, type])
  useEffect(() => { setPage(0) }, [search, type])

  const totalPages = Math.max(1, Math.ceil(txs.length / pageSize))
  const paged = txs.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Activity className="h-5 w-5" />}
        title="Transaction History"
        subtitle="Every on-chain transaction, newest first."
        actions={
          <Button variant="outline" size="sm" onClick={() => exportToCsv(`pharmatrace-transactions-${new Date().toISOString().slice(0, 10)}.csv`, txs.map((t) => ({
            transactionHash: t.transactionHash,
            type: t.type,
            drugName: t.drug?.drugName ?? '',
            batchNumber: t.drug?.batchNumber ?? '',
            drugId: t.drug?.drugId ?? '',
            blockNumber: t.block?.blockNumber ?? '',
            timestamp: new Date(t.timestamp).toISOString(),
          })), [
            { key: 'transactionHash', label: 'Transaction Hash' },
            { key: 'type', label: 'Type' },
            { key: 'drugName', label: 'Drug Name' },
            { key: 'batchNumber', label: 'Batch Number' },
            { key: 'drugId', label: 'Drug ID' },
            { key: 'blockNumber', label: 'Block Number' },
            { key: 'timestamp', label: 'Timestamp (ISO)' },
          ])} disabled={txs.length === 0}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        }
      />

      <GlassCard className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by hash, drug, batch…" className="pl-9" />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="sm:w-56"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              {TX_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {loading ? <LoadingState label="Loading transactions…" /> :
        error ? <ErrorState description={error} onRetry={load} /> :
        txs.length === 0 ? (
          <GlassCard><EmptyState title="No transactions found" description="Try a different search or filter." /></GlassCard>
        ) : (
          <>
            <GlassCard>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                    <tr>
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Drug / Batch</th>
                      <th className="py-2 pr-3 hidden md:table-cell">Hash</th>
                      <th className="py-2 pr-3 hidden sm:table-cell">Block</th>
                      <th className="py-2 pr-3">Time</th>
                      <th className="py-2 pr-3 text-right">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((tx) => (
                      <tr
                        key={tx.id}
                        onClick={() => tx.drug ? navigate('drug-detail', { id: tx.drug.drugId }) : tx.block ? navigate('blockchain-detail', { number: String(tx.block.blockNumber) }) : null}
                        className="border-b border-border/40 hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="py-2 pr-3"><TxTypeBadge type={tx.type} /></td>
                        <td className="py-2 pr-3">
                          {tx.drug ? (
                            <div>
                              <div className="font-medium">{tx.drug.drugName}</div>
                              <div className="text-xs text-muted-foreground font-mono">{tx.drug.batchNumber}</div>
                            </div>
                          ) : '—'}
                        </td>
                        <td className="py-2 pr-3 hidden md:table-cell">
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(tx.transactionHash); toast.success('Hash copied') }} className="font-mono text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <Hash className="h-3 w-3" /> {shortHash(tx.transactionHash, 10, 6)} <Copy className="h-3 w-3" />
                          </button>
                        </td>
                        <td className="py-2 pr-3 hidden sm:table-cell font-mono text-xs">#{tx.block?.blockNumber ?? '—'}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{fmtRelative(tx.timestamp)}</td>
                        <td className="py-2 pr-3 text-right"><ArrowRight className="h-3.5 w-3.5 text-primary inline" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Showing {paged.length} of {txs.length} transactions</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Button>
                <span className="text-xs py-1.5 px-2 text-muted-foreground">Page {page + 1} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
    </div>
  )
}
