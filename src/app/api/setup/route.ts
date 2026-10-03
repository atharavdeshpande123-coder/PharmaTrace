import { db } from '@/lib/db'
import { ok, fail, withHandler } from '@/lib/api'

/**
 * GET /api/setup
 * 
 * Checks if the database is connected and initialized.
 * If DATABASE_URL is not set or the database is unreachable,
 * returns setup instructions.
 */
export const GET = withHandler(async () => {
  const dbUrl = process.env.DATABASE_URL
  
  if (!dbUrl) {
    return ok({
      status: 'NEEDS_DATABASE',
      message: 'DATABASE_URL is not configured. Please set it in Vercel Environment Variables.',
      instructions: {
        step1: 'Create a free PostgreSQL database at https://neon.tech (or https://supabase.com)',
        step2: 'Copy the connection string (e.g., postgresql://user:pass@host/dbname?sslmode=require)',
        step3: 'Go to Vercel → Settings → Environment Variables',
        step4: 'Add DATABASE_URL with the connection string',
        step5: 'Redeploy the project',
        step6: 'Visit /api/setup again to verify, then visit /api/seed to seed demo data',
      },
    })
  }
  
  try {
    // Try a simple query
    const userCount = await db.user.count()
    const drugCount = await db.drug.count()
    return ok({
      status: 'CONNECTED',
      message: 'Database is connected and ready.',
      stats: {
        users: userCount,
        drugs: drugCount,
      },
      nextStep: userCount === 0 ? 'Visit POST /api/seed to load demo data (requires admin login)' : 'Database is ready to use.',
    })
  } catch (e) {
    return ok({
      status: 'NEEDS_SCHEMA_PUSH',
      message: 'Database is connected but schema is not initialized. Run: npx prisma db push',
      error: (e as Error).message,
    })
  }
})
