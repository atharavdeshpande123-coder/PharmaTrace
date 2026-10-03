/**
 * Shared API helpers + types used by both frontend and backend.
 */
import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { error: message, ...(extra ?? {}) },
    { status },
  )
}

/**
 * Wrap a route handler so thrown Errors with a `.status` field produce the
 * correct HTTP status, and unexpected errors become a clean 500 without
 * leaking stack traces to the client.
 */
export function withHandler(
  fn: (req: Request, ctx?: { params: Promise<Record<string, string>> }) => Promise<Response>,
) {
  return async (
    req: Request,
    ctx?: { params: Promise<Record<string, string>> },
  ): Promise<Response> => {
    try {
      return await fn(req, ctx)
    } catch (err) {
      const e = err as Error & { status?: number }
      const status = e.status ?? 500
      const message = e.message || 'Internal Server Error'
      if (status >= 500) {
        console.error('[api error]', message, err)
      }
      return fail(status === 500 ? 'Internal Server Error' : message, status)
    }
  }
}

export const DRUG_STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  REGISTERED: { label: 'Registered', color: 'text-cyan-300', bg: 'bg-cyan-500/15 border-cyan-500/30' },
  IN_TRANSIT: { label: 'In Transit', color: 'text-violet-300', bg: 'bg-violet-500/15 border-violet-500/30' },
  DELIVERED: { label: 'Delivered', color: 'text-sky-300', bg: 'bg-sky-500/15 border-sky-500/30' },
  VERIFIED: { label: 'Verified', color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  FLAGGED: { label: 'Flagged', color: 'text-rose-300', bg: 'bg-rose-500/15 border-rose-500/30' },
  EXPIRED: { label: 'Expired', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30' },
  DISPENSED: { label: 'Dispensed', color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30' },
}

export const VERIFICATION_RESULT_META: Record<
  string,
  { label: string; color: string; bg: string; ring: string }
> = {
  AUTHENTIC: { label: 'AUTHENTIC DRUG', color: 'text-emerald-300', bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/40' },
  NOT_FOUND: { label: 'DRUG NOT VERIFIED', color: 'text-rose-300', bg: 'bg-rose-500/15', ring: 'ring-rose-500/40' },
  FLAGGED: { label: 'VERIFICATION FAILED / FLAGGED', color: 'text-amber-300', bg: 'bg-amber-500/15', ring: 'ring-amber-500/40' },
  EXPIRED: { label: 'EXPIRED DRUG', color: 'text-amber-300', bg: 'bg-amber-500/15', ring: 'ring-amber-500/40' },
}
