'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from '@/store/router'
import { GlassCard } from '../GlassCard'
import { StatCard } from '../StatCard'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck, ScanLine, Truck, Boxes, Activity, Network,
  ArrowRight, Cpu, Lock, QrCode, Boxes as BoxesIcon,
} from 'lucide-react'
import { apiGet } from '@/lib/client/api'

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
      <section className="relative pt-10 sm:pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Blockchain connected · Local educational ledger
            </div>
            <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
              Trust Every <span className="gradient-text">Dose.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground text-balance">
              Verify pharmaceutical authenticity and trace every drug batch through a transparent
              blockchain-powered supply chain — from manufacturer to patient.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('verify')} className="bg-primary text-primary-foreground">
                <ScanLine className="h-4 w-4 mr-2" /> Verify a Drug
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('supply-chain')}>
                <Truck className="h-4 w-4 mr-2" /> Explore Supply Chain
              </Button>
              <Button size="lg" variant="ghost" onClick={() => navigate('about')}>
                Learn How It Works <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>

          {/* Animated flow */}
          <div className="mt-12">
            <SupplyChainFlow />
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

      {/* Feature cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Built like a Web3 pharma platform</h2>
          <p className="mt-2 text-muted-foreground">Every dose is provable. Every handoff is on-chain.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<QrCode className="h-5 w-5" />} accent="cyan"
            title="QR Verification"
            text="Each batch gets a signed QR token. Scan it on any phone to query the blockchain and confirm authenticity."
          />
          <FeatureCard
            icon={<Network className="h-5 w-5" />} accent="violet"
            title="Tamper-Evident Ledger"
            text="SHA-256 hash-linked blocks. Any modified record breaks the chain and is flagged instantly."
          />
          <FeatureCard
            icon={<Truck className="h-5 w-5" />} accent="emerald"
            title="Supply Chain Traceability"
            text="Track every batch from manufacturer → distributor → wholesaler → pharmacy → customer."
          />
          <FeatureCard
            icon={<Cpu className="h-5 w-5" />} accent="amber"
            title="Chaincode Abstraction"
            text="Smart-contract layer mirrors Hyperledger Fabric chaincode so the demo can scale to real Fabric."
          />
          <FeatureCard
            icon={<Lock className="h-5 w-5" />} accent="rose"
            title="Role-Based Access"
            text="JWT + bcrypt with role-aware endpoints. Manufacturers register, distributors transfer, customers verify."
          />
          <FeatureCard
            icon={<Activity className="h-5 w-5" />} accent="sky"
            title="Analytics & Audit Trail"
            text="Live charts of verifications, transfers, and on-chain transactions. Full immutable history."
          />
        </div>
      </section>

      {/* Why blockchain */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <GlassCard glow="violet" className="p-6 sm:p-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-semibold">Why blockchain for pharma?</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Traditional databases can be silently modified by privileged administrators. A blockchain
                links every record cryptographically — altering one block invalidates every block after it.
                This makes supply-chain tampering immediately visible to pharmacists and customers.
              </p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Important:</strong> blockchain alone does not guarantee
                pharmaceutical authenticity. Authenticity depends on trustworthy data entered by authorized
                participants. This prototype uses a local educational ledger; a permissioned
                <em> Hyperledger Fabric</em> deployment can be plugged in for production-grade use.
              </p>
              <Button className="mt-5" variant="outline" onClick={() => navigate('blockchain')}>
                <Network className="h-4 w-4 mr-2" /> Open Blockchain Explorer
              </Button>
            </div>
            <BlockVisual />
          </div>
        </GlassCard>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <GlassCard className="text-center p-8 sm:p-12" glow="cyan">
          <h3 className="text-2xl sm:text-3xl font-semibold">Ready to verify a drug?</h3>
          <p className="mt-2 text-muted-foreground">Try the live demo with seeded pharmaceutical data.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate('verify')}>
              <ScanLine className="h-4 w-4 mr-2" /> Start Verification
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('register')}>
              <BoxesIcon className="h-4 w-4 mr-2" /> Create Demo Account
            </Button>
          </div>
        </GlassCard>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, text, accent }: {
  icon: React.ReactNode
  title: string
  text: string
  accent: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky'
}) {
  const accents: Record<string, string> = {
    cyan: 'text-cyan-300 bg-cyan-500/15 ring-cyan-500/30',
    violet: 'text-violet-300 bg-violet-500/15 ring-violet-500/30',
    emerald: 'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30',
    amber: 'text-amber-300 bg-amber-500/15 ring-amber-500/30',
    rose: 'text-rose-300 bg-rose-500/15 ring-rose-500/30',
    sky: 'text-sky-300 bg-sky-500/15 ring-sky-500/30',
  }
  return (
    <GlassCard className="hover:-translate-y-0.5 transition-transform">
      <div className={`inline-flex rounded-lg p-2.5 ring-1 ${accents[accent]}`}>{icon}</div>
      <h4 className="mt-3 font-semibold">{title}</h4>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{text}</p>
    </GlassCard>
  )
}

function SupplyChainFlow() {
  const stages = [
    { label: 'Manufacturer', icon: <Boxes className="h-5 w-5" />, color: 'cyan' },
    { label: 'Distributor', icon: <Truck className="h-5 w-5" />, color: 'violet' },
    { label: 'Wholesaler', icon: <Boxes className="h-5 w-5" />, color: 'sky' },
    { label: 'Pharmacy', icon: <ShieldCheck className="h-5 w-5" />, color: 'emerald' },
    { label: 'Customer', icon: <ScanLine className="h-5 w-5" />, color: 'amber' },
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
            {i < stages.length - 1 && (
              <div className="hidden md:block absolute" style={{ left: `${(i + 1) * 20}%` }} />
            )}
          </div>
        ))}
      </div>
      {/* Connecting line for desktop */}
      <svg className="hidden md:block w-full mt-2" height="20" viewBox="0 0 1000 20" preserveAspectRatio="none">
        <line
          x1="60" y1="10" x2="940" y2="10"
          stroke="url(#flow-grad)" strokeWidth="2" strokeDasharray="6 6"
          className="animate-dash-flow"
        />
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

function BlockVisual() {
  const blocks = [
    { n: '#101', hash: '0x7f3a…c91b', color: 'cyan' },
    { n: '#102', hash: '0x8a2d…4f7e', color: 'violet' },
    { n: '#103', hash: '0x91bc…0d3a', color: 'emerald' },
    { n: '#104', hash: '0xa3f1…77bc', color: 'amber' },
  ]
  const colorMap: Record<string, string> = {
    cyan: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10',
    violet: 'border-violet-500/40 text-violet-300 bg-violet-500/10',
    emerald: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
    amber: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
  }
  return (
    <div className="space-y-2">
      {blocks.map((b, i) => (
        <motion.div
          key={b.n}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`flex items-center justify-between rounded-lg border px-4 py-2.5 ${colorMap[b.color]}`}
        >
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            <span className="font-mono text-sm">{b.n}</span>
          </div>
          <span className="text-xs font-mono opacity-80">{b.hash}</span>
        </motion.div>
      ))}
    </div>
  )
}
