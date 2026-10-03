/**
 * PharmaceuticalDataProvider — abstraction layer for real drug data.
 *
 * Implementations:
 *   - OpenFDAProvider     → U.S. FDA / openFDA API
 *   - CDSCOProvider       → India CDSCO/SUGAM (stub — no public API yet)
 *   - AuthorizedProvider  → any authorized external pharma API
 *
 * The app uses these providers to retrieve REAL pharmaceutical data.
 * It NEVER generates fake/demo/placeholder drug information.
 *
 * If no provider is configured or the API fails, the system shows
 * "Live source unavailable" — NOT fake fallback data.
 */

export type DataSource = 'openFDA' | 'CDSCO/SUGAM' | 'AUTHORIZED' | 'PHARMATRACE'

export interface SourceInfo {
  dataSource: DataSource
  sourceName: string
  sourceUrl: string
  retrievedAt: string // ISO timestamp
  sourceIdentifier: string // NDC, FDA ID, CDSCO license, etc.
  country?: string
}

export interface PharmaceuticalRecord {
  // Core product info (from authoritative source)
  drugName: string
  genericName: string | null
  brandName: string | null
  dosageForm: string | null
  strength: string | null
  route: string | null
  activeIngredients: string | null
  purpose: string | null
  warnings: string | null

  // Manufacturer info (from source)
  manufacturerName: string | null
  manufacturerId: string | null
  manufacturerAddress: string | null

  // Regulatory info
  ndc: string | null
  productType: string | null
  approvalStatus: string | null
  marketingStatus: string | null

  // Recall info
  recallInfo: {
    hasRecall: boolean
    reason: string | null
    recallDate: string | null
    recallUrl: string | null
  } | null

  // Source provenance
  source: SourceInfo
}

export interface SearchResult {
  results: PharmaceuticalRecord[]
  total: number
  source: DataSource
  query: string
  retrievedAt: string
}

export interface PharmaceuticalDataProvider {
  searchDrug(query: string): Promise<SearchResult>
  getDrug(identifier: string): Promise<PharmaceuticalRecord | null>
  getRecallInformation(identifier: string): Promise<PharmaceuticalRecord['recallInfo'] | null>
}

export { isAddress, getAddress } from 'viem'
