import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/server'
import { fail, ok, withHandler } from '@/lib/api'

/**
 * POST /api/blockchain/restore
 *
 * ADMIN-ONLY endpoint that restores any tampered block to its original hash.
 * The original hash was stashed in the merkleRoot field as `RESTORE:<hash>`
 * by the tamper endpoint.
 *
 * Body: { blockNumber?: number } — defaults to restoring all tampered blocks.
 */
export const POST = withHandler(async (req) => {
  await requireRole('ADMIN')
  const body = await req.json().catch(() => ({})) as { blockNumber?: number }

  if (body.blockNumber) {
    const block = await db.blockchainBlock.findUnique({ where: { blockNumber: body.blockNumber } })
    if (!block) return fail('Block not found', 404)
    if (!block.merkleRoot?.startsWith('RESTORE:')) {
      return fail('Block is not tampered (no restore token found)', 400)
    }
    const originalHash = block.merkleRoot.slice('RESTORE:'.length)
    await db.blockchainBlock.update({
      where: { blockNumber: body.blockNumber },
      data: { hash: originalHash, merkleRoot: null },
    })
    return ok({ restored: [body.blockNumber], message: `Block #${body.blockNumber} restored.` })
  }

  // Restore all tampered blocks
  const tampered = await db.blockchainBlock.findMany({
    where: { merkleRoot: { startsWith: 'RESTORE:' } },
  })
  if (tampered.length === 0) {
    return ok({ restored: [], message: 'No tampered blocks found.' })
  }
  for (const b of tampered) {
    const originalHash = (b.merkleRoot ?? '').slice('RESTORE:'.length)
    await db.blockchainBlock.update({
      where: { blockNumber: b.blockNumber },
      data: { hash: originalHash, merkleRoot: null },
    })
  }
  return ok({
    restored: tampered.map((b) => b.blockNumber),
    message: `Restored ${tampered.length} tampered block(s).`,
  })
})
