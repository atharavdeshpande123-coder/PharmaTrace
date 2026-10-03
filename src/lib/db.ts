import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma Client configured for Supabase's PgBouncer transaction-mode
 * pooled connection (port 6543). When `pgbouncer=true` is in the
 * DATABASE_URL, prepared statements must be disabled to avoid the
 * "prepared statement already exists" error.
 *
 * `previewFeatures = ['driverAdapter']` is NOT needed; instead we rely on
 * the default query engine with `?pgbouncer=true` + `?pgbouncer=true`
 * automatically disabling prepared statements when the datasource URL
 * contains that param.
 */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Supabase pooled connections (PgBouncer transaction mode) don't
    // support prepared statements. This is handled automatically by the
    // `?pgbouncer=true` query param in DATABASE_URL.
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
