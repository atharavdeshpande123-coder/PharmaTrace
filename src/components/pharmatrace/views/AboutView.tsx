'use client'
import { useRouter } from '@/store/router'
import { PageHeader } from '../States'
import { GlassCard } from '../GlassCard'
import { Button } from '@/components/ui/button'
import { NetworkGraphWidget } from '../NetworkGraphWidget'
import { MiningDemoWidget } from '../MiningDemoWidget'
import { DifficultySimulatorWidget } from '../DifficultySimulatorWidget'
import {
  Info, Network, ShieldCheck, QrCode, Truck, Cpu, Lock, Boxes,
  Database, ArrowRight, ArrowDown, Boxes as BoxesIcon, BookOpen, FlaskConical, Activity,
} from 'lucide-react'

export function AboutView() {
  const { navigate } = useRouter()
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Info className="h-5 w-5" />}
        title="About PharmaTrace"
        subtitle="An academic prototype exploring blockchain-based pharmaceutical authentication."
      />

      <GlassCard glow="violet" className="p-6 sm:p-8">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h2 className="text-2xl font-semibold">Problem</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Counterfeit and diverted pharmaceuticals cause harm worldwide. Traditional databases can be
              silently modified by privileged admins, making it hard for pharmacists and patients to trust
              a drug's origin, batch history, and current location.
            </p>
            <h2 className="mt-5 text-2xl font-semibold">Solution</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              PharmaTrace records every batch on a tamper-evident blockchain. Each batch receives a signed
              QR token; every supply-chain handoff creates an immutable transaction. A pharmacy or customer
              can scan the QR to confirm authenticity and view the full journey.
            </p>
          </div>
          <ArchitectureDiagram />
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Section icon={<Network className="h-5 w-5" />} title="Blockchain Role" accent="cyan">
          A SHA-256 hash-linked ledger makes any modified record immediately visible. Each block references
          the previous block's hash, producing a tamper-evident chain. The local adapter mirrors the
          chaincode model of Hyperledger Fabric so the demo can scale to real Fabric.
        </Section>
        <Section icon={<QrCode className="h-5 w-5" />} title="QR Authentication" accent="violet">
          Each batch receives an HMAC-signed QR token. The QR contains no medical data — only an opaque
          identifier the backend can validate. Scanning the QR opens the public verification flow.
        </Section>
        <Section icon={<Truck className="h-5 w-5" />} title="Supply Chain Tracking" accent="emerald">
          Manufacturer → Distributor → Wholesaler → Pharmacy → Customer. Each stage creates a supply-chain
          event and an on-chain transaction, so the full journey is auditable from any device.
        </Section>
        <Section icon={<Cpu className="h-5 w-5" />} title="Smart Contracts" accent="amber">
          A separate contract layer enforces business rules: only the current owner can transfer a batch,
          expired batches cannot be moved, flagged batches are blocked, verification never mutates records.
        </Section>
        <Section icon={<Lock className="h-5 w-5" />} title="Security" accent="rose">
          JWT auth, bcrypt password hashing, role-based authorization, input validation, and rate limiting
          on the public verification endpoint. Passwords are never exposed.
        </Section>
        <Section icon={<Database className="h-5 w-5" />} title="Technology Stack" accent="sky">
          Next.js 16 + TypeScript, Prisma + SQLite, Tailwind CSS + shadcn/ui, Recharts, Framer Motion.
          Blockchain is a custom local adapter ready for Hyperledger Fabric integration.
        </Section>
      </div>

      <GlassCard>
        <h3 className="font-semibold mb-4">System Architecture</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wider">Request Flow</h4>
            <FlowDiagram
              steps={[
                { label: 'User', icon: <BoxesIcon className="h-4 w-4" /> },
                { label: 'Frontend (React)', icon: <Activity className="h-4 w-4" /> },
                { label: 'Backend API', icon: <Cpu className="h-4 w-4" /> },
                { label: 'Authentication', icon: <Lock className="h-4 w-4" /> },
                { label: 'Drug Database', icon: <Database className="h-4 w-4" /> },
                { label: 'Blockchain Service', icon: <Network className="h-4 w-4" /> },
                { label: 'Smart Contract', icon: <Cpu className="h-4 w-4" /> },
                { label: 'Blockchain Ledger', icon: <ShieldCheck className="h-4 w-4" /> },
              ]}
            />
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wider">Supply Chain Flow</h4>
            <FlowDiagram
              steps={[
                { label: 'Manufacturer', icon: <BoxesIcon className="h-4 w-4" /> },
                { label: 'Distributor', icon: <Truck className="h-4 w-4" /> },
                { label: 'Wholesaler', icon: <BoxesIcon className="h-4 w-4" /> },
                { label: 'Pharmacy', icon: <ShieldCheck className="h-4 w-4" /> },
                { label: 'Customer', icon: <QrCode className="h-4 w-4" /> },
              ]}
            />
          </div>
        </div>
      </GlassCard>

      {/* Live Network Graph */}
      <NetworkGraphWidget />

      {/* Mining Demo */}
      <MiningDemoWidget />

      {/* Difficulty Simulator */}
      <DifficultySimulatorWidget />

      <GlassCard>
        <h3 className="font-semibold mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4" /> Research Paper Alignment</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This implementation aligns conceptually with the research paper
          <em> “Blockchain-Based Approach for Pharmaceutical Drug Authentication.”</em> The paper describes
          user account management, code submission & input validation, backend + blockchain integration,
          and smart contracts for validating medication information — all of which are implemented here as
          core modules. Features that go beyond the paper (analytics dashboard, blockchain explorer,
          notification system) are clearly labelled as prototype extensions.
        </p>
        <div className="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
          <PaperRow concept="User Account Management" implemented="Auth + roles + JWT" />
          <PaperRow concept="Code Submission & Validation" implemented="Drug registration form + server validation" />
          <PaperRow concept="Backend & Blockchain Integration" implemented="REST API → BlockchainService → Ledger" />
          <PaperRow concept="Smart Contracts & Validation" implemented="registerDrug / transferDrug / verifyDrug" />
          <PaperRow concept="QR / Batch Codes" implemented="Signed QR tokens + QR scanner" />
          <PaperRow concept="Audit Trails" implemented="SupplyChainEvent + Transaction tables" />
        </div>
      </GlassCard>

      <GlassCard glow="cyan">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Academic Disclaimer</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          PharmaTrace is an academic mini-project for demonstration purposes. It is <strong>not</strong> a
          production pharmaceutical regulatory system. The blockchain used here is a local educational
          ledger (a real SHA-256 hash-linked chain persisted to SQLite), not a deployed Hyperledger Fabric
          network. Blockchain alone does not guarantee pharmaceutical authenticity — authenticity depends on
          trustworthy data entered by authorized participants.
        </p>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold mb-3">Future Scope</h3>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
          {[
            'Hyperledger Fabric deployment',
            'IoT sensor integration & temperature monitoring',
            'Cold-chain tracking',
            'Real pharmaceutical database APIs',
            'Mobile application',
            'NFC integration',
            'Advanced anomaly detection',
            'Regulatory integration',
            'Multi-organization permissioned blockchain',
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> {f}
            </li>
          ))}
        </ul>
      </GlassCard>

      <div className="flex justify-center">
        <Button size="lg" onClick={() => navigate('verify')}>Try the Live Demo <ArrowRight className="h-4 w-4 ml-2" /></Button>
      </div>
    </div>
  )
}

