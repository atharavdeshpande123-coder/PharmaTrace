'use client'
import { cn } from '@/lib/utils'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

export const GlassCard = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & { glow?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'none' }
>(function GlassCard({ className, glow = 'none', children, ...props }, ref) {
  return (
    <motion.div
      ref={ref}
      className={cn(
        'glass rounded-xl p-5',
        glow === 'cyan' && 'glow-cyan',
        glow === 'violet' && 'glow-violet',
        glow === 'emerald' && 'glow-emerald',
        glow === 'amber' && 'glow-amber',
        glow === 'rose' && 'glow-rose',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
})
