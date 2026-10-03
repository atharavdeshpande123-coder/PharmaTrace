/**
 * OpenFDAProvider — real U.S. drug information from openFDA API.
 *
 * Uses the official openFDA API (https://api.fda.gov) to retrieve
 * actual pharmaceutical data from the FDA.
 *
 * No API key required for basic usage (240 requests/min with key,
 * 40 requests/min without).
 *
 * All data returned is REAL FDA data — no mock/demo/placeholder.
 */

import type {
  PharmaceuticalDataProvider,
  PharmaceuticalRecord,
  SearchResult,
  SourceInfo,
} from './provider'

const OPENFDA_BASE = 'https://api.fda.gov'

interface OpenFDAResult {
  id: string
  openfda?: {
    brand_name?: string[]
    generic_name?: string[]
    manufacturer_name?: string[]
    product_type?: string[]
    route?: string[]
    substance_name?: string[]
    product_ndc?: string[]
    package_ndc?: string[]
  }
  purpose?: string[]
  active_ingredient?: string[]
  inactive_ingredient?: string[]
  warnings?: string[]
  dosage_and_administration?: string[]
  do_not_use?: string[]
  effective_time?: string
  active_ingredient?: string[]
}

interface OpenFDAResponse {
  meta?: { results?: { total?: number; skip?: number; limit?: number } }
  results?: OpenFDAResult[]
  error?: { message?: string; code?: string }
}

function buildSourceInfo(result: OpenFDAResult): SourceInfo {
  const ndc = result.openfda?.product_ndc?.[0] || result.openfda?.package_ndc?.[0] || result.id || 'unknown'
  return {
    dataSource: 'openFDA',
    sourceName: 'U.S. FDA / openFDA',
    sourceUrl: `https://open.fda.gov/data/downloads/`,
    retrievedAt: new Date().toISOString(),
    sourceIdentifier: ndc,
    country: 'United States',
  }
}

function normalizeResult(result: OpenFDAResult): PharmaceuticalRecord {
  const ofd = result.openfda || {}
  const source = buildSourceInfo(result)

  return {
    drugName: ofd.brand_name?.[0] || ofd.generic_name?.[0] || 'Unknown Product',
    genericName: ofd.generic_name?.[0] || null,
    brandName: ofd.brand_name?.[0] || null,
    dosageForm: null,
    strength: result.active_ingredient?.[0]?.split(';')[0]?.trim() || null,
    route: ofd.route?.[0] || null,
    activeIngredients: result.active_ingredient?.[0] || ofd.substance_name?.[0] || null,
    purpose: result.purpose?.[0] || null,
    warnings: result.warnings?.[0] || null,
    manufacturerName: ofd.manufacturer_name?.[0] || null,
    manufacturerId: ofd.product_ndc?.[0] || null,
    manufacturerAddress: null,
    ndc: ofd.product_ndc?.[0] || null,
    productType: ofd.product_type?.[0] || null,
    approvalStatus: null,
    marketingStatus: null,
    recallInfo: null,
    source,
  }
}

export class OpenFDAProvider implements PharmaceuticalDataProvider {
  private apiKey: string | null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null
  }

  private get authParam(): string {
    return this.apiKey ? `&api_key=${this.apiKey}` : ''
  }

  async searchDrug(query: string): Promise<SearchResult> {
    const limit = 20
    // Search by brand_name OR generic_name OR manufacturer_name
    const searchQuery = `openfda.brand_name:"${query}"+OR+openfda.generic_name:"${query}"+OR+openfda.manufacturer_name:"${query}"`
    const url = `${OPENFDA_BASE}/drug/label.json?search=${searchQuery}&limit=${limit}${this.authParam}`

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      if (res.status === 404) {
        return { results: [], total: 0, source: 'openFDA', query, retrievedAt: new Date().toISOString() }
      }
      throw new Error(`openFDA API error: ${res.status} ${res.statusText}`)
    }

    const data: OpenFDAResponse = await res.json()
    const results = (data.results || []).map(normalizeResult)

    return {
      results,
      total: data.meta?.results?.total ?? results.length,
      source: 'openFDA',
      query,
      retrievedAt: new Date().toISOString(),
    }
  }

  async getDrug(identifier: string): Promise<PharmaceuticalRecord | null> {
    // Search by NDC or ID
    const searchQuery = `openfda.product_ndc:"${identifier}"+id:"${identifier}"`
    const url = `${OPENFDA_BASE}/drug/label.json?search=${encodeURIComponent(searchQuery)}&limit=1${this.authParam}`

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return null

    const data: OpenFDAResponse = await res.json()
    if (!data.results || data.results.length === 0) return null

    return normalizeResult(data.results[0])
  }

  async getRecallInformation(identifier: string): Promise<PharmaceuticalRecord['recallInfo'] | null> {
    // Query the drug enforcement (recall) endpoint
    const searchQuery = `openfda.product_ndc:"${identifier}"`
    const url = `${OPENFDA_BASE}/drug/enforcement.json?search=${encodeURIComponent(searchQuery)}&limit=5${this.authParam}`

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return null

    const data = await res.json() as OpenFDAResponse
    if (!data.results || data.results.length === 0) {
      return { hasRecall: false, reason: null, recallDate: null, recallUrl: null }
    }

    const recall = data.results[0]
    return {
      hasRecall: true,
      reason: recall.warnings?.[0] || 'Recall information available — see source for details.',
      recallDate: recall.effective_time || null,
      recallUrl: 'https://open.fda.gov/data/downloads/',
    }
  }
}
