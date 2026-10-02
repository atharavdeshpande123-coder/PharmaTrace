/**
 * PharmaTrace Local Blockchain Simulation
 * ========================================
 *
 * Educational SHA-256 hash-linked blockchain that persists to the database.
 * This is the "LocalBlockchainAdapter" — a drop-in replacement for a real
 * Hyperledger Fabric network so the project runs out-of-the-box on a
 * student laptop.
 *
 * Architecture:
 *   Frontend  ->  REST API  ->  BlockchainService  ->  LocalBlockchainAdapter
 *                                            \->  FabricBlockchainAdapter (future)
 *
 * Each block contains:
 *   - index (blockNumber)
 *   - timestamp
 *   - transactions[] (metadata + payload hash)
 *   - previousHash
 *   - nonce (proof field)
 *   - hash  = SHA256(index + timestamp + transactions + previousHash + nonce)
 *
 * Every new block references the previous block's hash, producing a
 * tamper-evident chain. `verifyChain()` recomputes every hash and
 * compares against the stored values.
 */

import crypto from 'crypto'

export interface ChainTransaction {
  transactionHash: string
  type: string
  drugId?: string | null
  fromId?: string | null
  toId?: string | null
  userId?: string | null
  data: Record<string, unknown>
  timestamp: Date
}

export interface BlockData {
  blockNumber: number
  timestamp: Date
  transactions: ChainTransaction[]
  previousHash: string
  nonce: number
  hash: string
  merkleRoot?: string | null
}

/**
 * Compute a SHA-256 hex digest for the given string.
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex')
}

/**
 * Compute the merkle root of a list of transactions. For an empty list we
 * return the SHA-256 of an empty string. This provides a compact summary
 * of all transactions inside a block.
 */
export function computeMerkleRoot(txs: ChainTransaction[]): string {
  if (txs.length === 0) return sha256('')
  let leaves = txs.map((t) => sha256(JSON.stringify(t)))
  while (leaves.length > 1) {
    const next: string[] = []
    for (let i = 0; i < leaves.length; i += 2) {
      const left = leaves[i]
      const right = leaves[i + 1] ?? leaves[i]
      next.push(sha256(left + right))
    }
    leaves = next
  }
  return leaves[0]
}

/**
 * Calculate the hash for a block given its constituent parts.
 */
export function calculateBlockHash(
  index: number,
  timestamp: Date,
  transactions: ChainTransaction[],
  previousHash: string,
  nonce: number,
): string {
  const merkleRoot = computeMerkleRoot(transactions)
  return sha256(
    `${index}|${timestamp.toISOString()}|${merkleRoot}|${previousHash}|${nonce}`,
  )
}

/**
 * Simple proof-of-work: find a nonce so the hash starts with N zeros.
 * Difficulty is intentionally low so block creation stays fast in demos.
 */
export function mineBlock(
  index: number,
  timestamp: Date,
  transactions: ChainTransaction[],
  previousHash: string,
  difficulty = 2,
): { nonce: number; hash: string } {
  const target = '0'.repeat(difficulty)
  let nonce = 0
  let hash = ''
  do {
    hash = calculateBlockHash(index, timestamp, transactions, previousHash, nonce)
    nonce++
  } while (!hash.startsWith(target))
  return { nonce: nonce - 1, hash }
}
