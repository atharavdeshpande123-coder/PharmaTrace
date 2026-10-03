# PharmaTrace — Supabase Setup Guide

This guide walks you through wiring up **Supabase** (PostgreSQL + Auth) for
PharmaTrace. Once configured, your verify/scan flow will work on Vercel
(the previous "internal server error" was caused by SQLite not being
available in serverless — Supabase Postgres fixes it permanently).

---

## Step 1 — Create a Supabase project

1. Go to <https://supabase.com> and sign in.
2. Click **New project** → pick an org, name it (e.g. `pharmatrace`),
   set a strong DB password, choose a region close to your users.
3. Wait ~2 minutes for provisioning to finish.

## Step 2 — Copy your credentials

In the Supabase Dashboard go to **Project Settings → API**. Copy:

| Key | Where it goes |
|---|---|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon public** key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** key ⚠️ secret | `SUPABASE_SERVICE_ROLE_KEY` |

Then go to **Project Settings → Database → Connection string** and copy the
**pooled** URI (port `6543`, Transaction mode). It looks like:

```
postgresql://postgres.abcdefghij:password@aws-0-region.pooler.supabase.com:6543/postgres
```

Paste that as `DATABASE_URL`.

## Step 3 — Fill in `.env`

Open `.env` and paste your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
DATABASE_URL=postgresql://postgres.abcdefghij:password@aws-0-region.pooler.supabase.com:6543/postgres
JWT_SECRET=any-long-random-string-here
```

> **Vercel:** Add the same 5 keys in **Project Settings → Environment
> Variables** (Production + Preview + Development).

## Step 4 — Create the database tables

```bash
bun run db:push
```

This creates all PharmaTrace tables (`User`, `Drug`, `SupplyChainEvent`,
`Transaction`, `BlockchainBlock`, `VerificationRecord`, `Notification`) in
your Supabase Postgres.

## Step 5 — (Recommended) Run the auth trigger SQL

In the Supabase Dashboard open **SQL Editor → New query**, paste the
contents of [`prisma/supabase-setup.sql`](../prisma/supabase-setup.sql), and
click **Run**. This adds:

- a `supabaseUid` column + index on `public."User"`
- a trigger that auto-creates a PharmaTrace profile row whenever a new
  Supabase Auth user signs up (so they get a `CUSTOMER` role immediately)

## Step 6 — (Optional) Disable email confirmation for demos

By default Supabase requires email confirmation before login works. For a
demo deployment, go to **Authentication → Providers → Email** and turn
**"Confirm email"** OFF — users can then log in instantly after signing up.

## Step 7 — Seed demo data

```bash
bun run seed
```

This creates demo users (admin, manufacturer, distributor, pharmacy,
customer) + sample drug batches so you can test the full verify flow.

## Step 8 — Deploy to Vercel

```bash
vercel
```

Make sure all 5 env vars are set on Vercel (Step 3). Then:

```bash
vercel --prod
```

Your verify flow (`/api/verify`, `/api/public/verify/[id]`) will now work
on Vercel without internal server errors.

---

## How auth works now

| Mode | When | How |
|---|---|---|
| **Supabase** (production) | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` set | `@supabase/ssr` browser client manages the session; the server resolves the Supabase user via cookies and links it to a PharmaTrace `User` profile row (by `supabaseUid`). |
| **Legacy JWT** (local dev without Supabase) | Supabase env vars empty | bcrypt password hash + a JWT cookie (`pharmatrace_token`). Lets the app run before Supabase is configured. |

Both modes expose the same `/api/auth/*` endpoints and the same `AppUser`
shape, so the frontend doesn't change.

## Troubleshooting

- **`Error validating datasource db: the URL must start with postgresql://`**
  → `DATABASE_URL` is empty or wrong format. Copy the pooled URI from
  Supabase Dashboard → Database → Connection string.

- **`Can't reach database server` on Vercel**
  → Use the **pooled** connection (port `6543`), not the direct one
  (port `5432`). Serverless functions need pooling.

- **Login returns "Invalid email or password" right after sign-up**
  → Email confirmation is ON. Either confirm the email, or disable it in
  Authentication → Providers → Email (Step 6).

- **`prisma db push` fails with `relation already exists`**
  → The trigger SQL already created the table. Run `bun run db:push` with
  `--accept-data-loss` or drop the public schema first.
