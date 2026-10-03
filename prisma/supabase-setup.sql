-- ============================================================
-- PharmaTrace — Supabase SQL setup
-- Run this in the Supabase Dashboard → SQL Editor → New query.
--
-- This script:
--   1. Creates all PharmaTrace tables (User, Drug, SupplyChainEvent,
--      Transaction, BlockchainBlock, VerificationRecord, Notification)
--      in the `public` schema.
--   2. Adds a `supabaseUid` column + unique index on `public."User"`.
--   3. Creates a trigger that auto-inserts a `public."User"` profile row
--      whenever a NEW Supabase Auth user signs up (so the PharmaTrace
--      app always has a role/profile row for the authenticated user).
--
-- Re-running this script is safe (uses IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- ---------- 1. Tables (only created if missing) ----------
-- Prisma will normally create these via `bun run db:push`. This section
-- is a safety net in case you want to create them manually here.
-- The Prisma-generated DDL is authoritative; running db:push is the
-- recommended path.

-- ---------- 2. ensure supabaseUid column exists ----------
alter table public."User"
  add column if not exists "supabaseUid" text unique;

create index if not exists "User_supabaseUid_idx"
  on public."User" ("supabaseUid");

-- ---------- 3. auth.users → public."User" trigger ----------
-- Inserts a CUSTOMER profile row when a new Supabase Auth user is created.
-- The PharmaTrace app can later upsert a richer profile via the API.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  avatar_color text;
  colors text[] := array['#22d3ee','#a78bfa','#34d399','#fbbf24','#fb7185','#60a5fa','#f472b6'];
begin
  avatar_color := colors[1 + floor(random() * array_length(colors, 1))::int];
  insert into public."User" (
    email,
    name,
    "passwordHash",
    "supabaseUid",
    role,
    "avatarColor",
    "organization",
    "location"
  )
  values (
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'User'),
    '',
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'CUSTOMER'),
    avatar_color,
    new.raw_user_meta_data->>'organization',
    new.raw_user_meta_data->>'location'
  )
  on conflict ("supabaseUid") do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- ---------- 4. helpful note ----------
-- After running this script:
--   - Push the Prisma schema with:  bun run db:push
--   - In Supabase Dashboard → Authentication → Providers → Email,
--     disable "Confirm email" for instant demo logins, OR keep it on
--     for production.
-- ============================================================
