'use client'
import { useState, useRef, useEffect } from 'react'
import { GlassCard } from './GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, Zap, Hash, Play, Pause, RotateCcw, CheckCircle2, XCircle,
  Pickaxe, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

/**
 * Blockchain Mining Demo — interactive proof-of-work visualization.
 *
 * Shows how the PharmaTrace blockchain mines a block:
 *   1. Build a candidate block from index + timestamp + data + previousHash.
 *   2. Try nonce = 0, 1, 2, 3, ... computing SHA-256 each time.
 *   3. If the hash starts with N zeros, mining succeeds.
 *
 * The demo mines in the browser using the Web Crypto API (real SHA-256).
 */

interface MiningState {
  isMining: boolean
  nonce: number
  hash: string
  attempts: number
  found: boolean
  difficulty: number
  blockData: string
  previousHash: string
  hashHistory: { nonce: number; hash: string }[]
}

const INITIAL: MiningState = {
  isMining: false,
  nonce: 0,
  hash: '',
  attempts: 0,
  found: false,
  difficulty: 3,
  blockData: 'PharmaTrace Block #1: DRUG_REGISTERED Paracetamol 500mg',
  previousHash: '0000a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
  hashHistory: [],
}

export function MiningDemoWidget() {
  const [state, setState] = useState<MiningState>(INITIAL)
  const [speed, setSpeed] = useState(50) // attempts per tick
  const miningRef = useRef(false)
  const nonceRef = useRef(0)
  const cancelRef = useRef(false)

  const computeHash = async (data: string, nonce: number): Promise<string> => {
    const input = `${data}|${nonce}`
    const encoder = new TextEncoder()
    const buf = await crypto.subtle.digest('SHA-256', encoder.encode(input))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const startMining = async () => {
    if (state.isMining) return
    cancelRef.current = false
    miningRef.current = true
    setState((s) => ({ ...s, isMining: true, found: false, attempts: 0, nonce: 0, hash: '', hashHistory: [] }))
    nonceRef.current = 0

    const target = '0'.repeat(state.difficulty)
    const history: { nonce: number; hash: string }[] = []

    while (!cancelRef.current) {
      // Mine a batch of nonces per tick for speed
      for (let i = 0; i < speed && !cancelRef.current; i++) {
        const hash = await computeHash(state.blockData, nonceRef.current)
        history.push({ nonce: nonceRef.current, hash })
        if (history.length > 20) history.shift()

        if (hash.startsWith(target)) {
          // Found!
          setState((s) => ({
            ...s,
            isMining: false,
            nonce: nonceRef.current,
            hash,
            attempts: nonceRef.current + 1,
            found: true,
            hashHistory: history,
          }))
          miningRef.current = false
          toast.success(`Block mined! Nonce = ${nonceRef.current} after ${nonceRef.current + 1} attempts`)
          return
        }
        nonceRef.current++
      }

      // Update state for display
      setState((s) => ({
        ...s,
        nonce: nonceRef.current,
        hash: history[history.length - 1]?.hash ?? '',
        attempts: nonceRef.current,
        hashHistory: [...history],
      }))

      // Yield to the event loop so UI can update
      await new Promise((r) => setTimeout(r, 16))
    }

    // Mining stopped
    setState((s) => ({ ...s, isMining: false }))
    miningRef.current = false
  }

  const stopMining = () => {
    cancelRef.current = true
    miningRef.current = false
    setState((s) => ({ ...s, isMining: false }))
    toast.info('Mining stopped')
  }

  const reset = () => {
    cancelRef.current = true
    miningRef.current = false
    setState((s) => ({ ...INITIAL, difficulty: s.difficulty, blockData: s.blockData, previousHash: s.previousHash }))
  }

  return (
    <GlassCard glow="amber">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Pickaxe className="h-4 w-4 text-amber-300" />
          Proof-of-Work Mining Demo
        </h3>
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Real SHA-256
        </span>
      </div>

      {/* Configuration */}
      <div className="space-y-3 mb-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Block Data (what gets hashed)</Label>
          <Input
            value={state.blockData}
            onChange={(e) => setState((s) => ({ ...s, blockData: e.target.value }))}
            disabled={state.isMining}
            className="font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Difficulty (number of leading zeros required)</Label>
            <span className="text-xs font-mono text-amber-300">{state.difficulty}</span>
          </div>
          <Slider
            value={[state.difficulty]}
            onValueChange={(v) => setState((s) => ({ ...s, difficulty: v[0] }))}
            min={1}
            max={5}
            step={1}
            disabled={state.isMining}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Easy (1 zero)</span>
            <span>Hard (5 zeros)</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Mining Speed (attempts per tick)</Label>
            <span className="text-xs font-mono text-cyan-300">{speed}</span>
          </div>
          <Slider
            value={[speed]}
            onValueChange={(v) => setSpeed(v[0])}
            min={1}
            max={200}
            step={1}
            disabled={state.isMining}
          />
        </div>
      </div>

      {/* Current hash display */}
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 mb-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Current Hash (nonce = {state.nonce})</div>
        <div className={`font-mono text-xs break-all ${state.found ? 'text-emerald-300' : 'text-muted-foreground'}`}>
          {state.hash || '— not started —'}
        </div>
        {state.found && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Hash starts with {state.difficulty} zeros — block mined!
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-md border border-border/40 bg-muted/20 p-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Attempts</div>
          <div className="text-lg font-bold tabular-nums text-cyan-300">{state.attempts.toLocaleString()}</div>
        </div>
        <div className="rounded-md border border-border/40 bg-muted/20 p-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Nonce</div>
          <div className="text-lg font-bold tabular-nums text-violet-300">{state.nonce.toLocaleString()}</div>
        </div>
        <div className="rounded-md border border-border/40 bg-muted/20 p-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
          <div className={`text-sm font-bold ${state.found ? 'text-emerald-300' : state.isMining ? 'text-amber-300 animate-pulse' : 'text-muted-foreground'}`}>
            {state.found ? 'MINED' : state.isMining ? 'MINING…' : 'IDLE'}
          </div>
        </div>
      </div>

      {/* Hash history (recent attempts) */}
      {state.hashHistory.length > 0 && (
        <div className="rounded-lg border border-border/40 bg-muted/20 p-2 mb-3 max-h-32 overflow-y-auto scrollbar-thin">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Recent Attempts</div>
          <div className="space-y-0.5">
            <AnimatePresence>
              {state.hashHistory.slice(-8).reverse().map((h, i) => (
                <motion.div
                  key={`${h.nonce}-${i}`}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-[10px] font-mono"
                >
                  <span className="text-muted-foreground w-12 shrink-0">#{h.nonce}</span>
                  <span className="truncate text-muted-foreground/70">{h.hash.slice(0, 40)}…</span>
                  {h.hash.startsWith('0'.repeat(state.difficulty)) ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                  ) : null}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!state.isMining ? (
          <Button onClick={startMining} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black">
            <Pickaxe className="h-4 w-4 mr-2" />
            {state.found ? 'Mine Again' : 'Start Mining'}
          </Button>
        ) : (
          <Button onClick={stopMining} variant="destructive" className="flex-1">
            <Pause className="h-4 w-4 mr-2" /> Stop Mining
          </Button>
        )}
        <Button onClick={reset} variant="outline" disabled={state.isMining}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Explanation */}
      <div className="mt-4 rounded-md bg-muted/30 border border-border/40 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
        <Sparkles className="h-3 w-3 inline mr-1 text-amber-300" />
        <strong className="text-foreground">How it works:</strong> Each PharmaTrace block is mined by finding a
        nonce so that <code className="font-mono text-cyan-300">SHA-256(blockData + nonce)</code> starts with N zeros.
        Higher difficulty = exponentially more attempts needed. This is the same proof-of-work used by Bitcoin and
        our local educational blockchain (difficulty 2).
      </div>
    </GlassCard>
  )
}
