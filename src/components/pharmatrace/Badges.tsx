import { cn } from '@/lib/utils'

const STATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  REGISTERED: { label: 'Registered', color: 'text-cyan-300', bg: 'bg-cyan-500/15 border-cyan-500/30', dot: 'bg-cyan-400' },
  IN_TRANSIT: { label: 'In Transit', color: 'text-violet-300', bg: 'bg-violet-500/15 border-violet-500/30', dot: 'bg-violet-400' },
  DELIVERED: { label: 'Delivered', color: 'text-sky-300', bg: 'bg-sky-500/15 border-sky-500/30', dot: 'bg-sky-400' },
  VERIFIED: { label: 'Verified', color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30', dot: 'bg-emerald-400' },
  FLAGGED: { label: 'Flagged', color: 'text-rose-300', bg: 'bg-rose-500/15 border-rose-500/30', dot: 'bg-rose-400' },
  EXPIRED: { label: 'Expired', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30', dot: 'bg-amber-400' },
  DISPENSED: { label: 'Dispensed', color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30', dot: 'bg-emerald-400' },
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STATUS[status] ?? STATUS.REGISTERED
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        s.bg, s.color, className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot, status === 'IN_TRANSIT' && 'animate-pulse')} />
      {s.label}
    </span>
  )
}

const VERIF: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  AUTHENTIC: { label: 'AUTHENTIC', color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/40', dot: 'bg-emerald-400' },
  NOT_FOUND: { label: 'NOT VERIFIED', color: 'text-rose-300', bg: 'bg-rose-500/15 border-rose-500/40', dot: 'bg-rose-400' },
  FLAGGED: { label: 'FLAGGED', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/40', dot: 'bg-amber-400' },
  EXPIRED: { label: 'EXPIRED', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/40', dot: 'bg-amber-400' },
}

export function VerificationBadge({ result, className }: { result: string; className?: string }) {
  const v = VERIF[result] ?? VERIF.NOT_FOUND
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
        v.bg, v.color, className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', v.dot)} />
      {v.label}
    </span>
  )
}

const ROLE: Record<string, { label: string; color: string; bg: string }> = {
  MANUFACTURER: { label: 'Manufacturer', color: 'text-cyan-300', bg: 'bg-cyan-500/15 border-cyan-500/30' },
  DISTRIBUTOR: { label: 'Distributor', color: 'text-violet-300', bg: 'bg-violet-500/15 border-violet-500/30' },
  WHOLESALER: { label: 'Wholesaler', color: 'text-sky-300', bg: 'bg-sky-500/15 border-sky-500/30' },
  PHARMACY: { label: 'Pharmacy', color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  ADMIN: { label: 'Admin', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30' },
  CUSTOMER: { label: 'Customer', color: 'text-muted-foreground', bg: 'bg-muted border-border' },
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const r = ROLE[role] ?? ROLE.CUSTOMER
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', r.bg, r.color, className)}>
      {r.label}
    </span>
  )
}

const TX_TYPE: Record<string, { color: string; bg: string; label: string }> = {
  DRUG_REGISTERED: { color: 'text-cyan-300', bg: 'bg-cyan-500/15', label: 'Registered' },
  DRUG_RECEIVED: { color: 'text-sky-300', bg: 'bg-sky-500/15', label: 'Received' },
  DRUG_TRANSFERRED: { color: 'text-violet-300', bg: 'bg-violet-500/15', label: 'Transferred' },
  DRUG_VERIFIED: { color: 'text-emerald-300', bg: 'bg-emerald-500/15', label: 'Verified' },
  DRUG_FLAGGED: { color: 'text-rose-300', bg: 'bg-rose-500/15', label: 'Flagged' },
  DRUG_DISPENSED: { color: 'text-emerald-300', bg: 'bg-emerald-500/15', label: 'Dispensed' },
}

export function TxTypeBadge({ type, className }: { type: string; className?: string }) {
  const t = TX_TYPE[type] ?? TX_TYPE.DRUG_TRANSFERRED
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', t.bg, t.color, className)}>
      {t.label}
    </span>
  )
}
