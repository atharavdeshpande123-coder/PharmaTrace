# PharmaTrace — Deploy to Vercel (3 Steps)

## Step 1: Create a free PostgreSQL database

1. Go to https://neon.tech → Sign up (free)
2. Create a new project
3. Copy the connection string (looks like):
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

## Step 2: Change database to PostgreSQL

Open `prisma/schema.prisma` and change line 13:
```
  provider = "sqlite"
```
to:
```
  provider = "postgresql"
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd /home/z/my-project
vercel

# When asked:
# - Framework: Next.js (auto-detected)
# - Build command: bun run build
# - Install command: bun install
```

### Option B: Using Vercel Dashboard
1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Vercel auto-detects Next.js

## Step 4: Set Environment Variables (CRITICAL)

In Vercel Dashboard → Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` (from Step 1) |
| `JWT_SECRET` | `pharmatrace_secret_2026` |
| `BLOCKCHAIN_MODE` | `local` |
| `PUBLIC_APP_URL` | `https://your-app.vercel.app` (your Vercel URL after deploy) |
| `NODE_ENV` | `production` |

## Step 5: Push schema and seed data

After setting DATABASE_URL, run locally:
```bash
DATABASE_URL="postgresql://your-connection-string" npx prisma db push --accept-data-loss
DATABASE_URL="postgresql://your-connection-string" npx tsx prisma/seed.ts
```

Or login as admin on the deployed app and click "Reseed Demo Data".

## Step 6: Update PUBLIC_APP_URL

After first deployment, you get a URL like:
```
https://pharmatrace-xxx.vercel.app
```

Update `PUBLIC_APP_URL` in Vercel → Settings → Environment Variables to this URL, then redeploy.

## Done!

QR codes will now encode:
```
https://your-app.vercel.app/verify/PHARMA-XXXX-signature
```

Scannable from ANY phone, ANYWHERE in the world.
