import { format, formatDistanceToNow } from 'date-fns'

export function shortHash(hash: string | null | undefined, head = 10, tail = 6) {
  if (!hash) return '—'
  if (hash.length <= head + tail + 1) return hash
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`
}

export function fmtDate(d: Date | string | null | undefined, withTime = false) {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return format(date, withTime ? 'dd MMM yyyy, HH:mm' : 'dd MMM yyyy')
}

export function fmtRelative(d: Date | string | null | undefined) {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return formatDistanceToNow(date, { addSuffix: true })
}

export function isExpired(d: Date | string | null | undefined) {
  if (!d) return false
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return false
  return date.getTime() < Date.now()
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
