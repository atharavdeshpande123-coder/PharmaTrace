'use client'
import { cn } from '@/lib/utils'
import { Inbox, AlertTriangle, Loader2 } from 'lucide-react'

export function EmptyState({
  title, description, icon, action, className,
}: {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6 animate-fade-in', className)}>
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/20 p-5 ring-1 ring-border/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative">{icon ?? <Inbox className="h-7 w-7 text-muted-foreground" />}</div>
      </div>
      <h3 className="text-base font-medium">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-muted-foreground max-w-sm text-balance">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description, onRetry, className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      <div className="mb-3 rounded-full bg-rose-500/10 p-4 ring-1 ring-rose-500/30">
        <AlertTriangle className="h-6 w-6 text-rose-300" />
      </div>
      <h3 className="text-base font-medium">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Try again
        </button>
      )}
    </div>
  )
}

export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  )
}

export function SkeletonCard() {
  return <div className="glass rounded-xl p-5 h-28 skeleton-shimmer" />
}

export function PageHeader({
  title, subtitle, actions, icon,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="rounded-xl bg-primary/15 p-2.5 ring-1 ring-primary/30 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
