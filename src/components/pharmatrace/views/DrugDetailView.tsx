'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../States'
import { GlassCard } from '../GlassCard'
import { StatusBadge, TxTypeBadge, VerificationBadge, RoleBadge } from '../Badges'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiGet, apiPost } from '@/lib/client/api'
import { toast } from 'sonner'
import { fmtDate, fmtRelative, shortHash, copyToClipboard, isExpired } from '@/lib/client/format'
import {
  Boxes, Truck, Network, ShieldCheck, ArrowRight, ArrowLeft, Copy,
  QrCode, Download, Flag, CheckCircle2, Package, MapPin, Clock, Cpu, Send, Printer, Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface DrugDetail {
  id: string; drugId: string; drugName: string; genericName: string | null
  manufacturerName: string; batchNumber: string; serialNumber: string
  manufacturingDate: string; expiryDate: string; quantity: number
  drugCategory: string | null; dosageForm: string | null
  storageRequirement: string | null; manufacturingLocation: string | null
  description: string | null; status: string; currentLocation: string | null
  qrToken: string; registrationBlockNumber: number | null
  manufacturer: { id: string; name: string; organization: string | null; location: string | null }
  currentOwner: { id: string; name: string; organization: string | null; location: string | null; role: string }
  supplyChainEvents: any[]
  transactions: any[]
  verifications: any[]
}

export function DrugDetailView() {
  const { params, navigate } = useRouter()
  const { user } = useAuth()
  const id = params.id
  const [drug, setDrug] = useState<DrugDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [flagDialog, setFlagDialog] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [transferOpen, setTransferOpen] = useState(false)
  const [dispenseOpen, setDispenseOpen] = useState(false)
  const [dispenseReceipt, setDispenseReceipt] = useState<any>(null)
  const [dispenseNotes, setDispenseNotes] = useState('')
  const [dispenseLoading, setDispenseLoading] = useState(false)
  const [users, setUsers] = useState<{ id: string; name: string; organization: string | null; role: string }[]>([])

  const load = async () => {
    if (!id || id === 'undefined') {
      setError('No drug ID provided'); setLoading(false); return
    }
    setLoading(true); setError(null)
    try {
      const res = await apiGet<{ drug: DrugDetail }>(`/api/drugs/${id}`)
      setDrug(res.drug)
      // fetch QR
      try {
        const qrRes = await fetch(`/api/drugs/${res.drug.drugId}/qr`)
        const qrData = await qrRes.json()
        setQr(qrData.dataUrl)
      } catch { /* ignore */ }
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id])

  const openTransfer = async () => {
    if (!drug) return
    try {
      const res = await apiGet<{ users: any[] }>('/api/users')
      setUsers(res.users.map((u) => ({ id: u.id, name: u.name, organization: u.organization, role: u.role })))
      setTransferOpen(true)
    } catch {
      toast.error('Could not load transfer recipients')
    }
  }

  const openDispense = () => {
    setDispenseNotes('')
    setDispenseReceipt(null)
    setDispenseOpen(true)
  }

  const confirmDispense = async () => {
    if (!drug) return
    setDispenseLoading(true)
    try {
      const res = await apiPost<{ drug: any; transaction: any }>(`/api/drugs/${drug.drugId}/dispense`, { notes: dispenseNotes })
      setDispenseReceipt({ drug: res.drug, transaction: res.transaction, pharmacy: user, notes: dispenseNotes, timestamp: new Date().toISOString() })
      toast.success('Drug dispensed — receipt generated')
      load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setDispenseLoading(false)
    }
  }

  const doFlag = async () => {
    if (!drug) return
    try {
      await apiPost(`/api/drugs/${drug.drugId}/qr`, { reason: flagReason || 'Flagged by admin' })
      toast.success('Drug flagged on chain')
      setFlagDialog(false)
      load()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  if (loading) return <LoadingState label="Loading drug…" />
  if (error) return <ErrorState description={error} onRetry={load} />
  if (!drug) return <EmptyState title="Drug not found" />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('drugs')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      </div>
      <PageHeader
        icon={<Boxes className="h-5 w-5" />}
        title={drug.drugName}
        subtitle={`${drug.genericName ?? drug.drugCategory ?? ''} · ${drug.dosageForm ?? ''}`.trim()}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate('verify', { id: drug.drugId })}><ShieldCheck className="h-4 w-4 mr-1" /> Verify</Button>
            {user?.id === drug.currentOwner.id && drug.status !== 'DISPENSED' && (
              <Button size="sm" onClick={openTransfer}><Send className="h-4 w-4 mr-1" /> Transfer</Button>
            )}
            {(user?.role === 'PHARMACY' || user?.role === 'ADMIN') && user?.id === drug.currentOwner.id && drug.status !== 'DISPENSED' && (
              <Button size="sm" variant="secondary" onClick={openDispense}><Package className="h-4 w-4 mr-1" /> Dispense</Button>
            )}
            {user?.role === 'ADMIN' && (
              <Button size="sm" variant="outline" onClick={() => setFlagDialog(true)}><Flag className="h-4 w-4 mr-1" /> Flag</Button>
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Overview */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={drug.status} />
                {isExpired(drug.expiryDate) && <StatusBadge status="EXPIRED" />}
              </div>
              <div className="mt-2 text-xs font-mono text-muted-foreground">{drug.drugId}</div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>Registered {fmtRelative(drug.manufacturingDate)}</div>
              <div className="mt-0.5">Block #{drug.registrationBlockNumber ?? '—'}</div>
            </div>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Detail label="Batch Number" value={drug.batchNumber} mono action={<CopyBtn text={drug.batchNumber} />} />
            <Detail label="Serial Number" value={drug.serialNumber} mono action={<CopyBtn text={drug.serialNumber} />} />
            <Detail label="Manufacturer" value={drug.manufacturerName} />
            <Detail label="Manufacturing Location" value={drug.manufacturingLocation ?? '—'} icon={<MapPin className="h-3 w-3" />} />
            <Detail label="Manufacturing Date" value={fmtDate(drug.manufacturingDate)} icon={<Clock className="h-3 w-3" />} />
            <Detail label="Expiry Date" value={fmtDate(drug.expiryDate)} icon={<Clock className="h-3 w-3" />} />
            <Detail label="Quantity" value={String(drug.quantity)} icon={<Package className="h-3 w-3" />} />
            <Detail label="Storage" value={drug.storageRequirement ?? '—'} />
            <Detail label="Current Owner" value={drug.currentOwner.organization ?? drug.currentOwner.name} />
            <Detail label="Current Location" value={drug.currentLocation ?? '—'} icon={<MapPin className="h-3 w-3" />} />
          </div>
          {drug.description && (
            <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</div>
              {drug.description}
            </div>
          )}
        </GlassCard>

        {/* QR card */}
        <GlassCard glow="cyan">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Verification QR</div>
            <div className="mt-3 inline-block rounded-xl border border-border/60 bg-white p-3">
              {qr ? <img src={qr} alt="QR" className="h-40 w-40" /> : <div className="h-40 w-40 flex items-center justify-center text-muted-foreground text-xs">Loading…</div>}
            </div>
            <div className="mt-2 text-xs text-muted-foreground break-all font-mono">{drug.qrToken}</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {qr && (
                <a href={qr} download={`qr-${drug.drugId}.png`} className="col-span-2">
                  <Button variant="outline" size="sm" className="w-full"><Download className="h-3.5 w-3.5 mr-1" /> Download QR</Button>
                </a>
              )}
              <Button variant="outline" size="sm" onClick={() => { copyToClipboard(drug.drugId); toast.success('Drug ID copied') }}><Copy className="h-3.5 w-3.5 mr-1" /> Copy ID</Button>
              <Button variant="outline" size="sm" onClick={() => { copyToClipboard(drug.qrToken); toast.success('QR token copied — paste into Verify page') }}><QrCode className="h-3.5 w-3.5 mr-1" /> Copy Token</Button>
              <Button variant="secondary" size="sm" className="col-span-2" onClick={() => navigate('verify', { id: drug.qrToken })}>
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Open Public Verify
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="supply">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="supply"><Truck className="h-3.5 w-3.5 mr-1.5" /> Supply Chain</TabsTrigger>
          <TabsTrigger value="blockchain"><Network className="h-3.5 w-3.5 mr-1.5" /> Blockchain</TabsTrigger>
          <TabsTrigger value="verifications"><ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Verifications</TabsTrigger>
          <TabsTrigger value="meta"><Boxes className="h-3.5 w-3.5 mr-1.5" /> Details</TabsTrigger>
        </TabsList>

        <TabsContent value="supply" className="mt-4">
          <SupplyTimeline events={drug.supplyChainEvents} />
        </TabsContent>

        <TabsContent value="blockchain" className="mt-4">
          <GlassCard>
            <h3 className="font-semibold mb-3">Blockchain Transactions</h3>
            <div className="space-y-2">
              {drug.transactions.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => {
                    if (tx.block?.blockNumber != null) navigate('blockchain-detail', { number: String(tx.block.blockNumber) })
                  }}
                  className="w-full flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TxTypeBadge type={tx.type} />
                    <span className="font-mono text-xs truncate">{shortHash(tx.transactionHash)}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground font-mono">#{tx.block?.blockNumber ?? '—'}</div>
                    <div className="text-[10px] text-muted-foreground">{fmtRelative(tx.timestamp)}</div>
                  </div>
                </button>
              ))}
              {drug.transactions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No transactions recorded.</p>}
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="verifications" className="mt-4">
          <GlassCard>
            <h3 className="font-semibold mb-3">Verification History</h3>
            <div className="space-y-2">
              {drug.verifications.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <VerificationBadge result={v.result} />
                    <span className="text-xs text-muted-foreground">{v.verificationMethod}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{fmtRelative(v.timestamp)}</div>
                </div>
              ))}
              {drug.verifications.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No verifications yet.</p>}
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="meta" className="mt-4">
          <GlassCard>
            <h3 className="font-semibold mb-3">Audit Metadata</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Detail label="Created By" value={`${drug.manufacturer.name} (${drug.manufacturer.organization ?? '—'})`} />
              <Detail label="Manufacturer Location" value={drug.manufacturer.location ?? '—'} />
              <Detail label="Current Owner Role" value={drug.currentOwner.role} action={<RoleBadge role={drug.currentOwner.role} />} />
              <Detail label="Category" value={drug.drugCategory ?? '—'} />
              <Detail label="Dosage Form" value={drug.dosageForm ?? '—'} />
              <Detail label="QR Token" value={shortHash(drug.qrToken, 12, 8)} mono />
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Flag dialog */}
      {flagDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setFlagDialog(false)}>
          <div className="glass-strong rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Flag this batch?</h3>
            <p className="mt-1 text-sm text-muted-foreground">This will create a DRUG_FLAGGED transaction and prevent further transfers.</p>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" value={flagReason} onChange={(e) => setFlagReason(e.target.value)} rows={3} placeholder="e.g. Inconsistent QR code detected during spot check" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFlagDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={doFlag}><Flag className="h-4 w-4 mr-1" /> Confirm Flag</Button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer dialog */}
      {transferOpen && (
        <TransferDialog drug={drug} users={users} onClose={() => setTransferOpen(false)} onDone={() => { setTransferOpen(false); load() }} />
      )}

      {/* Dispense dialog / receipt */}
      {dispenseOpen && (
        <DispenseDialog
          drug={drug}
          notes={dispenseNotes}
          setNotes={setDispenseNotes}
          loading={dispenseLoading}
          receipt={dispenseReceipt}
          onConfirm={confirmDispense}
          onClose={() => setDispenseOpen(false)}
        />
      )}
    </div>
  )
}

