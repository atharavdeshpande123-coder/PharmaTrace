'use client'
import { motion, useInView, useMotionValue, useSpring, type HTMLMotionProps } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps extends HTMLMotionProps<'div'> {
  label: string
  value: number
  icon: React.ReactNode
  accent?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky'
  suffix?: string
  description?: string
}

const ACCENTS: Record<string, { text: string; bg: string; ring: string }> = {
  cyan: { text: 'text-cyan-300', bg: 'bg-cyan-500/15', ring: 'ring-cyan-500/30' },
  violet: { text: 'text-violet-300', bg: 'bg-violet-500/15', ring: 'ring-violet-500/30' },
  emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/30' },
  amber: { text: 'text-amber-300', bg: 'bg-amber-500/15', ring: 'ring-amber-500/30' },
  rose: { text: 'text-rose-300', bg: 'bg-rose-500/15', ring: 'ring-rose-500/30' },
  sky: { text: 'text-sky-300', bg: 'bg-sky-500/15', ring: 'ring-sky-500/30' },
}

export function StatCard({
  label, value, icon, accent = 'cyan', suffix, description, ...props
}: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const a = ACCENTS[accent]
  const display = useAnimatedNumber(inView ? value : 0)
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="glass rounded-xl p-5 hover:-translate-y-0.5 transition-transform"
      {...props}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={cn('text-3xl font-semibold tabular-nums', a.text)}>
              {display.toLocaleString()}
            </span>
            {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
          </div>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn('rounded-lg p-2.5 ring-1', a.bg, a.text, a.ring)}>{icon}</div>
      </div>
    </motion.div>
  )
}

function useAnimatedNumber(target: number, duration = 1100) {
  const [value, setValue] = useState(0)
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { duration, bounce: 0 })
  useEffect(() => {
    mv.set(target)
    const unsub = spring.on('change', (v) => setValue(Math.round(v)))
    return () => unsub()
  }, [target, mv, spring])
  return value
}
