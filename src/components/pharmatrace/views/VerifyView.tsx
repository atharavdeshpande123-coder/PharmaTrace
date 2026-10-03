'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { PageHeader, LoadingState } from '../States'
import { GlassCard } from '../GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VerificationBadge } from '../Badges'
import { apiPost } from '@/lib/client/api'
import { playSuccessSound, playErrorSound, playWarningSound } from '@/lib/client/sounds'
import { toast } from 'sonner'
import {
  ScanLine, QrCode, Keyboard, Upload, Camera, CameraOff,
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Loader2, ArrowRight, Copy, Flag,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { VerificationSequence } from '../VerificationSequence'
import { VerificationCore } from '../VerificationCore'
import { fmtDate, fmtRelative, shortHash, copyToClipboard } from '@/lib/client/format'

interface VerifyResult {
  result: 'AUTHENTIC' | 'NOT_FOUND' | 'FLAGGED' | 'EXPIRED'
  drug: any | null
  reason?: string
  checks: { label: string; passed: boolean; detail?: string }[]
}

const STEPS = [
  'QR CODE DETECTED',
  'DIGITAL ID EXTRACTED',
  'CHECKING PHARMACEUTICAL RECORD',
  'SMART CONTRACT VALIDATION',
  'BLOCKCHAIN RECORD MATCH',
  'VERIFICATION COMPLETE',
]

export function VerifyView() {
  const { navigate, params } = useRouter()
  const { user } = useAuth()
  const [tab, setTab] = useState('scan')
  const [manual, setManual] = useState('')
  const [imageInput, setImageInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Stop camera on unmount
  useEffect(() => () => stopCamera(), [])

  // Auto-verify when navigated with an `id` param (e.g. from drug detail "Open Public Verify")
  useEffect(() => {
    if (params.id && !result && !loading) {
      setManual(params.id)
      setTab('manual')
      runVerification(params.id, 'PUBLIC_LINK')
    }
  }, [params.id])

  const startCamera = async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)
    } catch (e) {
      setCameraError('Camera access unavailable. Enter the drug ID manually below.')
      setCameraOn(false)
    }
  }
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  const runVerification = async (query: string, method: string) => {
    if (!query.trim()) {
      toast.error('Please enter a drug ID, batch number or QR token')
      return
    }
    setLoading(true); setResult(null); setStep(0)
    // animate steps
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i)
      await new Promise((r) => setTimeout(r, 380))
    }
    try {
      const r = await apiPost<VerifyResult>('/api/verify', { query, method })
      setResult(r)
      if (r.result === 'AUTHENTIC') { toast.success('Drug verified — AUTHENTIC'); playSuccessSound() }
      else if (r.result === 'EXPIRED') { toast.warning('Drug is genuine but expired'); playWarningSound() }
      else if (r.result === 'FLAGGED') { toast.error('Verification failed — flagged'); playErrorSound() }
      else { toast.error('Drug not found in blockchain record'); playErrorSound() }
    } catch (e) {
      toast.error((e as Error).message || 'Verification failed')
      playErrorSound()
    } finally {
      setLoading(false)
      stopCamera()
    }
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Decode QR from image using jsQR
    try {
      const jsQR = (await import('jsqr')).default
      const img = new Image()
      img.src = URL.createObjectURL(file)
      await new Promise((res) => { img.onload = res })
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imgData = ctx.getImageData(0, 0, img.width, img.height)
      const code = jsQR(imgData.data, img.width, img.height)
      URL.revokeObjectURL(img.src)
      if (code) {
        setImageInput(code.data)
        toast.success('QR code detected from image')
        runVerification(code.data, 'IMAGE_UPLOAD')
      } else {
        toast.error('No QR code found in the uploaded image')
      }
    } catch {
      toast.error('Could not read the image')
    }
  }

  // capture a frame from the camera and try to decode
  const captureFrame = async () => {
    if (!videoRef.current) return
    const v = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth; canvas.height = v.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(v, 0, 0)
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    try {
      const jsQR = (await import('jsqr')).default
      const code = jsQR(imgData.data, canvas.width, canvas.height)
      if (code) {
        toast.success('QR detected: ' + code.data.slice(0, 20) + '…')
        runVerification(code.data, 'QR_SCAN')
      } else {
        toast.info('No QR detected this frame — try again')
      }
    } catch {
      toast.error('Scan failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ScanLine className="h-5 w-5" />}
        title="Verify Pharmaceutical Drug"
        subtitle="Scan a QR code, enter a batch number, or upload a QR image to verify authenticity against the blockchain."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input panel */}
        <GlassCard glow="cyan">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scan"><Camera className="h-3.5 w-3.5 mr-1.5" /> Scan QR</TabsTrigger>
              <TabsTrigger value="manual"><Keyboard className="h-3.5 w-3.5 mr-1.5" /> Manual Entry</TabsTrigger>
              <TabsTrigger value="upload"><Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Image</TabsTrigger>
            </TabsList>

            <TabsContent value="scan" className="mt-4">
              <div className="relative aspect-square w-full max-w-sm mx-auto rounded-xl border-2 border-dashed border-border/70 bg-background/40 overflow-hidden">
                {/* corner brackets */}
                <CornerBrackets />
                {/* scanning line */}
                {cameraOn && (
                  <div className="absolute left-4 right-4 h-0.5 bg-cyan-400 shadow-[0_0_12px_2px_rgba(34,211,238,0.7)] animate-scan-line" />
                )}
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <QrCode className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Tap "Start Camera" to scan a QR code with your device.</p>
                  </div>
                )}
                {cameraError && (
                  <div className="absolute inset-x-0 bottom-0 bg-rose-500/15 border-t border-rose-500/30 px-3 py-2 text-xs text-rose-200">
                    {cameraError}
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2 justify-center">
                {!cameraOn ? (
                  <Button onClick={startCamera}><Camera className="h-4 w-4 mr-2" /> Start Camera</Button>
                ) : (
                  <>
                    <Button onClick={captureFrame} disabled={loading}><ScanLine className="h-4 w-4 mr-2" /> Capture & Verify</Button>
                    <Button variant="outline" onClick={stopCamera}><CameraOff className="h-4 w-4 mr-2" /> Stop</Button>
                  </>
                )}
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">No camera? Switch to Manual Entry or Upload Image.</p>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="manual">Drug ID, Batch Number, or QR Token</Label>
                  <Input
                    id="manual"
                    value={manual}
                    onChange={(e) => setManual(e.target.value)}
                    placeholder="e.g. PHARMA-XXXX-XXXX-XXXX or BAT-XXXXXXXX"
                    onKeyDown={(e) => { if (e.key === 'Enter') runVerification(manual, 'MANUAL_ENTRY') }}
                  />
                </div>
                <Button className="w-full" onClick={() => runVerification(manual, 'MANUAL_ENTRY')} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  Verify Now
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Need a sample?{' '}
                  <button
                    className="text-primary hover:underline"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/drugs?limit=1')
                        const data = await res.json()
                        if (data.drugs?.[0]?.drugId) setManual(data.drugs[0].drugId)
                      } catch { /* ignore */ }
                    }}
                  >
                    Load a demo drug ID
                  </button>{' '}
                  — or visit the Drugs page to copy any batch.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <div className="space-y-3">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-border/70 bg-background/40 py-10 hover:bg-muted/30 transition-colors flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload a QR image (PNG / JPG)</span>
                </button>
                {imageInput && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs font-mono break-all">
                    {imageInput}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </GlassCard>

        {/* Result panel */}
        <GlassCard>
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <VerificationSequence currentStep={step} result={null} />
              </motion.div>
            )}
            {!loading && !result && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8 text-center">
                <div className="flex justify-center mb-4">
                  <VerificationCore size={120} />
                </div>
                <h3 className="text-lg font-medium">Awaiting Verification</h3>
                <p className="mt-1 text-sm text-muted-foreground">Scan or enter a code to begin blockchain verification.</p>
              </motion.div>
            )}
            {!loading && result && (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ResultPanel result={result} onReset={() => { setResult(null); setManual(''); setImageInput('') }} user={user} />
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </div>
  )
}

