import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/server'
import { fail, ok, withHandler } from '@/lib/api'
import { flagDrug } from '@/lib/blockchain/contracts'

/**
 * POST /api/admin/bulk-flag
 *
 * Admin-only endpoint that flags multiple drug batches at once.
 * Useful for flagging all expired drugs, or all drugs matching a criteria.
 *
 * Body: { drugIds: string[], reason: string }
 *   - drugIds: array of drug internal IDs
 *   - reason: explanation for the flag (recorded on-chain)
 *
 * Returns: { flagged: number[], failed: { id: string, error: string }[] }
 */
export const POST = withHandler(async (req: NextRequest) => {
  const admin = await requireRole('ADMIN')
  const body = await req.json().catch(() => ({})) as {
    drugIds?: string[]; reason?: string
  }
  if (!body.drugIds || !Array.isArray(body.drugIds) || body.drugIds.length === 0) {
    return fail('drugIds array is required')
  }
  if (!body.reason || body.reason.trim().length < 3) {
    return fail('A reason (min 3 chars) is required')
  }
  if (body.drugIds.length > 50) {
    return fail('Cannot flag more than 50 drugs at once')
  }

  const flagged: string[] = []
  const failed: { id: string; error: string }[] = []

  for (const drugId of body.drugIds) {
    try {
      const drug = await db.drug.findFirst({
        where: { OR: [{ id: drugId }, { drugId }, { batchNumber: drugId }] },
        select: { id: true },
      })
      if (!drug) {
        failed.push({ id: drugId, error: 'Drug not found' })
        continue
      }
      await flagDrug({ drugId: drug.id, userId: admin.id, reason: body.reason })
      flagged.push(drugId)
    } catch (e) {
      failed.push({ id: drugId, error: (e as Error).message })
    }
  }

  return ok({
    flagged,
    failed,
    totalFlagged: flagged.length,
    totalFailed: failed.length,
    message: `Flagged ${flagged.length} drug(s), ${failed.length} failed.`,
  })
})
