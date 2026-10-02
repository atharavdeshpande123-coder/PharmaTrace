import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/server'
import { fail, ok, withHandler } from '@/lib/api'

/**
 * POST /api/blockchain/tamper
 *
 * ADMIN-ONLY educational endpoint that intentionally corrupts the hash of
 * the latest non-genesis block. This demonstrates that the chain-integrity
 * check detects tampering (the next block's `previousHash` will no longer
 * match, and the recomputed hash won't match the stored hash).
 *
 * Body: { blockNumber?: number } — defaults to the latest block (not genesis).
 *
 * Returns the tampered block so the UI can show the before/after.
 */
export const POST = withHandler(async (req) => {
  await requireRole('ADMIN')
  const body = await req.json().catch(() => ({})) as { blockNumber?: number }
  let target = body.blockNumber
  if (!target) {
    const latest = await db.blockchainBlock.findFirst({
      where: { blockNumber: { gt: 0 } },
      orderBy: { blockNumber: 'desc' },
    })
    if (!latest) return fail('No tamperable block found', 400)
    target = latest.blockNumber
  }
  if (target === 0) return fail('Cannot tamper the genesis block', 400)

  const block = await db.blockchainBlock.findUnique({ where: { blockNumber: target } })
  if (!block) return fail('Block not found', 404)

  // Save the original hash so we can restore it later, then corrupt it.
  const tamperedHash = 'TAMPERED_' + block.hash.slice(0, 56)
  await db.blockchainBlock.update({
    where: { blockNumber: target },
    data: {
      hash: tamperedHash,
      // store the original hash inside merkleRoot field as a recovery token
      merkleRoot: `RESTORE:${block.hash}`,
    },
  })
  return ok({
    blockNumber: target,
    originalHash: block.hash,
    tamperedHash,
    message: `Block #${target} hash has been corrupted. Run "Verify Chain Integrity" to see the detection.`,
  })
})
