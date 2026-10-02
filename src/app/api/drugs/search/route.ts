import { NextRequest } from 'next/server'
import { ok, fail, withHandler } from '@/lib/api'
import { OpenFDAProvider } from '@/lib/pharma/openfda'

/**
 * GET /api/drugs/search?q=paracetamol
 *
 * Searches REAL pharmaceutical data from the configured authoritative source.
 *
 * Currently uses openFDA (U.S. FDA) API.
 * No mock/demo/placeholder data — all results come from the real API.
 *
 * If the API is unavailable, returns an error (NOT fake data).
 */
export const GET = withHandler(async (req: NextRequest) => {
  const url = new URL(req.url)
  const query = url.searchParams.get('q') || url.searchParams.get('query') || ''

  if (!query || query.trim().length < 2) {
    return fail('Search query must be at least 2 characters', 400)
  }

  const apiKey = process.env.OPENFDA_API_KEY || undefined
  const provider = new OpenFDAProvider(apiKey)

  try {
    const result = await provider.searchDrug(query.trim())
    return ok(result)
  } catch (e) {
    const message = (e as Error).message || 'Unknown error'
    return fail(
      `Live source temporarily unavailable: ${message}`,
      502,
      { source: 'openFDA', suggestion: 'RETRY' },
    )
  }
})
