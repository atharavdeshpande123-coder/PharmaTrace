'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  X, Keyboard, Search, ArrowUp, ArrowDown, CornerDownLeft, Escape,
  LayoutDashboard, ScanLine, Network, Activity, BarChart3, Boxes,
  PackagePlus, Truck, Info, Sun, Moon, HelpCircle,
} from 'lucide-react'
import type { RouteName } from '@/store/router'

interface ShortcutItem {
  keys: string
  label: string
  icon?: React.ReactNode
  action?: () => void
}

const NAV_SHORTCUTS: ShortcutItem[] = [
  { keys: 'G D', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { keys: 'G V', label: 'Verify Drug', icon: <ScanLine className="h-4 w-4" /> },
  { keys: 'G S', label: 'Supply Chain', icon: <Truck className="h-4 w-4" /> },
  { keys: 'G B', label: 'Blockchain', icon: <Network className="h-4 w-4" /> },
  { keys: 'G T', label: 'Transactions', icon: <Activity className="h-4 w-4" /> },
  { keys: 'G A', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
  { keys: 'G R', label: 'Drugs', icon: <Boxes className="h-4 w-4" /> },
  { keys: 'G E', label: 'Register Drug', icon: <PackagePlus className="h-4 w-4" /> },
  { keys: 'G I', label: 'About', icon: <Info className="h-4 w-4" /> },
]

const ACTION_SHORTCUTS: ShortcutItem[] = [
  { keys: '⌘K', label: 'Open Command Palette' },
  { keys: '↑', label: 'Move up in palette/results' },
  { keys: '↓', label: 'Move down in palette/results' },
  { keys: '↵', label: 'Select / Confirm' },
  { keys: 'Esc', label: 'Close dialog / palette' },
]

export function KeyboardShortcutsOverlay() {
  const { navigate } = useRouter()
  const [open, setOpen] = useState(false)
  const [pendingKeys, setPendingKeys] = useState<string[]>([])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Open with ?
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Only trigger if not typing in an input
        const tag = (e.target as HTMLElement)?.tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !(e.target as HTMLElement)?.isContentEditable) {
          e.preventDefault()
          setOpen((v) => !v)
          setPendingKeys([])
          return
        }
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
        setPendingKeys([])
        return
      }

      // G + letter navigation (only if overlay not open)
      if (open) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key.toLowerCase() === 'g') {
        setPendingKeys(['g'])
        return
      }
      if (pendingKeys[0] === 'g') {
        const key = e.key.toLowerCase()
        const routeMap: Record<string, RouteName> = {
          d: 'dashboard', v: 'verify', s: 'supply-chain', b: 'blockchain',
          t: 'transactions', a: 'analytics', r: 'drugs', e: 'register-drug',
          i: 'about',
        }
        if (routeMap[key]) {
          e.preventDefault()
          navigate(routeMap[key])
        }
        setPendingKeys([])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, pendingKeys, navigate])

  // Clear pending keys after a timeout
  useEffect(() => {
    if (pendingKeys.length === 0) return
    const t = setTimeout(() => setPendingKeys([]), 1000)
    return () => clearTimeout(t)
  }, [pendingKeys])

  // Listen for pending "g" key and show visual indicator
  useEffect(() => {
    if (pendingKeys[0] === 'g') {
      const el = document.createElement('div')
      el.id = 'pharmatrace-key-hint'
      el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:50;background:oklch(0.78 0.16 195);color:#0a0a0f;padding:6px 16px;border-radius:8px;font-size:12px;font-weight:600;font-family:monospace;box-shadow:0 4px 20px rgba(0,0,0,0.4);'
      el.textContent = 'G + (D/V/S/B/T/A/R/E/I) → navigate'
      document.body.appendChild(el)
      return () => { el.remove() }
    }
  }, [pendingKeys])

  return (
    <>
      {/* Hidden trigger button for accessibility */}
      <button
        onClick={() => setOpen(true)}
        className="sr-only"
        aria-label="Show keyboard shortcuts"
      >
        Show shortcuts
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass-strong rounded-2xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/60">
                <h3 className="font-semibold flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-cyan-300" />
                  Keyboard Shortcuts
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 max-h-[70vh] overflow-y-auto scrollbar-thin grid sm:grid-cols-2 gap-6">
                {/* Navigation shortcuts */}
                <div>
                  <h4 className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-3">Navigation (G + letter)</h4>
                  <div className="space-y-2">
                    {NAV_SHORTCUTS.map((s) => (
                      <div key={s.label} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{s.icon}</span>
                          {s.label}
                        </span>
                        <span className="flex gap-1">
                          <kbd className="rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-mono font-semibold">G</kbd>
                          <kbd className="rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-mono font-semibold">
                            {s.keys.split(' ')[1]}
                          </kbd>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action shortcuts */}
                <div>
                  <h4 className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-3">Actions</h4>
                  <div className="space-y-2">
                    {ACTION_SHORTCUTS.map((s) => (
                      <div key={s.label} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">{s.label}</span>
                        <kbd className="rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-mono font-semibold">
                          {s.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>

                  {/* Quick links */}
                  <h4 className="text-xs uppercase tracking-[0.16em] text-muted-foreground mt-5 mb-3">Quick Access</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setOpen(false); navigate('settings') }}>
                      <HelpCircle className="h-3.5 w-3.5 mr-1" /> Settings
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setOpen(false); navigate('about') }}>
                      <Info className="h-3.5 w-3.5 mr-1" /> About
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border/60 px-5 py-3 text-center text-[10px] text-muted-foreground">
                Press <kbd className="rounded bg-muted-foreground/15 px-1 py-0.5 font-mono font-semibold">?</kbd> anytime to toggle this overlay ·
                Press <kbd className="rounded bg-muted-foreground/15 px-1 py-0.5 font-mono font-semibold">Esc</kbd> to close
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
