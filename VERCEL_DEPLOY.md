# PharmaTrace — Vercel Deployment Guide

## Prerequisites

1. A [Vercel](https://vercel.com) account (free tier works)
2. A PostgreSQL database (recommended: [Neon](https://neon.tech) — free tier, serverless)

## Step 1: Create a PostgreSQL Database

### Option A: Neon (Recommended — Free, Serverless)
1. Go to https://neon.tech and sign up
2. Create a new project
3. Copy the connection string (looks like `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)

### Option B: Supabase
1. Go to https://supabase.com and sign up
2. Create a new project
3. Go to Settings → Database → Connection string → URI
4. Copy the connection string

### Option C: Vercel Postgres
1. In Vercel dashboard → Storage → Create Database → Postgres
2. Copy the connection string

## Step 2: Update Prisma Schema for PostgreSQL

Before deploying, change the database provider in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"    // ← change from "sqlite" to "postgresql"
  url      = env("DATABASE_URL")
}
```

## Step 3: Deploy to Vercel

### Option A: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from project root
cd /home/z/my-project
vercel

# When prompted:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name? pharmatrace
# - Framework preset? Next.js
# - Root directory? ./
# - Build command? bun run build
# - Output directory? .next
# - Install command? bun install
```

### Option B: Via Vercel Dashboard
1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Framework preset: **Next.js** (auto-detected)
5. Build command: `bun run build` (or leave as `next build`)
6. Install command: `bun install`

## Step 4: Set Environment Variables

In the Vercel dashboard, go to **Settings → Environment Variables** and add:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://user:password@host/dbname?sslmode=require` | Production + Preview |
| `JWT_SECRET` | `your-secure-random-string` | Production + Preview |
| `BLOCKCHAIN_MODE` | `local` | All |
| `PUBLIC_APP_URL` | `https://pharmatrace.vercel.app` (your Vercel URL) | Production |
| `NODE_ENV` | `production` | Production |

## Step 5: Push Schema to Database

After the first deployment (or before), run the schema push:

```bash
# Set DATABASE_URL to your PostgreSQL connection string
DATABASE_URL="postgresql://..." npx prisma db push
```

Or use the in-app Admin → Reseed button (which calls `/api/seed`).

## Step 6: Seed Demo Data

After the database schema is pushed:

```bash
# Set DATABASE_URL to your PostgreSQL connection string
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
```

Or login as admin and click "Reseed Demo Data" in the Admin page.

## Step 7: Update PUBLIC_APP_URL

After your first deployment, Vercel gives you a URL like:
```
https://pharmatrace-xxx.vercel.app
```

1. Go to Vercel → Settings → Environment Variables
2. Update `PUBLIC_APP_URL` to your deployment URL
3. Redeploy

This ensures QR codes contain the correct public URL.

## QR Code Verification

After deployment:
1. QR codes will encode: `https://your-app.vercel.app/verify/PTR-XXXX`
2. Anyone can scan the QR with any phone camera
3. The public verification page opens — no login required
4. The complete pharmaceutical record is displayed

## Demo Credentials

All accounts use password: `demo1234`

| Role | Email |
|------|-------|
| Admin | `admin@pharmatrace.demo` |
| Manufacturer | `manufacturer@pharmatrace.demo` |
| Distributor | `distributor@pharmatrace.demo` |
| Pharmacy | `pharmacy@pharmatrace.demo` |
| Customer | `customer@pharmatrace.demo` |

## Troubleshooting

### Build fails with Prisma error
- Make sure `DATABASE_URL` is set in Vercel environment variables
- Make sure the schema provider is `postgresql` (not `sqlite`)
- The `postinstall` script runs `prisma generate` automatically

### Database connection error
- Make sure your PostgreSQL allows connections from Vercel (0.0.0.0/0)
- Neon and Supabase allow this by default
- Check `?sslmode=require` is in the connection string

### QR codes point to localhost
- Set `PUBLIC_APP_URL` environment variable to your Vercel URL
- Redeploy

### Public verification page not found (404)
- The `/verify/[verificationId]` route should be auto-detected
- Make sure the deployment completed successfully

### Seed script fails
- Run `npx tsx prisma/seed.ts` locally with the production `DATABASE_URL`
- Or use the Admin → Reseed button after logging in
