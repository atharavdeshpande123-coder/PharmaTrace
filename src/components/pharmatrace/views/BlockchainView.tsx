'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../States'
import { GlassCard } from '../GlassCard'
import { StatCard } from '../StatCard'
import { Button } from '@/components/ui/button'
import { apiGet, apiPost } from '@/lib/client/api'
import { fmtDate, fmtRelative, shortHash, copyToClipboard } from '@/lib/client/format'
import { toast } from 'sonner'
import {
  Network, ShieldCheck, Activity, Cpu, Boxes, Copy, ArrowRight,
  CheckCircle2, XCircle, Loader2, Link2, Hash, FlaskConical, RotateCcw, AlertTriangle,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Block {
  blockNumber: number
  timestamp: string
  previousHash: string
  hash: string
  nonce: number
  merkleRoot: string | null
  transactions: any[]
}

export function BlockchainView() {
  const { navigate } = useRouter()
  const { user } = useAuth()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [latest, setLatest] = useState<Block | null>(null)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [integrity, setIntegrity] = useState<{ valid: boolean; reason: string | null } | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [totalTx, setTotalTx] = useState(0)
  const [tampering, setTampering] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [showTamperDialog, setShowTamperDialog] = useState(false)
  const isAdmin = user?.role === 'ADMIN'

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [blocksRes, integrityRes] = await Promise.all([
        apiGet<{ blocks: Block[]; latest: Block | null; count: number }>('/api/blockchain/blocks?limit=50'),
        apiGet<{ valid: boolean; reason: string | null; totalTransactions: number }>('/api/blockchain/verify-integrity').catch(() => ({ valid: false, reason: 'Could not verify', totalTransactions: 0 })),
      ])
      setBlocks(blocksRes.blocks)
      setLatest(blocksRes.latest)
      setCount(blocksRes.count)
      setIntegrity(integrityRes)
      setTotalTx(integrityRes.totalTransactions)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const verifyNow = async () => {
    setVerifying(true)
    try {
      const res = await apiGet<{ valid: boolean; reason: string | null }>('/api/blockchain/verify-integrity')
      setIntegrity(res)
      toast.success(res.valid ? 'Blockchain Integrity Verified' : 'Chain Integrity Error')
    } catch (e) { toast.error((e as Error).message) }
    finally { setVerifying(false) }
  }

  const tamperLatest = async () => {
    setTampering(true)
    try {
      const res = await apiPost<{ blockNumber: number; originalHash: string; tamperedHash: string; message: string }>('/api/blockchain/tamper', {})
      toast.warning(`Block #${res.blockNumber} tampered — run Verify Integrity to detect it`)
      setShowTamperDialog(false)
      await load()
    } catch (e) { toast.error((e as Error).message) }
    finally { setTampering(false) }
  }

  const restoreChain = async () => {
    setRestoring(true)
    try {
      const res = await apiPost<{ restored: number[]; message: string }>('/api/blockchain/restore', {})
      toast.success(res.message)
      await load()
    } catch (e) { toast.error((e as Error).message) }
    finally { setRestoring(false) }
  }

  const isTampered = !integrity?.valid

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Network className="h-5 w-5" />}
        title="Blockchain Ledger"
        subtitle="Inspect every block in the PharmaTrace local educational blockchain."
        actions={
          <div className="flex gap-2 flex-wrap">
            {isAdmin && !isTampered && (
              <Button variant="outline" size="sm" onClick={() => setShowTamperDialog(true)}>
                <FlaskConical className="h-4 w-4 mr-1.5" /> Tamper Demo
              </Button>
            )}
            {isAdmin && isTampered && (
              <Button variant="outline" size="sm" onClick={restoreChain} disabled={restoring}>
                {restoring ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-1.5" />}
                Restore Chain
              </Button>
            )}
            <Button onClick={verifyNow} disabled={verifying} size="sm">
              {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Verify Chain Integrity
            </Button>
          </div>
        }
      />

      {/* Integrity warning banner */}
      {isTampered && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 border border-rose-500/40 glow-rose"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-rose-500/15 p-2 ring-1 ring-rose-500/30 text-rose-300 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-rose-200">Chain Integrity Compromised</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {integrity?.reason ?? 'A block hash has been modified.'} This demonstrates how the blockchain
                detects tampering — any altered record breaks the hash chain and is immediately visible.
              </p>
              {isAdmin && (
                <Button size="sm" variant="outline" className="mt-3" onClick={restoreChain} disabled={restoring}>
                  {restoring ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
                  Restore Original Hash
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Blocks" value={count} accent="cyan" icon={<Boxes className="h-5 w-5" />} />
        <StatCard label="Latest Block" value={latest?.blockNumber ?? 0} accent="violet" icon={<Cpu className="h-5 w-5" />} />
        <StatCard label="Transactions" value={totalTx} accent="emerald" icon={<Activity className="h-5 w-5" />} />
        <GlassCard className="flex items-center gap-3">
          <div className={`rounded-lg p-2.5 ring-1 ${integrity?.valid ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' : 'bg-rose-500/15 text-rose-300 ring-rose-500/30'}`}>
            {integrity?.valid ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Chain Integrity</div>
            <div className={`text-sm font-semibold ${integrity?.valid ? 'text-emerald-300' : 'text-rose-300'}`}>
              {integrity?.valid ? 'VERIFIED' : 'COMPROMISED'}
            </div>
          </div>
        </GlassCard>
      </div>

      {loading ? <LoadingState label="Loading blockchain…" /> :
        error ? <ErrorState description={error} onRetry={load} /> :
        blocks.length === 0 ? (
          <GlassCard><EmptyState title="No blocks yet" description="Register a drug to create the first block." /></GlassCard>
        ) : (
          <div className="space-y-3">
            {/* Visual chain */}
            <GlassCard>
              <h3 className="font-semibold mb-3">Chain Visualization</h3>
              <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
                {blocks.slice(0, 12).reverse().map((b, i) => (
                  <motion.div
                    key={b.blockNumber}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="shrink-0"
                  >
                    <button onClick={() => navigate('blockchain-detail', { number: String(b.blockNumber) })} className="block">
                      <div className={`rounded-xl border p-3 w-44 text-left transition-transform hover:-translate-y-0.5 ${b.blockNumber === 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-cyan-500/30 bg-cyan-500/5'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-cyan-300">#{b.blockNumber}</span>
                          {b.blockNumber === 0 && <span className="text-[10px] text-amber-300">GENESIS</span>}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate">{shortHash(b.hash, 8, 6)}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">{b.transactions.length} tx · {fmtRelative(b.timestamp)}</div>
                      </div>
                    </button>
                  </motion.div>
                ))}
                {blocks.length > 12 && <div className="shrink-0 flex items-center text-xs text-muted-foreground px-3">+{blocks.length - 12} more</div>}
              </div>
            </GlassCard>

            {/* Block list */}
            <div className="space-y-3">
              {blocks.map((b) => (
                <BlockRow key={b.blockNumber} block={b} onClick={() => navigate('blockchain-detail', { number: String(b.blockNumber) })} />
              ))}
            </div>
          </div>
        )}

      {/* Tamper demo confirmation dialog */}
      {showTamperDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowTamperDialog(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-strong rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="rounded-lg bg-amber-500/15 p-2.5 ring-1 ring-amber-500/30 text-amber-300 shrink-0">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Blockchain Tamper Demo</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This will <strong>intentionally corrupt</strong> the hash of the latest block to
                  demonstrate how the integrity check detects tampering.
                </p>
              </div>
            </div>
            <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-200 space-y-1">
              <div className="font-semibold">What happens:</div>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>The latest block's hash is replaced with a fake value.</li>
                <li>The next block's <code>previousHash</code> link breaks.</li>
                <li>"Verify Chain Integrity" will report COMPROMISED.</li>
                <li>"Restore Chain" reverts the hash to the original.</li>
              </ol>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTamperDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={tamperLatest} disabled={tampering}>
                {tampering ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FlaskConical className="h-4 w-4 mr-1.5" />}
                Tamper Latest Block
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function BlockRow({ block, onClick }: { block: Block; onClick: () => void }) {
  const isTampered = block.hash.startsWith('TAMPERED_')
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => { if (e.key === 'Enter') onClick() }} className="cursor-pointer">
      <GlassCard className={`hover:-translate-y-0.5 transition-transform ${isTampered ? 'border-rose-500/50 glow-rose' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`rounded-lg p-2.5 ring-1 ${isTampered ? 'bg-rose-500/15 text-rose-300 ring-rose-500/30' : block.blockNumber === 0 ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30' : 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/30'}`}>
              {isTampered ? <AlertTriangle className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Block #{block.blockNumber}</span>
                {block.blockNumber === 0 && <span className="text-[10px] uppercase tracking-wider text-amber-300">Genesis</span>}
                {isTampered && <span className="text-[10px] uppercase tracking-wider text-rose-300 font-semibold animate-pulse">⚠ Tampered</span>}
                <span className="text-xs text-muted-foreground">{block.transactions.length} tx</span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{fmtDate(block.timestamp, true)}</div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); copyToClipboard(block.hash); toast.success('Hash copied') }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); copyToClipboard(block.hash); toast.success('Hash copied') } }}
                className="hover:text-foreground cursor-pointer"
              >
                {shortHash(block.hash, 12, 8)}
              </span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">prev {shortHash(block.previousHash, 8, 6)}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-md bg-muted/30 px-2 py-1">
            <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Nonce</div>
            <div className="font-mono">{block.nonce}</div>
          </div>
          <div className="rounded-md bg-muted/30 px-2 py-1">
            <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Merkle</div>
            <div className="font-mono truncate">{shortHash(block.merkleRoot, 6, 4)}</div>
          </div>
          <div className="rounded-md bg-muted/30 px-2 py-1 flex items-center justify-between">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Details</span>
            <ArrowRight className="h-3 w-3 text-primary" />
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
