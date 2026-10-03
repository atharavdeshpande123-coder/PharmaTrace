/**
 * QR token + public drug-id generation utilities.
 *
 * The QR code contains a signed verification token that resolves to a
 * single drug batch. We never store sensitive medical data in the QR —
 * only an opaque identifier that the backend can validate.
 */

import crypto from 'crypto'
import { db } from '@/lib/db'

const QR_SECRET = process.env.JWT_SECRET || 'pharmatrace_dev_secret'

/**
 * Generate a new public drug ID, e.g. PHARMA-7F3K-9X2A-Q1B4
 */
export function generateDrugId(): string {
  const segments = Array.from({ length: 4 }, () =>
    crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 4),
  )
  return `PHARMA-${segments.join('-')}`
}

/**
 * Generate a signed QR token. The token is the drugId + an HMAC so we can
 * detect tampering when a customer scans a printed QR code.
 *
 * IMPORTANT: Uses "-" as separator instead of ":" because colons in URLs
 * can break some QR scanners and mobile browsers.
 */
export function generateQrToken(drugId: string): string {
  const sig = crypto
    .createHmac('sha256', QR_SECRET)
    .update(drugId)
    .digest('hex')
    .slice(0, 16)
  return `${drugId}-${sig}`
}

/**
 * Verify a QR token and return the drugId it represents.
 * Handles both old format (colon) and new format (dash) for backward compat.
 */
export function verifyQrToken(token: string): string | null {
  // Try new format (dash separator): PHARMA-XXXX-XXXX-XXXX-XXXX-signature
  // The drugId is "PHARMA-XXXX-XXXX-XXXX", so the signature is the last segment
  const parts = token.split('-')
  if (parts.length >= 6) {
    // drugId = first 5 parts joined with dash, sig = last part
    const drugId = parts.slice(0, 5).join('-')
    const sig = parts.slice(5).join('-')
    const expected = crypto
      .createHmac('sha256', QR_SECRET)
      .update(drugId)
      .digest('hex')
      .slice(0, 16)
    if (sig === expected) return drugId
  }

  // Try old format (colon separator) for backward compatibility
  const idx = token.lastIndexOf(':')
  if (idx >= 0) {
    const drugId = token.slice(0, idx)
    const sig = token.slice(idx + 1)
    const expected = crypto
      .createHmac('sha256', QR_SECRET)
      .update(drugId)
      .digest('hex')
      .slice(0, 16)
    if (sig === expected) return drugId
  }

  return null
}

/**
 * Ensure a generated drugId / batchNumber / serialNumber / qrToken is unique.
 * Retries a few times before giving up.
 */
export async function generateUniqueDrugIdentifiers() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const drugId = generateDrugId()
    const qrToken = generateQrToken(drugId)
    const batchNumber = `BAT-${drugId.slice(-8).replace(/-/g, '')}`
    const serialNumber = `SN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    const exists = await db.drug.findFirst({
      where: {
        OR: [
          { drugId },
          { batchNumber },
          { serialNumber },
          { qrToken },
        ],
      },
      select: { id: true },
    })
    if (!exists) return { drugId, qrToken, batchNumber, serialNumber }
  }
  throw new Error('Could not generate unique identifiers after 8 attempts')
}