function SupplyTimeline({ events }: { events: any[] }) {
  const colorByType: Record<string, string> = {
    REGISTERED: 'cyan', TRANSFERRED: 'violet', RECEIVED: 'sky', FLAGGED: 'rose', DISPENSED: 'emerald', VERIFIED: 'emerald',
  }
  if (events.length === 0) {
    return (
      <GlassCard>
        <EmptyState title="No supply-chain events yet" description="Events will appear here as the batch moves through the supply chain." />
      </GlassCard>
    )
  }
  return (
    <GlassCard>
      <h3 className="font-semibold mb-4">Supply Chain Journey</h3>
      <div className="relative">
        <div className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/60 via-violet-500/60 to-emerald-500/60" />
        <div className="space-y-4">
          {events.map((e, i) => {
            const color = colorByType[e.eventType] ?? 'cyan'
            const colorMap: Record<string, string> = {
              cyan: 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/40',
              violet: 'bg-violet-500/15 text-violet-300 ring-violet-500/40',
              sky: 'bg-sky-500/15 text-sky-300 ring-sky-500/40',
              rose: 'bg-rose-500/15 text-rose-300 ring-rose-500/40',
              emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
            }
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative pl-12"
              >
                <div className={`absolute left-3 top-1 h-4 w-4 rounded-full ring-2 ${colorMap[color]}`} />
                <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium text-sm">{e.eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                    <span className="text-xs text-muted-foreground">{fmtDate(e.timestamp, true)}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {(e.fromUser?.organization ?? e.fromUser?.name ?? '—')} → {(e.toUser?.organization ?? e.toUser?.name ?? '—')}
                    {e.location && <> · <MapPin className="inline h-3 w-3" /> {e.location}</>}
                  </div>
                  {e.notes && <div className="mt-1 text-xs text-muted-foreground">{e.notes}</div>}
                  <div className="mt-1 text-[10px] font-mono text-muted-foreground">TX {shortHash(e.transactionId)} · Block #{e.blockNumber ?? '—'}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </GlassCard>
  )
}

function TransferDialog({ drug, users, onClose, onDone }: {
  drug: DrugDetail
  users: { id: string; name: string; organization: string | null; role: string }[]
  onClose: () => void
  onDone: () => void
}) {
  const [toId, setToId] = useState('')
  const [destination, setDestination] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async () => {
    if (!toId) { toast.error('Select a recipient'); return }
    setLoading(true)
    try {
      await apiPost(`/api/drugs/${drug.drugId}/transfer`, { toId, destination, notes })
      toast.success('Transfer recorded on chain')
      onDone()
    } catch (e) { toast.error((e as Error).message) }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-strong rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">Transfer Drug Batch</h3>
        <p className="mt-1 text-sm text-muted-foreground">Move <span className="font-medium">{drug.drugName}</span> ({drug.batchNumber}) to a new party.</p>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Recipient</Label>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name} · {u.organization ?? u.role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Destination</Label>
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Pune, India" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional transfer notes" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? 'Recording…' : 'Confirm Transfer'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value, mono, icon, action }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-muted-foreground text-xs flex items-center gap-1">{icon}{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={mono ? 'font-mono text-xs' : 'text-sm'}>{value}</span>
        {action}
      </div>
    </div>
  )
}

function CopyBtn({ text }: { text: string }) {
  return (
    <button onClick={() => { copyToClipboard(text); toast.success('Copied') }} className="text-muted-foreground hover:text-foreground">
      <Copy className="h-3 w-3" />
    </button>
  )
}

function DispenseDialog({ drug, notes, setNotes, loading, receipt, onConfirm, onClose }: {
  drug: DrugDetail
  notes: string
  setNotes: (v: string) => void
  loading: boolean
  receipt: any
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-strong rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {receipt ? (
          // ===== Receipt view =====
          <div>
            <div className="text-center mb-4">
              <div className="inline-flex rounded-full bg-emerald-500/15 p-3 ring-1 ring-emerald-500/30 mb-2">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold">Dispense Receipt</h3>
              <p className="text-xs text-muted-foreground">Batch successfully dispensed to customer</p>
            </div>
            <div className="rounded-lg border border-dashed border-border/60 bg-background/40 p-4 space-y-1.5 text-sm">
              <ReceiptRow label="Drug" value={receipt.drug.drugName} />
              <ReceiptRow label="Batch" value={receipt.drug.batchNumber} mono />
              <ReceiptRow label="Drug ID" value={receipt.drug.drugId} mono />
              <ReceiptRow label="Pharmacy" value={receipt.pharmacy?.organization ?? receipt.pharmacy?.name ?? '—'} />
              <ReceiptRow label="Pharmacist" value={receipt.pharmacy?.name ?? '—'} />
              <ReceiptRow label="Tx Hash" value={shortHash(receipt.transaction.transactionHash, 12, 8)} mono />
              <ReceiptRow label="Block #" value={`#${receipt.transaction.blockNumber}`} mono />
              <ReceiptRow label="Time" value={fmtDate(receipt.timestamp, true)} />
              {receipt.notes && <ReceiptRow label="Notes" value={receipt.notes} />}
            </div>
            <div className="mt-3 text-[10px] text-center text-muted-foreground font-mono">
              🔒 Immutable record on PharmaTrace blockchain · Verified by SHA-256
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" /> Print</Button>
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : (
          // ===== Confirm dispense form =====
          <div>
            <h3 className="text-lg font-semibold">Dispense Drug Batch</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You are about to mark <span className="font-medium text-foreground">{drug.drugName}</span> ({drug.batchNumber}) as dispensed to a customer. This action is irreversible and will be recorded on the blockchain.
            </p>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="disp-notes">Dispense Notes (optional)</Label>
                <Textarea id="disp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="e.g. Dispensed to walk-in customer, prescription verified" />
              </div>
              <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-200">
                ⚠️ Once dispensed, this batch cannot be transferred again. The customer can still verify its authenticity via the QR code.
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={onConfirm} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Package className="h-4 w-4 mr-1.5" />}
                Confirm Dispense
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReceiptRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-muted-foreground text-xs shrink-0">{label}</span>
      <span className={`text-right ${mono ? 'font-mono text-xs' : 'text-sm'}`}>{value}</span>
    </div>
  )
}
