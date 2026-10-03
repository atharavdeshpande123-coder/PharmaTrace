'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from '@/store/router'
import { GlassCard } from '../GlassCard'
import { StatCard } from '../StatCard'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck, ScanLine, Truck, Boxes, Activity, Network,
  ArrowRight, Cpu, Lock, QrCode, Database, Route, AlertTriangle,
  Zap, FileText, GitBranch, PackagePlus,
} from 'lucide-react'
import { apiGet } from '@/lib/client/api'
import { LandingActivityWidget } from '../LandingActivityWidget'
import { VerificationCore } from '../VerificationCore'

interface Stats {
  registeredDrugs: number
  verifiedBatches: number
  supplyChainEvents: number
  blockchainTransactions: number
  lastBlock: number
  chainIntegrity: string
  networkStatus: string
}

export function LandingView() {
  const { navigate } = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  useEffect(() => {
    apiGet<Stats>('/api/stats').then(setStats).catch(() => {})
  }, [])

  return (
    <div className="space-y-16 pb-10">
      {/* Hero */}
      <section className="relative pt-10 sm:pt-16 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Blockchain Connected · Pharmaceutical Verification Active
            </div>
            <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
              Blockchain-Powered <span className="gradient-text">Pharmaceutical Authentication</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground text-balance">
              Verify pharmaceutical batches, trace their journey, and create transparent
              digital records across the supply chain.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('verify')} className="bg-primary text-primary-foreground">
                <ScanLine className="h-4 w-4 mr-2" /> VERIFY MEDICINE
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('supply-chain')}>
                <Truck className="h-4 w-4 mr-2" /> EXPLORE SUPPLY CHAIN
              </Button>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Powered by Blockchain · QR Authentication · Smart Contracts
            </div>
          </motion.div>

          {/* Animated Blockchain Network */}
          <div className="mt-12 flex justify-center">
            <VerificationCore size={180} />
          </div>

          {/* Stats */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Registered Drugs" value={stats?.registeredDrugs ?? 0} accent="cyan" icon={<Boxes className="h-5 w-5" />} description="On-chain pharmaceutical batches" />
            <StatCard label="Verified Batches" value={stats?.verifiedBatches ?? 0} accent="emerald" icon={<ShieldCheck className="h-5 w-5" />} description="Authenticated by customers & pharmacists" />
            <StatCard label="Supply Chain Events" value={stats?.supplyChainEvents ?? 0} accent="violet" icon={<Truck className="h-5 w-5" />} description="Transfers, receipts, verifications" />
            <StatCard label="Blockchain Transactions" value={stats?.blockchainTransactions ?? 0} accent="amber" icon={<Activity className="h-5 w-5" />} description="Sealed into immutable blocks" />
          </div>
        </div>
      </section>

      {/* Live Blockchain Network */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Every Batch. Every Movement. On Record.</h2>
          <p className="mt-2 text-muted-foreground">Live blockchain ledger with tamper-evident transaction history.</p>
        </div>
        <LandingActivityWidget />
      </section>

      {/* Problem Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Pharmaceutical Supply Chains Need Trust.</h2>
          <p className="mt-2 text-muted-foreground">The challenges facing modern pharmaceutical supply chains.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProblemCard icon={<AlertTriangle className="h-5 w-5" />} title="Counterfeit Drugs" text="Unauthorized or counterfeit products can enter complex supply chains." color="rose" />
          <ProblemCard icon={<Database className="h-5 w-5" />} title="Data Manipulation" text="Traditional centralized records can make verification and auditing difficult." color="amber" />
          <ProblemCard icon={<Route className="h-5 w-5" />} title="Limited Traceability" text="Tracking the complete journey of a batch can be difficult across multiple stakeholders." color="violet" />
          <ProblemCard icon={<ScanLine className="h-5 w-5" />} title="Manual Verification" text="Manual checking can introduce delays and data-entry errors." color="sky" />
        </div>
      </section>

      {/* Solution Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">One Digital Trail. Multiple Stakeholders.</h2>
          <p className="mt-2 text-muted-foreground">Blockchain-powered pharmaceutical verification across the entire supply chain.</p>
        </div>
        <GlassCard glow="cyan" className="p-8 sm:p-12">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            {/* Left features */}
            <div className="space-y-4">
              <SolutionFeature icon={<QrCode className="h-4 w-4" />} title="QR Authentication" text="Signed verification tokens" />
              <SolutionFeature icon={<ShieldCheck className="h-4 w-4" />} title="Audit Trail" text="Immutable transaction history" />
              <SolutionFeature icon={<Cpu className="h-4 w-4" />} title="Smart Contracts" text="Automated validation rules" />
            </div>
            {/* Central blockchain viz */}
            <div className="flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="relative h-32 w-32"
              >
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-dashed" />
                <div className="absolute inset-4 rounded-full border border-violet-500/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Network className="h-12 w-12 text-cyan-300" />
                </div>
                {/* Orbiting nodes */}
                {[0, 120, 240].map((angle, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-3 w-3 rounded-full bg-emerald-400"
                    style={{
                      top: '50%',
                      left: '50%',
                      marginTop: '-6px',
                      marginLeft: '-6px',
                    }}
                    animate={{
                      x: [Math.cos((angle * Math.PI) / 180) * 56, Math.cos(((angle + 360) * Math.PI) / 180) * 56],
                      y: [Math.sin((angle * Math.PI) / 180) * 56, Math.sin(((angle + 360) * Math.PI) / 180) * 56],
                    }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  />
                ))}
              </motion.div>
            </div>
            {/* Right features */}
            <div className="space-y-4">
              <SolutionFeature icon={<Truck className="h-4 w-4" />} title="Supply Chain Tracking" text="End-to-end batch movement" align="right" />
              <SolutionFeature icon={<Database className="h-4 w-4" />} title="Blockchain Ledger" text="SHA-256 hash-linked records" align="right" />
              <SolutionFeature icon={<FileText className="h-4 w-4" />} title="Batch Identity" text="Unique verification IDs" align="right" />
            </div>
          </div>
        </GlassCard>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">How It Works</h2>
          <p className="mt-2 text-muted-foreground">From registration to verification — the complete workflow.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { num: '01', title: 'REGISTER', text: 'Manufacturer registers pharmaceutical batch.', icon: <PackagePlus className="h-5 w-5" /> },
            { num: '02', title: 'IDENTIFY', text: 'System creates unique verification identity and QR code.', icon: <QrCode className="h-5 w-5" /> },
            { num: '03', title: 'RECORD', text: 'Batch information is recorded through the blockchain layer.', icon: <Network className="h-5 w-5" /> },
            { num: '04', title: 'TRACK', text: 'Supply-chain movements are recorded as events.', icon: <Truck className="h-5 w-5" /> },
            { num: '05', title: 'VERIFY', text: 'User scans QR or enters code and system validates the record.', icon: <ShieldCheck className="h-5 w-5" /> },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className="h-full">
                <div className="text-3xl font-bold text-primary/30 mb-2">{step.num}</div>
                <div className="text-primary mb-1">{step.icon}</div>
                <h4 className="font-semibold tracking-wide">{step.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <GlassCard glow="emerald" className="p-6 sm:p-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-semibold">Trust Through Verifiable Records</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Blockchain technology ensures pharmaceutical records are tamper-evident and auditable.
                Every transaction is cryptographically linked — any modification is immediately visible.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: 'Immutable Records', icon: <Database className="h-4 w-4" /> },
                  { label: 'Permissioned Network', icon: <Network className="h-4 w-4" /> },
                  { label: 'Smart Contract Rules', icon: <Cpu className="h-4 w-4" /> },
                  { label: 'Audit Trail', icon: <FileText className="h-4 w-4" /> },
                  { label: 'Traceability', icon: <Truck className="h-4 w-4" /> },
                  { label: 'Authentication', icon: <ShieldCheck className="h-4 w-4" /> },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm">
                    <span className="text-emerald-300">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
              <Button className="mt-5" variant="outline" onClick={() => navigate('blockchain')}>
                <Network className="h-4 w-4 mr-2" /> Open Blockchain Explorer
              </Button>
            </div>
            {/* Shield + blockchain viz */}
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <ShieldCheck className="h-32 w-32 text-emerald-300/80" />
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-emerald-500/10 blur-2xl"
                />
              </motion.div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <GlassCard className="text-center p-8 sm:p-12" glow="cyan">
          <h3 className="text-2xl sm:text-3xl font-semibold">VERIFY. TRACE. TRUST.</h3>
          <p className="mt-2 text-muted-foreground">Try the live demo with seeded pharmaceutical data.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate('verify')}>
              <ScanLine className="h-4 w-4 mr-2" /> Verify Medicine
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('register')}>
              <Boxes className="h-4 w-4 mr-2" /> Get Started
            </Button>
          </div>
        </GlassCard>
      </section>
    </div>
  )
}

