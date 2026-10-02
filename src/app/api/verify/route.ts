import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { verifyDrug } from '@/lib/blockchain/contracts'
import { ok, fail, withHandler } from '@/lib/api'

// POST /api/verify — same handler as the [drugId] route but used when the
// frontend doesn't know the drug id yet (e.g. manual entry form).
export const POST = withHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}))
  const { query, method } = body as { query?: string; method?: string }
  if (!query) return fail('A drug id, batch number or QR token is required')
  const user = await getCurrentUser()
  const result = await verifyDrug({
    query,
    method: method || 'MANUAL_ENTRY',
    verifierId: user?.id ?? null,
  })
  return ok(result)
})
