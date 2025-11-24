-- Supabase schema + RLS policies for leaderboard
-- Run this in Supabase SQL editor (Project -> SQL Editor -> New query)

-- 1) Create table (if not already created)
create table if not exists public.leaderboard (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  score int not null,
  date text,
  ts bigint,
  created_at timestamptz default now()
);

-- 2) Enable Row Level Security for the table
alter table public.leaderboard enable row level security;

-- 3) Policy: allow anyone (anon) to SELECT entries (read leaderboard)
-- This makes the table readable by clients with the anon key
create policy "anon_select" on public.leaderboard
  for select
  using (true);

-- 4) Policy: allow anon role to INSERT new leaderboard entries
-- with a CHECK to validate input values (basic guards)
create policy "anon_insert" on public.leaderboard
  for insert
  with check (
    auth.role() = 'anon' and
    name is not null and
    length(trim(name)) > 0 and
    score >= 0 and score <= 100
  );

-- 5) Prevent anon from UPDATE/DELETE: do not create policies for update/delete
-- By default, without policies, RLS prevents anon from updating/deleting rows.

-- 6) Optional: allow authenticated users (with JWT, non-anon) to SELECT/INSERT if needed
-- create policy "jwt_select" on public.leaderboard for select using (auth.role() in ('anon','authenticated'));

-- 7) Notes & recommendations:
-- - The anon key will be able to SELECT and INSERT (subject to the CHECK) when RLS is enabled and the policies above are applied.
-- - The service_role key bypasses RLS and should only be used in server-side code (e.g. reset function).
-- - You may want to tighten the CHECK clause (e.g. limit name length, disallow suspicious characters, or require a timestamp within a certain range) to reduce spam.
-- - Consider adding rate-limiting or captcha at the client side to avoid automated spam.

-- 8) Example: Grant minimal privileges to anon role (optional; Supabase manages keys separately)
-- grant usage on schema public to "anon";

-- End of file
