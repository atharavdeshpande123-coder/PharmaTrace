import { NextRequest } from 'next/server'
import QRCode from 'qrcode'
import { getCurrentUser, requireRole } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { fail, ok, withHandler } from '@/lib/api'
import crypto from 'crypto'

// GET /api/drugs/:id/qr — generate a QR code PNG data URL for the drug.
//
// The QR encodes a PUBLIC HTTPS verification URL:
//   ${PUBLIC_APP_URL}/verify/${qrToken}
//
// When scanned by ANY device (phone camera, QR scanner app, etc.),
// the browser opens the public verification page which displays
// the COMPLETE medicine/tablet data:
//   - Drug name, generic name, brand name
//   - Batch number, serial number
//   - Manufacturer name, location
//   - Manufacturing date, expiry date
//   - Quantity, dosage form, strength
//   - Storage requirements
//   - Blockchain transaction info
//   - Supply chain history
//   - Source provenance (openFDA, CDSCO, etc.)
export const GET = withHandler(async (_req: NextRequest, ctx) => {
  const { id } = await ctx!.params
  const drug = await db.drug.findFirst({
    where: { OR: [{ id }, { drugId: id }, { qrToken: id }, { batchNumber: id }] },
    select: {
      drugId: true, qrToken: true, drugName: true, batchNumber: true,
      genericName: true, brandName: true, serialNumber: true,
      manufacturerName: true, manufacturingDate: true, expiryDate: true,
      quantity: true, drugCategory: true, dosageForm: true,
      storageRequirement: true, manufacturingLocation: true,
      status: true, currentLocation: true,
      ndc: true, dataSource: true, sourceIdentifier: true,
      manufacturer: { select: { name: true, organization: true, location: true } },
      currentOwner: { select: { name: true, organization: true, location: true, role: true } },
    },
  })
  if (!drug) return fail('Drug not found', 404)

  // Build the public verification URL
  const publicAppUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000'
  const verificationUrl = `${publicAppUrl}/verify/${drug.qrToken}`

  const user = await getCurrentUser()

  const dataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 512,
    color: { dark: '#0a0a0f', light: '#ffffff' },
  })

  // Build the complete medicine data that the QR will display when scanned
  const medicineData = {
    drugName: drug.drugName,
    genericName: drug.genericName,
    brandName: drug.brandName,
    batchNumber: drug.batchNumber,
    serialNumber: drug.serialNumber,
    drugId: drug.drugId,
    verificationId: drug.qrToken,
    manufacturer: drug.manufacturerName,
    manufacturerOrg: drug.manufacturer?.organization ?? drug.manufacturerName,
    manufacturerLocation: drug.manufacturer?.location ?? drug.manufacturingLocation ?? '—',
    manufacturingDate: drug.manufacturingDate,
    expiryDate: drug.expiryDate,
    quantity: drug.quantity,
    drugCategory: drug.drugCategory,
    dosageForm: drug.dosageForm,
    strength: drug.drugCategory,
    storageRequirement: drug.storageRequirement,
    status: drug.status,
    currentLocation: drug.currentLocation,
    currentOwner: drug.currentOwner?.organization ?? drug.currentOwner?.name ?? '—',
    ndc: drug.ndc,
    dataSource: drug.dataSource ?? 'PHARMATRACE',
    sourceIdentifier: drug.sourceIdentifier,
    publicUrl: verificationUrl,
  }

  return ok({
    qrToken: drug.qrToken,
    drugId: drug.drugId,
    drugName: drug.drugName,
    batchNumber: drug.batchNumber,
    verificationUrl,
    dataUrl,
    isAdmin: !!user && user.role === 'ADMIN',
    medicineData,
  })
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
