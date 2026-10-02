'use client'
import { useState, useEffect } from 'react'
import { GlassCard } from './GlassCard'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { Gauge, Zap, Clock, TrendingDown, TrendingUp, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Difficulty Adjustment Simulator — shows how changing the proof-of-work
 * difficulty affects block time and hash rate.
 *
 * The user adjusts a "target block time" slider, and the simulator
 * calculates what difficulty would be needed to achieve that time on
 * average, based on the current hash rate.
 */

interface SimPoint {
  difficulty: number
  expectedBlockTime: number
  hashesPerBlock: number
  hashRate: number
}

export function DifficultySimulatorWidget() {
  const [hashRate, setHashRate] = useState(100) // hashes per second
  const [targetDifficulty, setTargetDifficulty] = useState(2)

  // Expected hashes to find a valid hash = 16^difficulty
  // Expected block time = 16^difficulty / hashRate
  const expectedHashes = Math.pow(16, targetDifficulty)
  const expectedBlockTime = expectedHashes / hashRate
  const effectiveHashRate = hashRate

  // Generate data points for the chart (difficulty 1-5)
  const chartData: SimPoint[] = []
  for (let d = 1; d <= 5; d++) {
    const hashes = Math.pow(16, d)
    const time = hashes / hashRate
    chartData.push({
      difficulty: d,
      expectedBlockTime: time,
      hashesPerBlock: hashes,
      hashRate,
    })
  }

  // Format block time nicely
  const fmtTime = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}ms`
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  // Format hash count
  const fmtHashes = (n: number) => {
    if (n < 1000) return n.toFixed(0)
    if (n < 1000000) return `${(n / 1000).toFixed(1)}k`
    return `${(n / 1000000).toFixed(2)}M`
  }

  const fmtHashRate = (n: number) => {
    if (n < 1000) return `${n.toFixed(0)} H/s`
    if (n < 1000000) return `${(n / 1000).toFixed(1)} kH/s`
    return `${(n / 1000000).toFixed(2)} MH/s`
  }

  return (
    <GlassCard glow="amber">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Gauge className="h-4 w-4 text-amber-300" />
          Difficulty Adjustment Simulator
        </h3>
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Educational
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        See how the proof-of-work difficulty affects block mining time. Higher difficulty = exponentially more
        hashes needed = longer block time. This is how blockchain networks self-regulate to maintain a
        consistent block rate.
      </p>

      {/* Controls */}
      <div className="space-y-4 mb-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-cyan-300" />
              Network Hash Rate
            </label>
            <span className="text-xs font-mono text-cyan-300">{fmtHashRate(hashRate)}</span>
          </div>
          <Slider value={[hashRate]} onValueChange={(v) => setHashRate(v[0])} min={10} max={10000} step={10} />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>10 H/s</span>
            <span>10,000 H/s</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-violet-300" />
              Difficulty (leading zeros in hex)
            </label>
            <span className="text-xs font-mono text-violet-300">{targetDifficulty}</span>
          </div>
          <Slider value={[targetDifficulty]} onValueChange={(v) => setTargetDifficulty(v[0])} min={1} max={5} step={1} />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>1 (easy)</span>
            <span>5 (hard)</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-center">
          <Clock className="h-4 w-4 text-amber-300 mx-auto mb-1" />
          <div className="text-lg font-bold tabular-nums text-amber-300">{fmtTime(expectedBlockTime)}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Block Time</div>
        </div>
        <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-center">
          <Zap className="h-4 w-4 text-cyan-300 mx-auto mb-1" />
          <div className="text-lg font-bold tabular-nums text-cyan-300">{fmtHashes(expectedHashes)}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Hashes/Block</div>
        </div>
        <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-center">
          <Gauge className="h-4 w-4 text-violet-300 mx-auto mb-1" />
          <div className="text-lg font-bold tabular-nums text-violet-300">{fmtHashRate(effectiveHashRate)}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Hash Rate</div>
        </div>
      </div>

      {/* Chart: block time vs difficulty */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="difficulty" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => fmtTime(v)} />
            <Tooltip
              contentStyle={{ background: '#0a0a0f', border: '1px solid #ffffff20', borderRadius: 8 }}
              formatter={(v: number) => [fmtTime(v), 'Block Time']}
              labelFormatter={(l) => `Difficulty ${l}`}
            />
            <Line
              type="monotone"
              dataKey="expectedBlockTime"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={{ fill: '#fbbf24', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Current marker */}
      <motion.div
        key={`${targetDifficulty}-${hashRate}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-200"
      >
        At difficulty <strong>{targetDifficulty}</strong> with <strong>{fmtHashRate(hashRate)}</strong>,
        a new block is mined every <strong>{fmtTime(expectedBlockTime)}</strong> on average,
        requiring <strong>{fmtHashes(expectedHashes)}</strong> hash computations per block.
      </motion.div>
    </GlassCard>
  )
}
