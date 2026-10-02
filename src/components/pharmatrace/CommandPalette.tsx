'use client'
import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter, type RouteName } from '@/store/router'
import { useAuth } from '@/store/auth'
import { apiGet } from '@/lib/client/api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Boxes, Network, Activity, ShieldCheck, PackagePlus,
  LayoutDashboard, BarChart3, Truck, Info, ArrowRight, Hash, CornerDownLeft, FileText, GitCompare,
} from 'lucide-react'
import { shortHash } from '@/lib/client/format'
import { cn } from '@/lib/utils'

interface SearchDrug { id: string; drugId: string; drugName: string; batchNumber: string; status: string }
interface SearchTx { id: string; transactionHash: string; type: string; drug: { drugId: string; drugName: string; batchNumber: string } | null; block: { blockNumber: number } | null }
interface SearchBlock { blockNumber: number; hash: string; transactionCount: number }

interface CommandItem {
  id: string
  type: 'page' | 'drug' | 'tx' | 'block'
  label: string
  sublabel?: string
  icon: React.ReactNode
  accent: string
  action: () => void
}

export function CommandPalette() {
  const { navigate } = useRouter()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [drugs, setDrugs] = useState<SearchDrug[]>([])
  const [txs, setTxs] = useState<SearchTx[]>([])
  const [blocks, setBlocks] = useState<SearchBlock[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Preload data when palette opens
  useEffect(() => {
    if (!open) return
    // defer state reset to next tick to avoid cascading renders
    const resetTimer = setTimeout(() => { setQuery(''); setActiveIndex(0) }, 0)
    let cancelled = false
    Promise.all([
      apiGet<{ drugs: SearchDrug[] }>('/api/drugs?limit=50').catch(() => ({ drugs: [] })),
      apiGet<{ transactions: SearchTx[] }>('/api/blockchain/transactions?limit=50').catch(() => ({ transactions: [] })),
      apiGet<{ blocks: any[] }>('/api/blockchain/blocks?limit=30').catch(() => ({ blocks: [] })),
    ]).then(([d, t, b]) => {
      if (cancelled) return
      setDrugs(d.drugs)
      setTxs(t.transactions)
      setBlocks(b.blocks.map((blk: any) => ({ blockNumber: blk.blockNumber, hash: blk.hash, transactionCount: blk.transactions?.length ?? 0 })))
    })
    setTimeout(() => inputRef.current?.focus(), 50)
    return () => { cancelled = true; clearTimeout(resetTimer) }
  }, [open])

  // Build the command list
  const items = useMemo<CommandItem[]>(() => {
    const pageItems: CommandItem[] = [
      { id: 'p-dash', type: 'page', label: 'Dashboard', sublabel: 'Your role-based overview', icon: <LayoutDashboard className="h-4 w-4" />, accent: 'text-cyan-300', action: () => navigate('dashboard') },
      { id: 'p-verify', type: 'page', label: 'Verify Drug', sublabel: 'Scan QR or enter batch ID', icon: <ShieldCheck className="h-4 w-4" />, accent: 'text-emerald-300', action: () => navigate('verify') },
      { id: 'p-supply', type: 'page', label: 'Supply Chain Tracking', sublabel: 'Browse batch journeys', icon: <Truck className="h-4 w-4" />, accent: 'text-violet-300', action: () => navigate('supply-chain') },
      { id: 'p-blocks', type: 'page', label: 'Blockchain Explorer', sublabel: 'Inspect the ledger', icon: <Network className="h-4 w-4" />, accent: 'text-cyan-300', action: () => navigate('blockchain') },
      { id: 'p-txs', type: 'page', label: 'Transactions', sublabel: 'On-chain history', icon: <Activity className="h-4 w-4" />, accent: 'text-sky-300', action: () => navigate('transactions') },
      { id: 'p-analytics', type: 'page', label: 'Analytics', sublabel: 'Live charts & insights', icon: <BarChart3 className="h-4 w-4" />, accent: 'text-amber-300', action: () => navigate('analytics') },
      { id: 'p-drugs', type: 'page', label: 'Drug Batches', sublabel: 'All registered batches', icon: <Boxes className="h-4 w-4" />, accent: 'text-emerald-300', action: () => navigate('drugs') },
      { id: 'p-compare', type: 'page', label: 'Compare Drugs', sublabel: 'Side-by-side batch comparison', icon: <GitCompare className="h-4 w-4" />, accent: 'text-cyan-300', action: () => navigate('compare-drugs') },
      { id: 'p-about', type: 'page', label: 'About PharmaTrace', sublabel: 'Architecture & paper alignment', icon: <Info className="h-4 w-4" />, accent: 'text-muted-foreground', action: () => navigate('about') },
    ]
    if (user?.role === 'MANUFACTURER' || user?.role === 'ADMIN') {
      pageItems.splice(1, 0, { id: 'p-reg', type: 'page', label: 'Register Drug', sublabel: 'Create a new batch + QR', icon: <PackagePlus className="h-4 w-4" />, accent: 'text-violet-300', action: () => navigate('register-drug') })
    }
    if (user?.role === 'ADMIN') {
      pageItems.push({ id: 'p-admin', type: 'page', label: 'Admin Dashboard', sublabel: 'Users & reseed', icon: <LayoutDashboard className="h-4 w-4" />, accent: 'text-amber-300', action: () => navigate('admin-users') })
      pageItems.push({ id: 'p-reports', type: 'page', label: 'System Reports', sublabel: 'Printable summary + PDF export', icon: <FileText className="h-4 w-4" />, accent: 'text-cyan-300', action: () => navigate('reports') })
    }

    const drugItems: CommandItem[] = drugs
      .filter((d) => !query || d.drugName.toLowerCase().includes(query.toLowerCase()) || d.batchNumber.toLowerCase().includes(query.toLowerCase()) || d.drugId.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6)
      .map((d) => ({
        id: 'd-' + d.id, type: 'drug' as const, label: d.drugName, sublabel: `${d.batchNumber} · ${d.drugId}`,
        icon: <Boxes className="h-4 w-4" />, accent: 'text-emerald-300',
        action: () => navigate('drug-detail', { id: d.drugId }),
      }))

    const txItems: CommandItem[] = txs
      .filter((t) => !query || t.transactionHash.toLowerCase().includes(query.toLowerCase()) || (t.drug?.drugName ?? '').toLowerCase().includes(query.toLowerCase()) || (t.drug?.batchNumber ?? '').toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6)
      .map((t) => ({
        id: 't-' + t.id, type: 'tx' as const, label: t.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        sublabel: `${shortHash(t.transactionHash, 10, 6)} · Block #${t.block?.blockNumber ?? '—'}${t.drug ? ' · ' + t.drug.drugName : ''}`,
        icon: <Activity className="h-4 w-4" />, accent: 'text-sky-300',
        action: () => {
          if (t.drug) navigate('drug-detail', { id: t.drug.drugId })
          else if (t.block) navigate('blockchain-detail', { number: String(t.block.blockNumber) })
        },
      }))

    const blockItems: CommandItem[] = blocks
      .filter((b) => !query || String(b.blockNumber).includes(query) || b.hash.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map((b) => ({
        id: 'b-' + b.blockNumber, type: 'block' as const, label: `Block #${b.blockNumber}`,
        sublabel: `${shortHash(b.hash, 12, 8)} · ${b.transactionCount} tx`,
        icon: <Network className="h-4 w-4" />, accent: 'text-cyan-300',
        action: () => navigate('blockchain-detail', { number: String(b.blockNumber) }),
      }))

    let all = [...pageItems]
    if (query) {
      all = all.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()) || (p.sublabel ?? '').toLowerCase().includes(query.toLowerCase()))
    }
    if (drugItems.length) all.push({ id: 'sep-drugs', type: 'page', label: '__sep__', sublabel: 'Drugs', icon: <Hash className="h-3 w-3" />, accent: '', action: () => {} })
    all.push(...drugItems)
    if (txItems.length) all.push({ id: 'sep-txs', type: 'page', label: '__sep__', sublabel: 'Transactions', icon: <Hash className="h-3 w-3" />, accent: '', action: () => {} })
    all.push(...txItems)
    if (blockItems.length) all.push({ id: 'sep-blocks', type: 'page', label: '__sep__', sublabel: 'Blocks', icon: <Hash className="h-3 w-3" />, accent: '', action: () => {} })
    all.push(...blockItems)
    return all.filter((i) => i.label !== '__sep__' || query === '' || drugItems.length || txItems.length || blockItems.length)
  }, [query, drugs, txs, blocks, user, navigate])

  // Filter separators when there's a query
  const visibleItems = useMemo(() => {
    if (!query) return items
    // keep only matched items + separators that have content below
    const filtered: CommandItem[] = []
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (it.label === '__sep__') continue
      filtered.push(it)
    }
    return filtered
  }, [items, query])

  // Track active index ref for keyboard nav
  const activeIndexRef = useRef(0)
  useEffect(() => { activeIndexRef.current = activeIndex }, [activeIndex])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(visibleItems.length - 1, i + 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(0, i - 1)) }
      else if (e.key === 'Enter') {
        e.preventDefault()
        const item = visibleItems[activeIndex]
        if (item) { item.action(); setOpen(false) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, visibleItems, activeIndex])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  return (
    <>
      {/* Trigger button - rendered by Navbar via context */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
        title="Search anything (Cmd+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search…</span>
        <kbd className="ml-2 rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl glow-cyan"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
                  placeholder="Search drugs, transactions, blocks, or jump to a page…"
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
                <kbd className="rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">ESC</kbd>
              </div>
              {/* Results */}
              <div ref={listRef} className="max-h-[60vh] overflow-y-auto scrollbar-thin py-2">
                {visibleItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No results for “{query}”
                  </div>
                ) : (
                  visibleItems.map((item, idx) => {
                    if (item.label === '__sep__') {
                      return (
                        <div key={item.id} className="px-4 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
                          {item.sublabel}
                        </div>
                      )
                    }
                    return (
                      <button
                        key={item.id}
                        data-idx={idx}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => { item.action(); setOpen(false) }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                          activeIndex === idx ? 'bg-primary/15' : 'hover:bg-muted/40',
                        )}
                      >
                        <span className={cn('shrink-0', item.accent)}>{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.label}</div>
                          {item.sublabel && <div className="text-xs text-muted-foreground truncate font-mono">{item.sublabel}</div>}
                        </div>
                        {activeIndex === idx && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      </button>
                    )
                  })
                )}
              </div>
              {/* Footer */}
              <div className="border-t border-border/60 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span><kbd className="rounded bg-muted-foreground/15 px-1 py-0.5 font-mono">↑↓</kbd> navigate</span>
                  <span><kbd className="rounded bg-muted-foreground/15 px-1 py-0.5 font-mono">↵</kbd> select</span>
                  <span><kbd className="rounded bg-muted-foreground/15 px-1 py-0.5 font-mono">esc</kbd> close</span>
                </div>
                <span className="flex items-center gap-1">PharmaTrace Search <ArrowRight className="h-2.5 w-2.5" /></span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
