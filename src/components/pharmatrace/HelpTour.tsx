'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, type RouteName } from '@/store/router'
import { Button } from '@/components/ui/button'
import {
  X, ArrowRight, ArrowLeft, ScanLine, Network, Boxes,
  ShieldCheck, LayoutDashboard, PackagePlus, CheckCircle2,
} from 'lucide-react'

const STORAGE_KEY = 'pharmatrace_tour_seen'

interface TourStep {
  title: string
  description: string
  icon: React.ReactNode
  route?: RouteName
  accent: string
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to PharmaTrace',
    description: 'A blockchain-powered pharmaceutical authentication & supply chain tracking platform. Let\'s take a 60-second tour of the key features.',
    icon: <ShieldCheck className="h-8 w-8" />,
    accent: 'from-cyan-500/20 to-violet-500/20',
  },
  {
    title: 'Verify a Drug',
    description: 'The most important page. Scan a QR code with your camera, enter a batch number manually, or upload a QR image. The system queries the blockchain and shows AUTHENTIC, NOT FOUND, FLAGGED, or EXPIRED.',
    icon: <ScanLine className="h-8 w-8" />,
    route: 'verify',
    accent: 'from-emerald-500/20 to-cyan-500/20',
  },
  {
    title: 'Track the Supply Chain',
    description: 'Follow every drug batch from Manufacturer → Distributor → Wholesaler → Pharmacy → Customer. Each handoff creates an immutable blockchain transaction.',
    icon: <Boxes className="h-8 w-8" />,
    route: 'supply-chain',
    accent: 'from-violet-500/20 to-sky-500/20',
  },
  {
    title: 'Explore the Blockchain',
    description: 'Inspect every SHA-256 hash-linked block. Run "Verify Chain Integrity" to confirm no tampering. Admins can try the "Tamper Demo" to see detection in action.',
    icon: <Network className="h-8 w-8" />,
    route: 'blockchain',
    accent: 'from-cyan-500/20 to-emerald-500/20',
  },
  {
    title: 'Register & Manage Drugs',
    description: 'Manufacturers can register new batches and generate signed QR codes. Pharmacists can dispense and print receipts. Everyone can star drugs to their watchlist.',
    icon: <PackagePlus className="h-8 w-8" />,
    route: 'drugs',
    accent: 'from-amber-500/20 to-violet-500/20',
  },
  {
    title: 'Your Dashboard',
    description: 'See live network stats, recent activity, your watchlist, and role-specific metrics. Use Cmd+K (or the Search button) to jump anywhere instantly.',
    icon: <LayoutDashboard className="h-8 w-8" />,
    route: 'dashboard',
    accent: 'from-violet-500/20 to-cyan-500/20',
  },
]

export function HelpTour() {
  const { navigate } = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    // Check if user has seen the tour
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (!seen) {
        // Auto-open after a short delay on first visit
        const t = setTimeout(() => setOpen(true), 1500)
        return () => clearTimeout(t)
      }
    } catch { /* ignore */ }
  }, [])

  const close = () => {
    setOpen(false)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      close()
    }
  }

  const prev = () => {
    if (step > 0) setStep(step - 1)
  }

  const goToRoute = () => {
    const s = STEPS[step]
    if (s.route) {
      navigate(s.route)
      close()
    }
  }

  const current = STEPS[step]

  return (
    <>
      {/* Floating help button (always visible) */}
      <button
        onClick={() => { setStep(0); setOpen(true) }}
        className="fixed bottom-20 lg:bottom-6 right-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform"
        aria-label="Help & Tour"
        title="Help & Tour"
      >
        <span className="text-lg font-bold">?</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={close}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl w-full max-w-md overflow-hidden glow-cyan"
            >
              {/* Gradient header */}
              <div className={`relative bg-gradient-to-br ${current.accent} p-8 text-center overflow-hidden`}>
                <div className="absolute inset-0 bg-grid opacity-30" />
                <button
                  onClick={close}
                  className="absolute top-3 right-3 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  aria-label="Close tour"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="relative">
                  <motion.div
                    key={step}
                    initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="inline-flex rounded-2xl bg-background/60 p-4 ring-1 ring-border/60 mb-3 text-primary"
                  >
                    {current.icon}
                  </motion.div>
                  <h2 className="text-xl font-semibold">{current.title}</h2>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-sm text-muted-foreground leading-relaxed text-center">
                  {current.description}
                </p>

                {/* Progress dots */}
                <div className="mt-5 flex justify-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/60'}`}
                      aria-label={`Step ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-5 flex items-center justify-between gap-2">
                  <Button variant="ghost" size="sm" onClick={close}>Skip</Button>
                  <div className="flex gap-2">
                    {step > 0 && (
                      <Button variant="outline" size="sm" onClick={prev}>
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                      </Button>
                    )}
                    {current.route && (
                      <Button variant="outline" size="sm" onClick={goToRoute}>
                        Try it <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    )}
                    <Button size="sm" onClick={next}>
                      {step === STEPS.length - 1 ? (
                        <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Got it</>
                      ) : (
                        <>Next <ArrowRight className="h-3.5 w-3.5 ml-1" /></>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="mt-3 text-center text-[10px] text-muted-foreground">
                  Step {step + 1} of {STEPS.length}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
