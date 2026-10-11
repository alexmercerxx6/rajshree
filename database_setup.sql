-- 1. Create the results table
create table public.results (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  time_slot text not null,
  display_time text not null,
  ra text not null,
  rb text not null,
  rc text not null,
  rd text not null,
  re text not null,
  created_at timestamptz default now()
);

-- 2. Create index for faster searching by date (used by GET /api/results)
create index idx_results_date on public.results (date);

-- 3. Add Unique Constraint (Optimization for POST /api/results)
-- This prevents duplicate entries for the same date and time slot
alter table public.results
add constraint unique_date_time_slot unique (date, time_slot);

-- 4. Enable Row Level Security (RLS) - Recommended security practice
alter table public.results enable row level security;

-- 5. Policy: Allow public read access (Anyone can view results)
create policy "Public can view results"
on public.results for select
to anon
using (true);

-- 6. Policy: Allow service role (server) full access
-- Note: 'service_role' key bypasses RLS automatically, but this is good practice explicitly
create policy "Service role has full access"
on public.results for all
to service_role
using (true)
with check (true);
