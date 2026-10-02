import { requireRole } from '@/lib/auth/server'
import { fail, ok, withHandler } from '@/lib/api'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// POST /api/seed — admin-only reseed endpoint that runs the prisma seed script
export const POST = withHandler(async () => {
  await requireRole('ADMIN')
  try {
    // Run the seed script in the background and stream output
    const { stdout, stderr } = await execAsync('bun run prisma/seed.ts', {
      cwd: process.cwd(),
      timeout: 60_000,
    })
    return ok({ success: true, stdout, stderr: stderr || null })
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message?: string }
    return fail('Seed script failed', 500, { stdout: err.stdout, stderr: err.stderr, message: err.message })
  }
})
