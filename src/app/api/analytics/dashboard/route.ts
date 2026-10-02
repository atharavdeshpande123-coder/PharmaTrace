import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ensureGenesisBlock, getLatestBlock, verifyChainIntegrity } from '@/lib/blockchain/service'
import { ok, withHandler } from '@/lib/api'

// GET /api/analytics/dashboard — all stats needed for the dashboard
export const GET = withHandler(async (req: NextRequest) => {
  await ensureGenesisBlock()
  const url = new URL(req.url)
  const role = url.searchParams.get('role')

  const where: Record<string, unknown> = {}
  if (role === 'MANUFACTURER') {
    // We don't know the user id here; default to all
  }

  const [
    totalDrugs,
    verifiedDrugs,
    pendingTransfers,
    expiredDrugs,
    flaggedDrugs,
    totalTransactions,
    totalUsers,
    totalManufacturers,
    totalDistributors,
    totalPharmacies,
    totalVerifications,
    latest,
    integrity,
    recentDrugs,
    recentTransactions,
    recentVerifications,
  ] = await Promise.all([
    db.drug.count({ where }),
    db.drug.count({ where: { ...where, status: 'VERIFIED' } }),
    db.drug.count({ where: { ...where, status: 'IN_TRANSIT' } }),
    db.drug.count({ where: { ...where, expiryDate: { lt: new Date() } } }),
    db.drug.count({ where: { ...where, status: 'FLAGGED' } }),
    db.transaction.count(),
    db.user.count(),
    db.user.count({ where: { role: 'MANUFACTURER' } }),
    db.user.count({ where: { role: { in: ['DISTRIBUTOR', 'WHOLESALER'] } } }),
    db.user.count({ where: { role: 'PHARMACY' } }),
    db.verificationRecord.count(),
    getLatestBlock(),
    verifyChainIntegrity(),
    db.drug.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        manufacturer: { select: { name: true, organization: true } },
        currentOwner: { select: { name: true, organization: true } },
      },
    }),
    db.transaction.findMany({
      orderBy: { timestamp: 'desc' },
      take: 8,
      include: {
        drug: { select: { drugId: true, drugName: true, batchNumber: true } },
        block: { select: { blockNumber: true, hash: true } },
      },
    }),
    db.verificationRecord.findMany({
      orderBy: { timestamp: 'desc' },
      take: 8,
      include: {
        drug: { select: { drugId: true, drugName: true, batchNumber: true } },
      },
    }),
  ])

  return ok({
    stats: {
      totalDrugs,
      verifiedDrugs,
      pendingTransfers,
      expiredDrugs,
      flaggedDrugs,
      totalTransactions,
      totalUsers,
      totalManufacturers,
      totalDistributors,
      totalPharmacies,
      totalVerifications,
    },
    blockchain: {
      connected: true,
      chainIntegrity: integrity.valid ? 'VERIFIED' : 'COMPROMISED',
      lastBlock: latest?.blockNumber ?? 0,
      lastBlockHash: latest?.hash ?? null,
      lastBlockTime: latest?.timestamp ?? null,
      networkStatus: 'ONLINE',
      verificationStatus: 'ACTIVE',
    },
    recentDrugs,
    recentTransactions,
    recentVerifications,
  })
})
