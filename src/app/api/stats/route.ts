import { db } from '@/lib/db'
import { ensureGenesisBlock, getLatestBlock, verifyChainIntegrity } from '@/lib/blockchain/service'
import { ok, withHandler } from '@/lib/api'

// GET /api/stats — public landing-page statistics (no login required)
export const GET = withHandler(async () => {
  await ensureGenesisBlock()
  const [
    registeredDrugs,
    verifiedBatches,
    supplyChainEvents,
    blockchainTransactions,
    latest,
    integrity,
  ] = await Promise.all([
    db.drug.count(),
    db.verificationRecord.count({ where: { result: 'AUTHENTIC' } }),
    db.supplyChainEvent.count(),
    db.transaction.count(),
    getLatestBlock(),
    verifyChainIntegrity(),
  ])
  return ok({
    registeredDrugs,
    verifiedBatches,
    supplyChainEvents,
    blockchainTransactions,
    lastBlock: latest?.blockNumber ?? 0,
    chainIntegrity: integrity.valid ? 'VERIFIED' : 'COMPROMISED',
    networkStatus: 'ONLINE',
  })
})