function CornerBrackets() {
  const base = 'absolute h-10 w-10 border-cyan-400/80'
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${base} top-3 left-3 border-t-2 border-l-2 rounded-tl-lg`}
        style={{ boxShadow: '0 0 12px rgba(34,211,238,0.2)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`${base} top-3 right-3 border-t-2 border-r-2 rounded-tr-lg`}
        style={{ boxShadow: '0 0 12px rgba(34,211,238,0.2)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className={`${base} bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg`}
        style={{ boxShadow: '0 0 12px rgba(34,211,238,0.2)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className={`${base} bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg`}
        style={{ boxShadow: '0 0 12px rgba(34,211,238,0.2)' }}
      />
      {/* Digital scan grid overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(34,211,238,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.15) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
    </>
  )
}

function ResultPanel({ result, onReset, user }: { result: VerifyResult; onReset: () => void; user: any }) {
  const { navigate } = useRouter()
  const r = result.result
  const icon =
    r === 'AUTHENTIC' ? <CheckCircle2 className="h-12 w-12 text-emerald-400" /> :
    r === 'EXPIRED' ? <AlertTriangle className="h-12 w-12 text-amber-400" /> :
    r === 'FLAGGED' ? <AlertTriangle className="h-12 w-12 text-amber-400" /> :
    <XCircle className="h-12 w-12 text-rose-400" />
  const accent =
    r === 'AUTHENTIC' ? 'glow-emerald' :
    r === 'EXPIRED' || r === 'FLAGGED' ? 'glow-amber' :
    'glow-rose'

  return (
    <div className="space-y-4">
      <div className={`flex flex-col items-center text-center py-4 ${accent}`}>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          {icon}
        </motion.div>
        <h3 className="mt-2 text-xl font-bold">{r === 'AUTHENTIC' ? 'BLOCKCHAIN RECORD VERIFIED' : r === 'EXPIRED' ? 'EXPIRED BATCH RECORD' : r === 'FLAGGED' ? 'RECORD MISMATCH' : 'RECORD NOT FOUND'}</h3>
        {result.reason && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{result.reason}</p>}
      </div>

      {/* Checks */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1.5">
        {result.checks.map((c) => (
          <div key={c.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {c.passed ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />}
              <span>{c.label}</span>
            </div>
            <span className="text-xs text-muted-foreground">{c.detail ?? ''}</span>
          </div>
        ))}
      </div>

      {result.drug && (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1.5 text-sm">
          <Row label="Drug Name" value={result.drug.drugName} />
          {result.drug.genericName && <Row label="Generic Name" value={result.drug.genericName} />}
          <Row label="Manufacturer" value={result.drug.manufacturerName} />
          <Row label="Batch Number" value={result.drug.batchNumber} mono />
          <Row label="Manufacturing Date" value={fmtDate(result.drug.manufacturingDate)} />
          <Row label="Expiry Date" value={fmtDate(result.drug.expiryDate)} />
          <Row label="Quantity" value={String(result.drug.quantity)} />
          <Row label="Current Location" value={result.drug.currentLocation ?? '—'} />
          <Row label="Current Owner" value={result.drug.currentOwner?.organization ?? result.drug.currentOwner?.name ?? '—'} />
          <Row label="Blockchain Block" value={`#${result.drug.registrationBlockNumber ?? '—'}`} mono />
          <Row label="Drug ID" value={result.drug.drugId} mono action={
            <button onClick={() => copyToClipboard(result.drug.drugId)} className="text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
          } />
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" onClick={onReset}>Try Again</Button>
        {result.drug ? (
          <Button onClick={() => navigate('drug-detail', { id: result.drug.drugId })}>
            View Full Record <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button variant="outline" onClick={() => toast.info('Suspicious drug report submitted to admin (demo)')}>
            <Flag className="h-4 w-4 mr-1" /> Report Suspicious Drug
          </Button>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, mono, action }: { label: string; value: string; mono?: boolean; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
        {action}
      </div>
    </div>
  )
}
