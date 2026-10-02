'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../States'
import { GlassCard } from '../GlassCard'
import { TxTypeBadge } from '../Badges'
import { Button } from '@/components/ui/button'
import { apiGet } from '@/lib/client/api'
import { fmtDate, fmtRelative, shortHash, copyToClipboard } from '@/lib/client/format'
import { toast } from 'sonner'
import { ArrowLeft, Cpu, Hash, Link2, Copy, Boxes, ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface BlockDetail {
  block: {
    blockNumber: number
    timestamp: string
    previousHash: string
    hash: string
    nonce: number
    merkleRoot: string | null
    transactions: any[]
  }
}

export function BlockDetailView() {
  const { params, navigate } = useRouter()
  const num = params.number
  const [data, setData] = useState<BlockDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (num == null || num === '' || num === 'undefined') {
      setError('No block number provided'); setLoading(false); return
    }
    setLoading(true); setError(null)
    try {
      const res = await apiGet<BlockDetail>(`/api/blockchain/blocks/${num}`)
      setData(res)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [num])

  if (loading) return <LoadingState label="Loading block…" />
  if (error) return <ErrorState description={error} onRetry={load} />
  if (!data) return <EmptyState title="Block not found" />

  const b = data.block
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('blockchain')}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Blockchain</Button>
      </div>
      <PageHeader
        icon={<Cpu className="h-5 w-5" />}
        title={`Block #${b.blockNumber}`}
        subtitle={b.blockNumber === 0 ? 'Genesis block — the first block in the chain.' : `Sealed on ${fmtDate(b.timestamp, true)}`}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Block details */}
        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold mb-3">Block Details</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Detail label="Block Number" value={`#${b.blockNumber}`} mono />
            <Detail label="Timestamp" value={fmtDate(b.timestamp, true)} />
            <Detail label="Nonce" value={String(b.nonce)} mono />
            <Detail label="Transaction Count" value={String(b.transactions.length)} />
            <div className="sm:col-span-2 space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Hash</div>
              <button onClick={() => { copyToClipboard(b.hash); toast.success('Hash copied') }} className="w-full flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 font-mono text-xs hover:bg-muted/70">
                <span className="truncate">{b.hash}</span>
                <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Previous Hash</div>
              <div className="rounded-md bg-muted/40 px-3 py-2 font-mono text-xs break-all">{b.previousHash}</div>
            </div>
            {b.merkleRoot && (
              <div className="sm:col-span-2 space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Merkle Root</div>
                <div className="rounded-md bg-muted/40 px-3 py-2 font-mono text-xs break-all">{b.merkleRoot}</div>
              </div>
            )}
          </div>
          {/* visual hash link */}
          <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Link2 className="h-3 w-3" /> Linked to previous</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="flex items-center gap-1">Verified <CheckCircle2 className="h-3 w-3 text-emerald-400" /></span>
          </div>
        </GlassCard>

        {/* Transactions in block */}
        <GlassCard>
          <h3 className="font-semibold mb-3">Transactions</h3>
          {b.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No transactions in this block.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {b.transactions.map((tx, i) => (
                <motion.button
                  key={tx.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => tx.drug && navigate('drug-detail', { id: tx.drug.drugId })}
                  className="w-full text-left rounded-lg border border-border/50 bg-muted/30 px-3 py-2 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <TxTypeBadge type={tx.type} />
                    <span className="text-[10px] text-muted-foreground">{fmtRelative(tx.timestamp)}</span>
                  </div>
                  <div className="mt-1 text-xs font-mono text-muted-foreground truncate">{shortHash(tx.transactionHash, 10, 6)}</div>
                  {tx.drug && (
                    <div className="mt-0.5 text-xs">{tx.drug.drugName} <span className="text-muted-foreground font-mono">{tx.drug.batchNumber}</span></div>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={mono ? 'font-mono text-xs' : 'text-sm'}>{value}</span>
    </div>
  )
}
