import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { verifyDrug } from '@/lib/blockchain/contracts'
import { ok, fail, withHandler } from '@/lib/api'

// GET /api/verify/:drugId — public verification (no login required)
export const GET = withHandler(async (_req: NextRequest, ctx) => {
  const { drugId } = await ctx!.params
  const user = await getCurrentUser()
  const result = await verifyDrug({
    query: decodeURIComponent(drugId),
    method: 'PUBLIC_LINK',
    verifierId: user?.id ?? null,
  })
  return ok(result)
})

// POST /api/verify — verification by QR token / batch / drug id
// Body: { query: string, method: 'QR_SCAN' | 'MANUAL_ENTRY' | 'IMAGE_UPLOAD' }
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
