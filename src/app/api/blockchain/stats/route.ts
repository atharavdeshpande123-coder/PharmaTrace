import { db } from '@/lib/db'
import { ensureGenesisBlock, getLatestBlock, verifyChainIntegrity } from '@/lib/blockchain/service'
import { ok, withHandler } from '@/lib/api'

// GET /api/blockchain/stats — high-level blockchain status for dashboard header
export const GET = withHandler(async () => {
  await ensureGenesisBlock()
  const [totalBlocks, totalTransactions, latest, integrity] = await Promise.all([
    db.blockchainBlock.count(),
    db.transaction.count(),
    getLatestBlock(),
    verifyChainIntegrity(),
  ])
  return ok({
    connected: true,
    chainIntegrity: integrity.valid ? 'VERIFIED' : 'COMPROMISED',
    lastBlock: latest?.blockNumber ?? 0,
    lastBlockHash: latest?.hash ?? null,
    lastBlockTime: latest?.timestamp ?? null,
    totalBlocks,
    totalTransactions,
    networkStatus: 'ONLINE',
    verificationStatus: 'ACTIVE',
  })
})
