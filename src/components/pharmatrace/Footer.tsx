'use client'
import { BrandMark } from './Brand'
import { Github, Shield, BookOpen, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid gap-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <BrandMark className="h-7 w-7" />
            <span className="font-semibold">PharmaTrace</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Blockchain-powered pharmaceutical authentication & supply chain transparency. Academic prototype.
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Platform</h4>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <li>Verify a Drug</li>
            <li>Supply Chain Tracking</li>
            <li>Blockchain Explorer</li>
            <li>Analytics</li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resources</h4>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <li>Research Paper Alignment</li>
            <li>Architecture Diagram</li>
            <li>Demo Credentials</li>
            <li>Future Scope</li>
          </ul>
        </div>
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
