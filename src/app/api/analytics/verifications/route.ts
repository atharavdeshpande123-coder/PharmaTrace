import { db } from '@/lib/db'
import { ok, withHandler } from '@/lib/api'

// GET /api/analytics/verifications — timeseries + breakdown by result/method
export const GET = withHandler(async () => {
  const records = await db.verificationRecord.findMany({
    orderBy: { timestamp: 'asc' },
    select: { timestamp: true, result: true, verificationMethod: true },
  })
  // group by day
  const byDay = new Map<string, { date: string; AUTHENTIC: number; NOT_FOUND: number; FLAGGED: number; EXPIRED: number }>()
  for (const r of records) {
    const date = r.timestamp.toISOString().slice(0, 10)
    if (!byDay.has(date)) {
      byDay.set(date, { date, AUTHENTIC: 0, NOT_FOUND: 0, FLAGGED: 0, EXPIRED: 0 })
    }
    const entry = byDay.get(date)!
    if (r.result in entry) (entry as Record<string, unknown>)[r.result] = ((entry as Record<string, unknown>)[r.result] as number) + 1
  }
  const byMethod = await db.verificationRecord.groupBy({
    by: ['verificationMethod'],
    _count: true,
  })
  const byResult = await db.verificationRecord.groupBy({
    by: ['result'],
    _count: true,
  })
  return ok({
    timeseries: Array.from(byDay.values()),
    byMethod,
    byResult,
    total: records.length,
  })
})
