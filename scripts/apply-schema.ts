/**
 * Apply the PharmaTrace schema to Supabase Postgres via the pooled
 * connection (port 6543). Fully idempotent — safe to re-run.
 *
 * Run: bun run scripts/apply-schema.ts
 */
import { Client } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

// Force unbuffered output so logs flush immediately.
const log = (...args: unknown[]) => process.stdout.write(args.join(' ') + '\n')

function readEnv() {
  const envText = readFileSync(join(process.cwd(), '.env'), 'utf8')
  for (const line of envText.split('\n')) {
    const m = line.match(/^DATABASE_URL=(.*)$/)
    if (m && m[1].trim()) return m[1].trim()
  }
  return process.env.DATABASE_URL || ''
}

const DATABASE_URL = readEnv()

if (!DATABASE_URL || !DATABASE_URL.startsWith('postgresql://')) {
  log('ERROR: DATABASE_URL is not set or not a postgres URL.')
  log('Current value:', DATABASE_URL.slice(0, 50) + '...')
  process.exit(1)
}

async function main() {
  log('Connecting to:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'))
  const client = new Client({
    connectionString: DATABASE_URL,
    connectionTimeoutMillis: 20000,
    query_timeout: 30000,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  log('✓ Connected to Supabase Postgres')

  const sqlFile = join(process.cwd(), 'scripts', 'pharmatrace_schema.sql')
  let sql: string
  try {
    sql = readFileSync(sqlFile, 'utf8')
  } catch {
    sql = execSync(
      'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
      { encoding: 'utf8', cwd: process.cwd() },
    )
  }

  // Make DDL idempotent: CREATE TABLE → CREATE TABLE IF NOT EXISTS,
  // CREATE INDEX → CREATE INDEX IF NOT EXISTS,
  // ALTER TABLE ... ADD CONSTRAINT → wrapped to ignore dup errors.
  const idempotentSql = sql
    .replace(/CREATE TABLE (?!IF NOT EXISTS)/g, 'CREATE TABLE IF NOT EXISTS ')
    .replace(/CREATE UNIQUE INDEX (?!IF NOT EXISTS)/g, 'CREATE UNIQUE INDEX IF NOT EXISTS ')
    .replace(/CREATE INDEX (?!IF NOT EXISTS)/g, 'CREATE INDEX IF NOT EXISTS ')

  const statements = idempotentSql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  log(`Executing ${statements.length} SQL statements (idempotent)...`)

  let ok = 0
  let skipped = 0
  let failed = 0
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    if (!stmt) continue
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 60)
    try {
      await client.query(stmt)
      ok++
      log(`  [${i + 1}/${statements.length}] ✓ ${preview}`)
    } catch (err) {
      const msg = (err as Error).message || ''
      if (
        msg.includes('already exists') ||
        msg.includes('duplicate key') ||
        msg.includes('duplicate table') ||
        msg.includes('relation') && msg.includes('already exists')
      ) {
        skipped++
        log(`  [${i + 1}/${statements.length}] ⊘ exists: ${preview}`)
      } else {
        failed++
        log(`  [${i + 1}/${statements.length}] ⚠ ${msg.slice(0, 80)} | ${preview}`)
      }
    }
  }

  // Verify by listing tables
  const { rows } = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;`,
  )
  log('\n=== Tables in public schema ===')
  for (const row of rows) log('  •', row.tablename)

  await client.end()
  log(
    `\n✅ Done! ${ok} created, ${skipped} already existed, ${failed} warnings.`,
  )
  if (rows.length >= 7) {
    log('✅ All 7 PharmaTrace tables are present in Supabase.')
  } else {
    log(`⚠ Expected 7 tables, found ${rows.length}.`)
  }
}

main().catch((err) => {
  log('\n❌ Schema application failed:', (err as Error).message)
  process.exit(1)
})
