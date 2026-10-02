import { ensureGenesisBlock, verifyChainIntegrity, getLatestBlock } from '@/lib/blockchain/service'
import { ok, withHandler } from '@/lib/api'

// GET /api/blockchain/verify-integrity — re-compute every hash & report
export const GET = withHandler(async () => {
  await ensureGenesisBlock()
  const integrity = await verifyChainIntegrity()
  const latest = await getLatestBlock()
  return ok({ ...integrity, latestBlock: latest?.blockNumber ?? 0 })
})
