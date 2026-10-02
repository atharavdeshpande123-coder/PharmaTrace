/**
 * BlockchainService — the smart-contract / chaincode abstraction layer.
 *
 * This mirrors the responsibilities of Hyperledger Fabric chaincode:
 *   - registerDrug()       -> create a drug asset on the ledger
 *   - transferDrug()       -> change ownership of an asset
 *   - receiveDrug()        -> acknowledge receipt by the new owner
 *   - verifyDrug()         -> read-only asset verification
 *   - flagDrug()           -> mark an asset as suspicious
 *   - getDrugHistory()     -> return the full audit trail for an asset
 *   - createTransaction() -> write a new transaction & seal it in a block
 *   - getTransactionHistory()
 *
 * The service is the ONLY place that is allowed to mutate the blockchain
 * tables. All API routes call into here so business rules stay in one spot.
 *
 * In Hyperledger Fabric terms:
 *   - createTransaction  ~  submitTransaction on the chaincode stub
 *   - BlockchainBlock     ~  a block written by the ordering service
 *   - Transaction.data   ~  the chaincode read/write set
 */

import { db } from '@/lib/db'
import {
  calculateBlockHash,
  computeMerkleRoot,
  mineBlock,
  type ChainTransaction,
} from './crypto'

const GENESIS_PREVIOUS_HASH =
  '0'.repeat(64)

/**
 * Make sure the genesis block exists. Safe to call on every request.
 */
export async function ensureGenesisBlock(): Promise<void> {
  const count = await db.blockchainBlock.count()
  if (count > 0) return
  const timestamp = new Date()
  const transactions: ChainTransaction[] = []
  const { nonce, hash } = mineBlock(
    0,
    timestamp,
    transactions,
    GENESIS_PREVIOUS_HASH,
    1,
  )
  await db.blockchainBlock.create({
    data: {
      blockNumber: 0,
      timestamp,
      previousHash: GENESIS_PREVIOUS_HASH,
      hash,
      nonce,
      merkleRoot: computeMerkleRoot(transactions),
    },
  })
}

/**
 * Return the latest block (highest blockNumber) or null if the chain is empty.
 */
export async function getLatestBlock() {
  return db.blockchainBlock.findFirst({
    orderBy: { blockNumber: 'desc' },
    include: { transactions: true },
  })
}

/**
 * Append a new block containing the supplied transactions to the chain.
 * Returns the freshly created block.
 */
export async function createBlock(txIds: string[]) {
  await ensureGenesisBlock()
  const latest = await getLatestBlock()
  const nextNumber = (latest?.blockNumber ?? -1) + 1
  const transactions = await db.transaction.findMany({
    where: { id: { in: txIds } },
  })
  const chainTxs: ChainTransaction[] = transactions.map((t) => ({
    transactionHash: t.transactionHash,
    type: t.type,
    drugId: t.drugId,
    fromId: t.fromId,
    toId: t.toId,
    userId: t.userId,
    data: t.data ? JSON.parse(t.data) : {},
    timestamp: t.timestamp,
  }))
  const timestamp = new Date()
  const { nonce, hash } = mineBlock(
    nextNumber,
    timestamp,
    chainTxs,
    latest?.hash ?? GENESIS_PREVIOUS_HASH,
    2,
  )
  await db.blockchainBlock.create({
    data: {
      blockNumber: nextNumber,
      timestamp,
      previousHash: latest?.hash ?? GENESIS_PREVIOUS_HASH,
      hash,
      nonce,
      merkleRoot: computeMerkleRoot(chainTxs),
    },
  })
  await db.transaction.updateMany({
    where: { id: { in: txIds } },
    data: { blockNumber: nextNumber },
  })
  return db.blockchainBlock.findUnique({
    where: { blockNumber: nextNumber },
    include: { transactions: true },
  })
}

/**
 * Create a single transaction, seal it into its own block, and return both.
 * This is the main entry point used by every chaincode function below.
 */
export async function createTransaction(input: {
  type: string
  drugId?: string | null
  fromId?: string | null
  toId?: string | null
  userId?: string | null
  data: Record<string, unknown>
  blockImmediately?: boolean
}) {
  await ensureGenesisBlock()
  const timestamp = new Date()
  // transactionHash = SHA256(type + drugId + from + to + timestamp + random)
  const transactionHash = await import('crypto').then((c) =>
    c
      .createHash('sha256')
      .update(
        `${input.type}|${input.drugId ?? ''}|${input.fromId ?? ''}|${
          input.toId ?? ''
        }|${timestamp.toISOString()}|${Math.random()}`,
      )
      .digest('hex'),
  )
  const tx = await db.transaction.create({
    data: {
      transactionHash,
      type: input.type,
      drugId: input.drugId ?? null,
      fromId: input.fromId ?? null,
      toId: input.toId ?? null,
      userId: input.userId ?? null,
      data: JSON.stringify(input.data),
    },
  })
  if (input.blockImmediately !== false) {
    await createBlock([tx.id])
    // Re-fetch so we have the blockNumber populated (createBlock updates it
    // in the DB but the `tx` variable above is stale).
    const updated = await db.transaction.findUnique({ where: { id: tx.id } })
    return updated ?? tx
  }
  return tx
}

/**
 * Verify the integrity of the whole chain by recomputing every block hash.
 */
export async function verifyChainIntegrity(): Promise<{
  valid: boolean
  blockCount: number
  brokenAt: number | null
  reason: string | null
}> {
  const blocks = await db.blockchainBlock.findMany({
    orderBy: { blockNumber: 'asc' },
    include: { transactions: true },
  })
  let previousHash = GENESIS_PREVIOUS_HASH
  for (const block of blocks) {
    const chainTxs: ChainTransaction[] = block.transactions.map((t) => ({
      transactionHash: t.transactionHash,
      type: t.type,
      drugId: t.drugId,
      fromId: t.fromId,
      toId: t.toId,
      userId: t.userId,
      data: t.data ? JSON.parse(t.data) : {},
      timestamp: t.timestamp,
    }))
    const recomputed = calculateBlockHash(
      block.blockNumber,
      block.timestamp,
      chainTxs,
      previousHash,
      block.nonce,
    )
    if (recomputed !== block.hash) {
      return {
        valid: false,
        blockCount: blocks.length,
        brokenAt: block.blockNumber,
        reason: `Hash mismatch at block #${block.blockNumber}`,
      }
    }
    if (block.previousHash !== previousHash) {
      return {
        valid: false,
        blockCount: blocks.length,
        brokenAt: block.blockNumber,
        reason: `Previous-hash link broken at block #${block.blockNumber}`,
      }
    }
    previousHash = block.hash
  }
  return {
    valid: true,
    blockCount: blocks.length,
    brokenAt: null,
    reason: null,
  }
}