function ProblemCard({ icon, title, text, color }: {
  icon: React.ReactNode; title: string; text: string; color: string
}) {
  const colors: Record<string, string> = {
    rose: 'text-rose-300 bg-rose-500/15 ring-rose-500/30',
    amber: 'text-amber-300 bg-amber-500/15 ring-amber-500/30',
    violet: 'text-violet-300 bg-violet-500/15 ring-violet-500/30',
    sky: 'text-sky-300 bg-sky-500/15 ring-sky-500/30',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <GlassCard className="h-full">
        <div className={`inline-flex rounded-lg p-2.5 ring-1 mb-3 ${colors[color]}`}>{icon}</div>
        <h4 className="font-semibold">{title}</h4>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{text}</p>
      </GlassCard>
    </motion.div>
  )
}

function SolutionFeature({ icon, title, text, align }: {
  icon: React.ReactNode; title: string; text: string; align?: 'right'
}) {
  return (
    <div className={`flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <div className="rounded-lg bg-primary/15 p-2 ring-1 ring-primary/30 text-primary shrink-0">{icon}</div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{text}</div>
      </div>
    </div>
  )
}

function BlockchainNetworkViz() {
  const stages = [
    { label: 'MANUFACTURER', icon: <Boxes className="h-5 w-5" />, color: 'cyan' },
    { label: 'DISTRIBUTOR', icon: <Truck className="h-5 w-5" />, color: 'violet' },
    { label: 'WHOLESALER', icon: <Boxes className="h-5 w-5" />, color: 'sky' },
    { label: 'PHARMACY', icon: <ShieldCheck className="h-5 w-5" />, color: 'emerald' },
    { label: 'CONSUMER', icon: <ScanLine className="h-5 w-5" />, color: 'amber' },
  ]
  const colorMap: Record<string, string> = {
    cyan: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10',
    violet: 'border-violet-500/40 text-violet-300 bg-violet-500/10',
    sky: 'border-sky-500/40 text-sky-300 bg-sky-500/10',
    emerald: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
    amber: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
  }
  return (
    <div className="glass rounded-2xl p-4 sm:p-6 bg-grid">
      <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-0 md:items-center justify-between">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-3 md:flex-1 md:flex-col md:gap-2 md:text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
              className={`relative flex h-14 w-14 items-center justify-center rounded-xl border ${colorMap[s.color]} animate-float`}
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              {s.icon}
              <span className="absolute inset-0 rounded-xl border border-current opacity-40 animate-ping-ring" />
            </motion.div>
            <div className="md:mt-2">
              <div className="text-sm font-medium">{s.label}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Stage {i + 1}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Animated connecting line with data particles */}
      <svg className="hidden md:block w-full mt-2" height="30" viewBox="0 0 1000 30" preserveAspectRatio="none">
        <line x1="60" y1="15" x2="940" y2="15" stroke="url(#flow-grad)" strokeWidth="2" strokeDasharray="6 6" className="animate-dash-flow" />
        {/* Animated data particles */}
        {[0, 200, 400, 600, 800].map((delay, i) => (
          <motion.circle
            key={i}
            r="3"
            fill={i % 2 === 0 ? '#22d3ee' : '#a78bfa'}
            initial={{ cx: 60, cy: 15 }}
            animate={{ cx: [60, 940] }}
            transition={{ duration: 4, repeat: Infinity, delay: delay / 1000, ease: 'linear' }}
          />
        ))}
        <defs>
          <linearGradient id="flow-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
