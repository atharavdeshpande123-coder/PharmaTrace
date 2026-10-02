import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ensureGenesisBlock } from '@/lib/blockchain/service'
import { fail, ok, withHandler } from '@/lib/api'

// GET /api/blockchain/blocks/:number — single block detail
export const GET = withHandler(async (_req: NextRequest, ctx) => {
  await ensureGenesisBlock()
  const { number } = await ctx!.params
  const blockNumber = Number(number)
  if (!Number.isFinite(blockNumber)) return fail('Invalid block number', 400)
  const block = await db.blockchainBlock.findUnique({
    where: { blockNumber },
    include: { transactions: { orderBy: { timestamp: 'asc' } } },
  })
  if (!block) return fail('Block not found', 404)
  return ok({ block })
})
