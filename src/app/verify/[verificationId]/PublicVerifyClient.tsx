'use client'
import { useEffect, useState } from 'react'
import {
  ShieldCheck, AlertTriangle, Clock, CheckCircle2, XCircle,
  Boxes, Truck, Network, Cpu, MapPin, Calendar, Activity,
  Package, Building2, ArrowRight, ArrowDown, Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface VerifyResponse {
  success: boolean
  status?: string
  message?: string
  verification?: {
    verificationId: string
    drugId: string
    status: string
    verifiedAt: string
    isExpired: boolean
    isFlagged: boolean
    isDispensed: boolean
  }
  product?: {
    drugName: string
    genericName: string
    dosageForm: string
    strength: string
    category: string
  }
  batch?: {
    batchNumber: string
    serialNumber: string
    verificationId: string
    manufacturingDate: string
    expiryDate: string
    quantity: number
    status: string
    storageRequirement: string
  }
  manufacturer?: {
    name: string
    manufacturerId: string
    location: string
    organization: string
  }
  currentSupplyChain?: {
    stage: string
    location: string
    currentOwner: string
    currentOwnerRole: string
  }
  blockchain?: {
    network: string
    transactionId: string
    blockNumber: number | string
    timestamp: string
    recordStatus: string
    chainIntegrity: string
    isDemo: boolean
  }
  supplyChainHistory?: Array<{
    stage: string
    actor: string
    toActor: string
    location: string
    timestamp: string
    transactionId: string
    blockNumber: number | string
    status: string
  }>
}

const VERIFICATION_STEPS = [
  'QR IDENTIFIED',
  'DIGITAL ID FOUND',
  'DATABASE RECORD LOCATED',
  'BLOCKCHAIN RECORD FOUND',
  'SMART CONTRACT VALIDATED',
  'SUPPLY CHAIN LOADED',
  'VERIFICATION COMPLETE',
]

export function PublicVerifyClient({ verificationId }: { verificationId: string }) {
  const [data, setData] = useState<VerifyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      // Animate verification steps
      for (let i = 0; i < VERIFICATION_STEPS.length; i++) {
        if (cancelled) return
        setStep(i)
        await new Promise((r) => setTimeout(r, 400))
      }

      try {
        const res = await fetch(`/api/public/verify/${encodeURIComponent(verificationId)}`, {
          cache: 'no-store',
        })
        const json: VerifyResponse = await res.json()
        if (!cancelled) {
          setData(json)
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message || 'Failed to verify record')
          setLoading(false)
        }
      }
    }

    run()
    return () => { cancelled = true }
  }, [verificationId])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[36rem] w-[36rem] rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            PUBLIC VERIFICATION · NO LOGIN REQUIRED
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Pharma<span className="gradient-text">Trace</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Verification Center</p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="glass rounded-2xl p-8">
            <div className="text-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="inline-flex rounded-full bg-cyan-500/15 p-4 ring-1 ring-cyan-500/30 text-cyan-300 mb-4"
              >
                <ShieldCheck className="h-8 w-8" />
              </motion.div>
              <h2 className="text-xl font-semibold">Verifying Record…</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Verification ID: <span className="font-mono text-foreground">{verificationId}</span>
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-2">
              {VERIFICATION_STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    i < step ? 'text-emerald-300' : i === step ? 'text-foreground' : 'text-muted-foreground/40'
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> :
                    i === step ? <Loader2 className="h-4 w-4 animate-spin" /> :
                    <div className="h-4 w-4 rounded-full border border-current" />}
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="glass rounded-2xl p-8 text-center">
            <div className="inline-flex rounded-full bg-rose-500/15 p-4 ring-1 ring-rose-500/30 text-rose-300 mb-4">
              <XCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-rose-300">VERIFICATION FAILED</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {/* Result */}
        {!loading && !error && data && (
          <AnimatePresence mode="wait">
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {data.success ? (
                <VerifyResult data={data} />
              ) : (
                <NotFoundResult status={data.status} message={data.message} verificationId={verificationId} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function VerifyResult({ data }: { data: VerifyResponse }) {
  const v = data.verification!
  const isExpired = v.isExpired
  const isFlagged = v.isFlagged
  const isVerified = v.status === 'VERIFIED'

  const icon = isVerified ? <CheckCircle2 className="h-14 w-14 text-emerald-400" /> :
    isExpired ? <Clock className="h-14 w-14 text-amber-400" /> :
    <AlertTriangle className="h-14 w-14 text-rose-400" />

  const heading = isVerified ? 'REGISTERED DIGITAL RECORD VERIFIED' :
    isExpired ? 'REGISTERED BATCH EXPIRED' :
    'BLOCKCHAIN RECORD MISMATCH'

  const message = isVerified
    ? 'PharmaTrace found a matching registered batch record. The QR code matches a registered PharmaTrace batch record.'
    : isExpired
    ? 'This batch is registered but the expiry date has passed. The digital record exists but the batch is no longer within its shelf life.'
    : 'The submitted information does not match the registered pharmaceutical record.'

  const accentColor = isVerified ? 'text-emerald-300' : isExpired ? 'text-amber-300' : 'text-rose-300'

  return (
    <div className="space-y-6">
      {/* Result banner */}
      <div className="glass rounded-2xl p-8 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className={`inline-flex rounded-2xl bg-gradient-to-br ${
            isVerified ? 'from-emerald-500/15 to-cyan-500/15' :
            isExpired ? 'from-amber-500/15 to-orange-500/15' :
            'from-rose-500/15 to-red-500/15'
          } p-6 ring-1 ${isVerified ? 'ring-emerald-500/30' : isExpired ? 'ring-amber-500/30' : 'ring-rose-500/30'} mb-4`}
        >
          {icon}
        </motion.div>
        <h2 className={`text-2xl font-bold ${accentColor}`}>{heading}</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{message}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" /> PUBLIC VERIFICATION
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-medium text-cyan-300 border border-cyan-500/30">
            DATA SOURCE: REGISTERED PHARMATRACE RECORD
          </span>
        </div>
      </div>

      {/* Product + Batch info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-cyan-300" /> PRODUCT INFORMATION
          </h3>
          <div className="space-y-1.5 text-sm">
            <Row label="Drug Name" value={data.product!.drugName} />
            <Row label="Generic Name" value={data.product!.genericName} />
            <Row label="Dosage Form" value={data.product!.dosageForm} />
            <Row label="Strength" value={data.product!.strength} />
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Boxes className="h-4 w-4 text-violet-300" /> BATCH INFORMATION
          </h3>
          <div className="space-y-1.5 text-sm">
            <Row label="Batch Number" value={data.batch!.batchNumber} mono />
            <Row label="Verification ID" value={data.batch!.verificationId} mono />
            <Row label="Manufacturing Date" value={fmtDate(data.batch!.manufacturingDate)} />
            <Row label="Expiry Date" value={fmtDate(data.batch!.expiryDate)} isExpired={isExpired} />
            <Row label="Quantity" value={String(data.batch!.quantity)} />
            <Row label="Status" value={data.batch!.status} />
          </div>
        </div>
      </div>

      {/* Manufacturer info */}
      <div className="glass rounded-xl p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-emerald-300" /> MANUFACTURER
        </h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <Row label="Manufacturer Name" value={data.manufacturer!.name} />
          <Row label="Organization" value={data.manufacturer!.organization} />
          <Row label="Location" value={data.manufacturer!.location} />
        </div>
      </div>

      {/* Blockchain info */}
      <div className="glass rounded-xl p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Network className="h-4 w-4 text-cyan-300" /> BLOCKCHAIN RECORD
        </h3>
        {data.blockchain!.isDemo && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-3 py-1 text-xs text-amber-300 border border-amber-500/30">
            <AlertTriangle className="h-3 w-3" /> DEMO BLOCKCHAIN ENVIRONMENT
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <Row label="Network" value={data.blockchain!.network} />
          <Row label="Transaction ID" value={truncateHash(data.blockchain!.transactionId)} mono />
          <Row label="Block Number" value={`#${data.blockchain!.blockNumber}`} mono />
          <Row label="Timestamp" value={fmtDate(data.blockchain!.timestamp, true)} />
          <Row label="Record Status" value={data.blockchain!.recordStatus} />
          <Row label="Chain Integrity" value={data.blockchain!.chainIntegrity} />
        </div>
      </div>

      {/* Supply Chain Timeline */}
      {data.supplyChainHistory && data.supplyChainHistory.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Truck className="h-4 w-4 text-violet-300" /> SUPPLY CHAIN HISTORY
          </h3>
          <div className="relative">
            <div className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/60 via-violet-500/60 to-emerald-500/60" />
            <div className="space-y-4">
              {data.supplyChainHistory.map((e, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative pl-12"
                >
                  <div className="absolute left-3 top-1 h-4 w-4 rounded-full bg-emerald-500/15 ring-2 ring-emerald-500/40 flex items-center justify-center">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-medium text-sm">{e.stage.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-muted-foreground">{fmtDate(e.timestamp, true)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>Actor: {e.actor}</span>
                      {e.location !== '—' && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {e.location}</span>}
                      <span className="font-mono">TX: {truncateHash(e.transactionId)}</span>
                      <span className="font-mono">Block #{e.blockNumber}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground py-4">
        <p>PharmaTrace — Academic Demo Project. This verification confirms that a digital record exists and was matched.</p>
        <p className="mt-1">It does not constitute a medical safety certification. Not a production regulatory system.</p>
        <p className="mt-2">Verified at: {fmtDate(v.verifiedAt, true)}</p>
      </div>
    </div>
  )
}

function NotFoundResult({ status, message, verificationId }: { status?: string; message?: string; verificationId: string }) {
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="inline-flex rounded-2xl bg-rose-500/15 p-6 ring-1 ring-rose-500/30 text-rose-300 mb-4"
      >
        <XCircle className="h-14 w-14" />
      </motion.div>
      <h2 className="text-2xl font-bold text-rose-300">
        {status === 'NOT_FOUND' ? 'PHARMATRACE RECORD NOT FOUND' : 'UNRECOGNIZED PHARMATRACE QR'}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        {message || 'This QR code does not correspond to a registered PharmaTrace record.'}
      </p>
      <p className="mt-3 text-xs text-muted-foreground font-mono">
        Verification ID: {verificationId}
      </p>
    </div>
  )
}

function Row({ label, value, mono, isExpired }: { label: string; value: string; mono?: boolean; isExpired?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`${mono ? 'font-mono text-xs' : 'text-sm'} ${isExpired ? 'text-amber-300 font-semibold' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function fmtDate(d: string | Date, withTime = false): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  const opts: Intl.DateTimeFormatOptions = withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' }
  return date.toLocaleDateString('en-GB', opts)
}

function truncateHash(hash: string): string {
  if (!hash || hash === '—') return '—'
  if (hash.length <= 20) return hash
  return `${hash.slice(0, 12)}…${hash.slice(-8)}`
}