function Section({ icon, title, children, accent }: { icon: React.ReactNode; title: string; children: React.ReactNode; accent: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' }) {
  const accents: Record<string, string> = {
    cyan: 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/30',
    violet: 'bg-violet-500/15 text-violet-300 ring-violet-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
    sky: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  }
  return (
    <GlassCard>
      <div className={`inline-flex rounded-lg p-2.5 ring-1 ${accents[accent]}`}>{icon}</div>
      <h4 className="mt-3 font-semibold">{title}</h4>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{children}</p>
    </GlassCard>
  )
}

function PaperRow({ concept, implemented }: { concept: string; implemented: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{concept}</div>
      <div className="text-sm">{implemented}</div>
    </div>
  )
}

function FlowDiagram({ steps }: { steps: { label: string; icon: React.ReactNode }[] }) {
  return (
    <div className="space-y-1">
      {steps.map((s, i) => (
        <div key={s.label}>
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
            <div className="rounded-md bg-primary/15 p-1.5 text-primary ring-1 ring-primary/30">{s.icon}</div>
            <span className="text-sm">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex justify-center py-0.5">
              <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ArchitectureDiagram() {
  return (
    <div className="relative">
      <svg viewBox="0 0 400 320" className="w-full h-auto">
        <defs>
          <linearGradient id="arch-cyan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        {/* central node */}
        <circle cx="200" cy="160" r="36" fill="url(#arch-cyan)" opacity="0.9" />
        <text x="200" y="166" textAnchor="middle" fontSize="11" fill="#0a0a0f" fontWeight="bold">Ledger</text>
        {/* orbiting nodes */}
        {[
          { x: 80, y: 80, label: 'Mfg', color: '#22d3ee' },
          { x: 320, y: 80, label: 'Dist', color: '#a78bfa' },
          { x: 80, y: 240, label: 'Phm', color: '#34d399' },
          { x: 320, y: 240, label: 'Cust', color: '#fbbf24' },
        ].map((n) => (
          <g key={n.label}>
            <line x1={n.x} y1={n.y} x2="200" y2="160" stroke={n.color} strokeWidth="1.5" opacity="0.5" strokeDasharray="4 4" className="animate-dash-flow" />
            <circle cx={n.x} cy={n.y} r="22" fill={n.color} opacity="0.85" />
            <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="10" fill="#0a0a0f" fontWeight="bold">{n.label}</text>
          </g>
        ))}
        {/* rotating ring */}
        <circle cx="200" cy="160" r="90" fill="none" stroke="#ffffff20" strokeWidth="1" strokeDasharray="2 4" className="animate-spin-slow" style={{ transformOrigin: '200px 160px' }} />
      </svg>
    </div>
  )
}
