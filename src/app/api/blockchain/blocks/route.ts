import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ensureGenesisBlock, getLatestBlock } from '@/lib/blockchain/service'
import { ok, withHandler } from '@/lib/api'

// GET /api/blockchain/blocks — list blocks (paginated)
export const GET = withHandler(async (req: NextRequest) => {
  await ensureGenesisBlock()
  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 200)
  const blocks = await db.blockchainBlock.findMany({
    orderBy: { blockNumber: 'desc' },
    take: limit,
    include: { transactions: { orderBy: { timestamp: 'asc' } } },
  })
  const latest = await getLatestBlock()
  return ok({ blocks, latest, count: blocks.length })
})
