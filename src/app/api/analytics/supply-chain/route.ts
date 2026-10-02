import { db } from '@/lib/db'
import { ok, withHandler } from '@/lib/api'

// GET /api/analytics/supply-chain — supply chain activity stats
export const GET = withHandler(async () => {
  const events = await db.supplyChainEvent.findMany({
    orderBy: { timestamp: 'asc' },
    select: { timestamp: true, eventType: true },
  })
  const byDay = new Map<string, { date: string; TRANSFERS: number; RECEIPTS: number; REGISTRATIONS: number }>()
  for (const e of events) {
    const date = e.timestamp.toISOString().slice(0, 10)
    if (!byDay.has(date)) byDay.set(date, { date, TRANSFERS: 0, RECEIPTS: 0, REGISTRATIONS: 0 })
    const entry = byDay.get(date)!
    if (e.eventType === 'TRANSFERRED') entry.TRANSFERS++
    if (e.eventType === 'RECEIVED') entry.RECEIPTS++
    if (e.eventType === 'REGISTERED') entry.REGISTRATIONS++
  }
  const byType = await db.supplyChainEvent.groupBy({
    by: ['eventType'],
    _count: true,
  })
  const byStatus = await db.drug.groupBy({
    by: ['status'],
    _count: true,
  })
  return ok({
    timeseries: Array.from(byDay.values()),
    byType,
    byStatus,
    totalEvents: events.length,
  })
})
