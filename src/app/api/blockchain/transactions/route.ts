import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, withHandler } from '@/lib/api'

// GET /api/blockchain/transactions — list transactions (paginated, filterable)
export const GET = withHandler(async (req: NextRequest) => {
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || ''
  const search = url.searchParams.get('search') || ''
  const limit = Math.min(Number(url.searchParams.get('limit') || '100'), 200)

  const where: Record<string, unknown> = {}
  if (type) where.type = type
  if (search) {
    where.OR = [
      { transactionHash: { contains: search } },
      { drug: { drugName: { contains: search } } },
      { drug: { batchNumber: { contains: search } } },
      { drug: { drugId: { contains: search } } },
    ]
  }
  const transactions = await db.transaction.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      drug: { select: { id: true, drugId: true, drugName: true, batchNumber: true } },
      block: { select: { blockNumber: true, hash: true } },
    },
  })
  return ok({ transactions })
})
