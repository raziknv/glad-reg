-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

-- ========== 1. Registrations ==========
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile_no text not null,
  whatsapp_no text not null,
  region text not null,
  wilayat text not null,
  village text not null,
  village_is_other boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists registrations_region_idx on public.registrations (region);
create index if not exists registrations_created_at_idx on public.registrations (created_at);

alter table public.registrations enable row level security;

-- The public form uses the anon key and should only ever be able to INSERT
-- a new row — never read, update or delete existing registrations.
create policy "anon can insert registrations"
  on public.registrations
  for insert
  to anon
  with check (true);

-- No select/update/delete policy is created for anon, so those are blocked
-- by default with RLS on. Reporting reads happen from the Edge Function
-- using the service_role key, which bypasses RLS.


-- ========== 2. Report recipients ==========
-- One row per person who should receive the daily summary email.
-- scope = 'region'  -> gets a summary of registrations in `region` only
-- scope = 'global'  -> gets a summary of ALL regions (the Oman in-charge)
create table if not exists public.report_recipients (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  scope text not null check (scope in ('region', 'global')),
  region text,               -- required when scope = 'region', null when 'global'
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint region_required_for_region_scope
    check (scope = 'global' or (scope = 'region' and region is not null))
);

alter table public.report_recipients enable row level security;
-- No policies -> not reachable by anon/public at all. Only the service_role
-- key (used by the Edge Function) can read/write this table. Manage rows
-- yourself via the Supabase Table Editor or SQL Editor, e.g.:
--
-- insert into public.report_recipients (email, name, scope, region) values
--   ('muscat.manager@example.com', 'Muscat Regional Manager', 'region', 'Muscat'),
--   ('dhofar.manager@example.com', 'Dhofar Regional Manager', 'region', 'Dhofar'),
--   ('oman.incharge@example.com',  'Oman Programme Lead',     'global', null);
