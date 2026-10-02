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
        'glass rounded-xl p-5 relative group/card overflow-hidden',
        glow === 'cyan' && 'glow-cyan',
        glow === 'violet' && 'glow-violet',
        glow === 'emerald' && 'glow-emerald',
        glow === 'amber' && 'glow-amber',
        glow === 'rose' && 'glow-rose',
        className,
      )}
      {...props}
    >
      {/* Animated gradient border on hover */}
      <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" style={{ padding: '1px' }}>
        <span className="absolute inset-0 rounded-xl" style={{
          background: 'linear-gradient(120deg, rgba(34,211,238,0.3), rgba(167,139,250,0.3), rgba(52,211,153,0.3))',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }} />
      </span>
      {children}
    </motion.div>
  )
})
