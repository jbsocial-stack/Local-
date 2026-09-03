-- Marketing homepage PRD, H2/H3: shopper waitlist/pass signups and merchant
-- trial leads. town_slug here is NOT a foreign key to towns(slug) — it's a
-- free-standing identifier from config/towns.ts covering every town we
-- might launch in, most of which have no row in `towns` yet (that table
-- only has towns the product has actually onboarded).

create extension if not exists "citext";

create type lead_category as enum ('cafe', 'restaurant', 'bar', 'retail', 'services', 'other');
create type lead_status as enum ('new', 'contacted', 'trial', 'live', 'lost');

create table signups (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  town_slug text,
  town_free_text text,
  postcode text,
  consent_marketing boolean not null default false,
  consent_version text not null,
  source text,
  utm jsonb not null default '{}'::jsonb,
  ref_code text,
  created_at timestamptz not null default now()
);
-- "duplicate email+town is a no-op success" (AC) — a plain `unique (...)`
-- constraint can't take an expression like coalesce(), same restriction
-- that bit metrics_daily; a unique index does support it.
create unique index signups_email_town_idx
  on signups (email, coalesce(town_slug, town_free_text));

create table merchant_leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null,
  email citext not null,
  phone text,
  town_slug text not null,
  venues merchant_tier not null,
  category lead_category not null,
  notes text,
  source text,
  utm jsonb not null default '{}'::jsonb,
  status lead_status not null default 'new',
  created_at timestamptz not null default now()
);
create index merchant_leads_town_idx on merchant_leads(town_slug);
create index merchant_leads_status_idx on merchant_leads(status);

alter table signups enable row level security;
alter table merchant_leads enable row level security;

-- "anon can insert only; select restricted to service role and ops."
create policy signups_anon_insert on signups
  for insert to anon, authenticated with check (true);

create policy merchant_leads_anon_insert on merchant_leads
  for insert to anon, authenticated with check (true);

-- No select/update/delete policy for anon/authenticated on either table —
-- RLS denies those by default. Ops reads both through the service role
-- (see /api/demand and any future ops lead-review UI), same as every other
-- server-only table in this schema.
