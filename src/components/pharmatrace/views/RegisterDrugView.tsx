'use client'
import { useState } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { PageHeader, LoadingState } from '../States'
import { GlassCard } from '../GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { apiPost } from '@/lib/client/api'
import { Loader2, PackagePlus, CheckCircle2, Download, Printer, Copy, QrCode } from 'lucide-react'
import { motion } from 'framer-motion'
import { shortHash, copyToClipboard } from '@/lib/client/format'

interface RegisterResult {
  drug: any
  transaction: any
  qrToken: string
  drugId: string
}

export function RegisterDrugView() {
  const { user } = useAuth()
  const { navigate } = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RegisterResult | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null)
  const [medicineData, setMedicineData] = useState<Record<string, unknown> | null>(null)
  const [showMedicineData, setShowMedicineData] = useState(false)
  const [form, setForm] = useState({
    drugName: '', genericName: '', batchNumber: '', serialNumber: '',
    manufacturingDate: '', expiryDate: '', quantity: '1000',
    drugCategory: '', dosageForm: 'Tablet', storageRequirement: 'Store below 25°C',
    manufacturingLocation: '', description: '',
  })

  if (!user || (user.role !== 'MANUFACTURER' && user.role !== 'ADMIN')) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-muted-foreground">Only manufacturers can register drug batches.</p>
        <Button className="mt-4" onClick={() => navigate('dashboard')}>Back to Dashboard</Button>
      </div>
    )
  }

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiPost<RegisterResult>('/api/drugs', form)
      setResult(res)
      toast.success('Drug batch registered on blockchain')
      // fetch QR
      const qrRes = await fetch(`/api/drugs/${res.drug.drugId}/qr`)
      const qrData = await qrRes.json()
      setQr(qrData.dataUrl)
      setVerificationUrl(qrData.verificationUrl)
      setMedicineData(qrData.medicineData || null)
    } catch (err) {
      toast.error((err as Error).message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <GlassCard glow="emerald" className="p-7 text-center">
            <div className="inline-flex rounded-full bg-emerald-500/15 p-3 ring-1 ring-emerald-500/30 mb-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-semibold">Drug Batch Registered Successfully</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The batch is now sealed into the blockchain. Share the QR code with downstream parties.
            </p>
            <div className="mt-5 grid sm:grid-cols-2 gap-4 text-left">
              <div className="space-y-1.5 text-sm rounded-lg border border-border/60 bg-muted/20 p-3">
                <DetailRow label="Drug ID" value={result.drug.drugId} mono />
                <DetailRow label="Batch Number" value={result.drug.batchNumber} mono />
                <DetailRow label="Serial Number" value={result.drug.serialNumber} mono />
                <DetailRow label="Transaction Hash" value={shortHash(result.transaction.transactionHash)} mono />
                <DetailRow label="Block Number" value={`#${result.transaction.blockNumber}`} mono />
                {verificationUrl && (
                  <div className="mt-2 pt-2 border-t border-border/40">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">PUBLIC VERIFICATION URL</div>
                    <div className="font-mono text-[10px] break-all text-cyan-300">{verificationUrl}</div>
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-border/60 bg-white p-3 flex items-center justify-center">
                {qr ? (
                  <img src={qr} alt="QR Code" className="w-44 h-44" />
                ) : (
                  <div className="text-muted-foreground text-sm">Loading QR…</div>
                )}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(result.drug.drugId); toast.success('Drug ID copied') }}>
                <Copy className="h-4 w-4 mr-1.5" /> Copy Drug ID
              </Button>
              {verificationUrl && (
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(verificationUrl); toast.success('Verification URL copied') }}>
                  <Copy className="h-4 w-4 mr-1.5" /> Copy URL
                </Button>
              )}
              {qr && (
                <a href={qr} download={`pharmatrace-${result.drug.drugId}.png`}>
                  <Button variant="outline"><Download className="h-4 w-4 mr-1.5" /> Download QR</Button>
                </a>
              )}
              {qr && (
                <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" /> Print QR</Button>
              )}
              {verificationUrl && (
                <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary"><QrCode className="h-4 w-4 mr-1.5" /> TEST QR</Button>
                </a>
              )}
              <Button onClick={() => navigate('verify', { id: result.drug.drugId })}>
                <QrCode className="h-4 w-4 mr-1.5" /> Verify Now
              </Button>
            </div>

            {/* Medicine Data in QR */}
            {medicineData && (
              <div className="mt-4">
                <button
                  onClick={() => setShowMedicineData((v) => !v)}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  {showMedicineData ? '▾' : '▸'} VIEW MEDICINE DATA ENCODED IN QR
                </button>
                {showMedicineData && (
                  <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-left">
                    <p className="text-xs text-muted-foreground mb-2">
                      When someone scans this QR code, they will see this complete medicine data:
                    </p>
                    <div className="grid sm:grid-cols-2 gap-1.5 text-xs">
                      {Object.entries(medicineData).map(([key, val]) => (
                        <div key={key} className="flex items-start justify-between gap-2">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-mono text-right break-all">
                            {val === null || val === undefined ? '—' : typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/) ? val.split('T')[0] : String(val).slice(0, 60)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button variant="ghost" className="mt-3" onClick={() => { setResult(null); setQr(null); setMedicineData(null) }}>
              Register Another Batch
            </Button>
          </GlassCard>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={<PackagePlus className="h-5 w-5" />} title="Register New Drug" subtitle="Create a new pharmaceutical batch on the blockchain." />
      <GlassCard>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Drug Name *" required>
            <Input value={form.drugName} onChange={(e) => update('drugName', e.target.value)} required placeholder="e.g. Paracetamol 500mg" />
          </Field>
          <Field label="Generic Name">
            <Input value={form.genericName} onChange={(e) => update('genericName', e.target.value)} placeholder="e.g. Acetaminophen" />
          </Field>
          <Field label="Batch Number *" required>
            <Input value={form.batchNumber} onChange={(e) => update('batchNumber', e.target.value)} required placeholder="e.g. BAT-NOVA-001" />
          </Field>
          <Field label="Serial Number *" required>
            <Input value={form.serialNumber} onChange={(e) => update('serialNumber', e.target.value)} required placeholder="e.g. SN-0001-AB12" />
          </Field>
          <Field label="Manufacturing Date *" required>
            <Input type="date" value={form.manufacturingDate} onChange={(e) => update('manufacturingDate', e.target.value)} required />
          </Field>
          <Field label="Expiry Date *" required>
            <Input type="date" value={form.expiryDate} onChange={(e) => update('expiryDate', e.target.value)} required />
          </Field>
          <Field label="Quantity *" required>
            <Input type="number" min="1" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} required />
          </Field>
          <Field label="Drug Category">
            <Input value={form.drugCategory} onChange={(e) => update('drugCategory', e.target.value)} placeholder="e.g. Antibiotic" />
          </Field>
          <Field label="Dosage / Form">
            <Select value={form.dosageForm} onValueChange={(v) => update('dosageForm', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler'].map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Storage Requirement">
            <Input value={form.storageRequirement} onChange={(e) => update('storageRequirement', e.target.value)} />
          </Field>
          <Field label="Manufacturing Location">
            <Input value={form.manufacturingLocation} onChange={(e) => update('manufacturingLocation', e.target.value)} placeholder="e.g. Mumbai, India" />
          </Field>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} placeholder="Optional batch notes, composition, etc." />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('drugs')}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PackagePlus className="h-4 w-4 mr-2" />}
              Register & Generate QR
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</Label>
      {children}
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={mono ? 'font-mono text-xs' : 'text-sm'}>{value}</span>
    </div>
  )
}
