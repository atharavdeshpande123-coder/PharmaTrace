import { NextRequest } from 'next/server'
import QRCode from 'qrcode'
import { getCurrentUser, requireRole } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { fail, ok, withHandler } from '@/lib/api'

// GET /api/drugs/:id/qr — generate a QR code PNG data URL for the drug.
// Public endpoint: anyone with a drug id can render its QR for verification.
export const GET = withHandler(async (_req: NextRequest, ctx) => {
  const { id } = await ctx!.params
  const drug = await db.drug.findFirst({
    where: { OR: [{ id }, { drugId: id }, { qrToken: id }, { batchNumber: id }] },
    select: { drugId: true, qrToken: true, drugName: true, batchNumber: true },
  })
  if (!drug) return fail('Drug not found', 404)
  const user = await getCurrentUser()
  const payload = drug.qrToken
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 512,
    color: { dark: '#0a0a0f', light: '#ffffff' },
  })
  return ok({ qrToken: drug.qrToken, drugId: drug.drugId, drugName: drug.drugName, batchNumber: drug.batchNumber, dataUrl, isAdmin: !!user && user.role === 'ADMIN' })
})

// POST /api/drugs/:id/flag — admin only
export const POST = withHandler(async (req: NextRequest, ctx) => {
  const { id } = await ctx!.params
  const admin = await requireRole('ADMIN')
  const drug = await db.drug.findFirst({
    where: { OR: [{ id }, { drugId: id }, { qrToken: id }, { batchNumber: id }] },
    select: { id: true },
  })
  if (!drug) return fail('Drug not found', 404)
  const body = await req.json().catch(() => ({}))
  const reason = (body as { reason?: string }).reason || 'Flagged by administrator'
  const { flagDrug } = await import('@/lib/blockchain/contracts')
  const result = await flagDrug({ drugId: drug.id, userId: admin.id, reason })
  return ok(result)
})
