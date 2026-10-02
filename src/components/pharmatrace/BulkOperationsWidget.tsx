'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { GlassCard } from './GlassCard'
import { StatusBadge } from './Badges'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { apiGet, apiPost } from '@/lib/client/api'
import { toast } from 'sonner'
import {
  AlertTriangle, Loader2, Flag, CheckCircle2, XCircle, RefreshCw, Boxes,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { fmtDate, isExpired } from '@/lib/client/format'
import { cn } from '@/lib/utils'

interface DrugItem {
  id: string
  drugId: string
  drugName: string
  batchNumber: string
  status: string
  expiryDate: string
  manufacturerName: string
}

export function BulkOperationsWidget() {
  const { navigate } = useRouter()
  const [drugs, setDrugs] = useState<DrugItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')
  const [flagging, setFlagging] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiGet<{ drugs: DrugItem[] }>('/api/drugs?limit=100')
      // Filter to only non-flagged, non-dispensed drugs (candidates for flagging)
      setDrugs(res.drugs.filter((d) => d.status !== 'FLAGGED' && d.status !== 'DISPENSED'))
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const expiredDrugs = drugs.filter((d) => isExpired(d.expiryDate))
  const selectedCount = selected.size

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllExpired = () => {
    setSelected(new Set(expiredDrugs.map((d) => d.id)))
  }

  const selectAll = () => {
    setSelected(new Set(drugs.map((d) => d.id)))
  }

  const clearSelection = () => {
    setSelected(new Set())
  }

  const confirmBulkFlag = async () => {
    if (selectedCount === 0) { toast.error('Select at least one drug'); return }
    if (reason.trim().length < 3) { toast.error('Provide a reason (min 3 chars)'); return }
    setFlagging(true)
    try {
      const res = await apiPost<{ flagged: string[]; failed: { id: string; error: string }[]; message: string }>('/api/admin/bulk-flag', {
        drugIds: Array.from(selected),
        reason: reason.trim(),
      })
      toast.success(res.message)
      setShowConfirm(false)
      setReason('')
      setSelected(new Set())
      await load()
    } catch (e) {
      toast.error((e as Error).message || 'Bulk flag failed')
    } finally {
      setFlagging(false)
    }
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Flag className="h-4 w-4 text-rose-300" />
          Bulk Flag Operations
        </h3>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={selectAllExpired} disabled={expiredDrugs.length === 0}>
          <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
          Select Expired ({expiredDrugs.length})
        </Button>
        <Button variant="outline" size="sm" onClick={selectAll} disabled={drugs.length === 0}>
          Select All ({drugs.length})
        </Button>
        <Button variant="outline" size="sm" onClick={clearSelection} disabled={selectedCount === 0}>
          Clear
        </Button>
      </div>

      {/* Drug list with checkboxes */}
      <div className="max-h-72 overflow-y-auto scrollbar-thin rounded-lg border border-border/40">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading drugs…</div>
        ) : drugs.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No flaggable drugs available.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-2 w-8"></th>
                <th className="p-2">Drug</th>
                <th className="p-2">Batch</th>
                <th className="p-2 hidden sm:table-cell">Expiry</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {drugs.map((d) => {
                const isSelected = selected.has(d.id)
                const expired = isExpired(d.expiryDate)
                return (
                  <tr
                    key={d.id}
                    onClick={() => toggleSelect(d.id)}
                    className={cn(
                      'border-b border-border/40 cursor-pointer transition-colors',
                      isSelected ? 'bg-rose-500/10' : 'hover:bg-muted/30',
                    )}
                  >
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by row click
                        className="h-4 w-4 accent-rose-500"
                      />
                    </td>
                    <td className="p-2 font-medium truncate max-w-[120px]">{d.drugName}</td>
                    <td className="p-2 font-mono text-xs">{d.batchNumber}</td>
                    <td className="p-2 hidden sm:table-cell text-xs">
                      <span className={expired ? 'text-amber-300 font-semibold' : 'text-muted-foreground'}>
                        {fmtDate(d.expiryDate)}
                      </span>
                    </td>
                    <td className="p-2"><StatusBadge status={d.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Selection summary + flag button */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="text-sm">
          <span className="font-semibold text-rose-300">{selectedCount}</span>
          <span className="text-muted-foreground"> selected</span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={selectedCount === 0}
          onClick={() => setShowConfirm(true)}
        >
          <Flag className="h-3.5 w-3.5 mr-1.5" />
          Flag {selectedCount > 0 ? `(${selectedCount})` : ''}
        </Button>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => !flagging && setShowConfirm(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-strong rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="rounded-lg bg-rose-500/15 p-2.5 ring-1 ring-rose-500/30 text-rose-300 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Bulk Flag {selectedCount} Drug(s)?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This will create a DRUG_FLAGGED transaction for each selected drug on the blockchain.
                  Each drug's status will change to FLAGGED and further transfers will be blocked.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-reason">Reason for flagging (min 3 chars)</Label>
              <Textarea
                id="bulk-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="e.g. Batch expired — flagged for safety compliance audit"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={flagging}>Cancel</Button>
              <Button variant="destructive" onClick={confirmBulkFlag} disabled={flagging || reason.trim().length < 3}>
                {flagging ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Flag className="h-4 w-4 mr-1.5" />}
                Confirm Flag {selectedCount} Drug(s)
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </GlassCard>
  )
}
