/**
 * PharmaTrace brand mark — a pharmaceutical capsule crossed with
 * blockchain nodes and a shield check, drawn entirely in SVG.
 */
import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('h-9 w-9', className)} aria-hidden>
      <defs>
        <linearGradient id="pt-capsule" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="pt-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      {/* shield outline */}
      <path
        d="M32 4 L54 12 V30 C54 46 44 56 32 60 C20 56 10 46 10 30 V12 Z"
        fill="none"
        stroke="url(#pt-shield)"
        strokeWidth="2.5"
        opacity="0.85"
      />
      {/* capsule */}
      <g transform="rotate(-35 32 32)">
        <rect x="20" y="26" width="24" height="12" rx="6" fill="url(#pt-capsule)" opacity="0.95" />
        <rect x="32" y="26" width="12" height="12" rx="6" fill="#0a0a0f" opacity="0.35" />
      </g>
      {/* check mark */}
      <path d="M24 33 l5 5 l11 -12" stroke="#34d399" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* blockchain nodes */}
      <circle cx="14" cy="46" r="2.2" fill="#22d3ee" />
      <circle cx="32" cy="54" r="2.2" fill="#a78bfa" />
      <circle cx="50" cy="46" r="2.2" fill="#22d3ee" />
      <line x1="14" y1="46" x2="32" y2="54" stroke="#22d3ee" strokeWidth="1.2" opacity="0.6" />
      <line x1="32" y1="54" x2="50" y2="46" stroke="#a78bfa" strokeWidth="1.2" opacity="0.6" />
    </svg>
  )
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <BrandMark />
      <div className="leading-none">
        <div className="font-semibold text-lg tracking-tight">
          Pharma<span className="gradient-text">Trace</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Blockchain Pharma
        </div>
      </div>
    </div>
  )
}
