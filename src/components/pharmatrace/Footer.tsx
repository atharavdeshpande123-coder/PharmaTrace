'use client'
import { BrandMark } from './Brand'
import { useRouter } from '@/store/router'
import {
  Shield, BookOpen, Heart, ScanLine, Truck, Network, BarChart3,
  Boxes, Info, Activity, FileText, GitBranch,
} from 'lucide-react'

export function Footer() {
  const { navigate } = useRouter()
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid gap-6 md:grid-cols-5">
        {/* Brand */}
        <div className="md:col-span-1">
          <button onClick={() => navigate('landing')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BrandMark className="h-7 w-7" />
            <span className="font-semibold">PharmaTrace</span>
          </button>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Verify. Trace. Trust. — Blockchain-powered pharmaceutical authentication & supply chain transparency. Academic prototype.
          </p>
          {/* Tech badges */}
          <div className="mt-3 flex flex-wrap gap-1">
            {['Next.js', 'Prisma', 'SHA-256', 'TypeScript'].map((t) => (
              <span key={t} className="rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{t}</span>
            ))}
          </div>
        </div>

        {/* Platform links */}
        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Platform</h4>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>
              <button onClick={() => navigate('verify')} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <ScanLine className="h-3 w-3" /> Verify a Drug
              </button>
            </li>
            <li>
              <button onClick={() => navigate('supply-chain')} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Truck className="h-3 w-3" /> Supply Chain Tracking
              </button>
            </li>
            <li>
              <button onClick={() => navigate('blockchain')} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Network className="h-3 w-3" /> Blockchain Explorer
              </button>
            </li>
            <li>
              <button onClick={() => navigate('analytics')} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3" /> Analytics
              </button>
            </li>
          </ul>
        </div>

        {/* Tools links */}
        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tools</h4>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>
              <button onClick={() => navigate('drugs')} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Boxes className="h-3 w-3" /> Drug Batches
              </button>
            </li>
            <li>
              <button onClick={() => navigate('compare-drugs')} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> Compare Drugs
              </button>
            </li>
            <li>
              <button onClick={() => navigate('lineage')} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <GitBranch className="h-3 w-3" /> Drug Lineage
              </button>
            </li>
            <li>
              <button onClick={() => navigate('transactions')} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> Transactions
              </button>
            </li>
          </ul>
        </div>

        {/* Resources links */}
        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resources</h4>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>
              <button onClick={() => navigate('about')} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Info className="h-3 w-3" /> About PharmaTrace
              </button>
            </li>
            <li>
              <button onClick={() => navigate('about')} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <BookOpen className="h-3 w-3" /> Architecture Diagram
              </button>
            </li>
            <li>
              <button onClick={() => navigate('about')} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Paper Alignment
              </button>
            </li>
          </ul>
        </div>

        {/* Status */}
        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</h4>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Network Online
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-3.5 w-3.5 text-emerald-300" />
              Chain Integrity Verified
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-3.5 w-3.5 text-cyan-300" />
              Demo Mode (Local Ledger)
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PharmaTrace — Academic Mini-Project. Not a production regulatory system.</p>
          <p className="flex items-center gap-1.5">
            Built with <Heart className="h-3 w-3 text-rose-400" /> using Next.js, Prisma & a local educational blockchain.
          </p>
        </div>
      </div>
    </footer>
  )
}
