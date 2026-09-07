-- Regulars — initial schema (PRD v1, section 10)
-- Ledger is the source of truth; passes.balance_points is a cache written in
-- the same transaction as every ledger insert and reconciled nightly.

create extension if not exists "pgcrypto";

create type ledger_type as enum ('earn', 'redeem', 'expire', 'adjust', 'reversal', 'mission');
create type merchant_tier as enum ('single', 'two', 'group', 'multi');
create type merchant_plan as enum ('standard', 'pro');
create type merchant_status as enum ('pending', 'live', 'paused');
create type pass_platform as enum ('apple', 'google');
create type merchant_role as enum ('owner', 'staff');

create table towns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  point_value_pence int not null default 1,
  base_points int not null default 1,
  expiry_months int not null default 12,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create table passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  town_id uuid not null references towns(id) on delete restrict,
  platform pass_platform not null,
  serial text not null unique,
  secret text not null, -- rotating-token signing seed, server-only
  balance_points int not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index passes_user_id_idx on passes(user_id);
create index passes_town_id_idx on passes(town_id);

create table merchants (
  id uuid primary key default gen_random_uuid(),
  town_id uuid not null references towns(id) on delete restrict,
  name text not null,
  slug text not null,
  category text not null,
  description text,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  hours jsonb not null default '{}'::jsonb,
  photo_url text,
  tier merchant_tier not null default 'single',
  plan merchant_plan not null default 'standard',
  status merchant_status not null default 'pending',
  base_multiplier int not null default 1 check (base_multiplier between 1 and 5),
  created_at timestamptz not null default now(),
  unique (town_id, slug)
);
create index merchants_town_id_idx on merchants(town_id);
create index merchants_status_idx on merchants(status);

create table merchant_boosts (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  multiplier int not null check (multiplier between 1 and 5),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  label text,
  check (ends_at > starts_at)
);
create index merchant_boosts_merchant_id_idx on merchant_boosts(merchant_id, starts_at, ends_at);

create table merchant_users (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  role merchant_role not null,
  name text not null,
  pin_hash text, -- bcrypt hash; null for owner accounts using magic-link auth
  created_at timestamptz not null default now()
);
create index merchant_users_merchant_id_idx on merchant_users(merchant_id);

create table ledger (
  id uuid primary key default gen_random_uuid(),
  town_id uuid not null references towns(id) on delete restrict,
  pass_id uuid not null references passes(id) on delete restrict,
  merchant_id uuid references merchants(id) on delete restrict,
  staff_id uuid references merchant_users(id) on delete set null,
  type ledger_type not null,
  points int not null,
  gbp_value_pence int not null,
  multiplier int,
  basket_pence int,
  reason text,
  reverses_id uuid references ledger(id),
  created_at timestamptz not null default now()
);
create index ledger_pass_id_idx on ledger(pass_id, created_at);
create index ledger_merchant_id_idx on ledger(merchant_id, created_at);
create index ledger_town_id_idx on ledger(town_id, created_at);
create index ledger_type_created_idx on ledger(type, created_at);

create table metrics_daily (
  town_id uuid not null references towns(id) on delete cascade,
  merchant_id uuid references merchants(id) on delete cascade,
  date date not null,
  passes_issued int not null default 0,
  active_earners int not null default 0,
  earns int not null default 0,
  redeems int not null default 0,
  points_issued int not null default 0,
  points_redeemed int not null default 0,
  gmv_pence bigint not null default 0
);
-- A plain `primary key` can't reference an expression like coalesce(), only
-- columns — this unique index enforces the same "one row per town, per
-- merchant (or town-wide when null), per day" invariant instead.
create unique index metrics_daily_unique_idx
  on metrics_daily (town_id, coalesce(merchant_id, '00000000-0000-0000-0000-000000000000'::uuid), date);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- All writes to business tables happen through server routes using the
-- service-role key, which bypasses RLS. RLS here governs what the anon/authed
-- browser client may read directly (directory, map, a shopper's own pass).

alter table towns enable row level security;
alter table users enable row level security;
alter table passes enable row level security;
alter table merchants enable row level security;
alter table merchant_boosts enable row level security;
alter table merchant_users enable row level security;
alter table ledger enable row level security;
alter table metrics_daily enable row level security;

-- Towns and live merchants are public read (directory works logged-out).
create policy towns_public_read on towns for select using (true);

create policy merchants_public_read_live on merchants
  for select using (status = 'live');

create policy merchant_boosts_public_read on merchant_boosts
  for select using (
    exists (select 1 from merchants m where m.id = merchant_boosts.merchant_id and m.status = 'live')
  );

-- Users may read/update only their own row once claimed (auth.uid() maps to users.id).
create policy users_self_select on users
  for select using (id = auth.uid());
create policy users_self_update on users
  for update using (id = auth.uid());

-- Passes are readable only by their owning claimed user; anonymous passes are
-- server-only (issued and read via the service-role API, never directly).
create policy passes_owner_select on passes
  for select using (user_id = auth.uid());

-- merchant_users, ledger and metrics_daily have no browser-facing policies:
-- no select/insert/update/delete policy exists for the anon/authenticated
-- roles, so RLS denies all direct access. Server routes use the service-role
-- key, which bypasses RLS entirely, for every read and write on these tables.

-- Ledger is append-only even for the service role's application logic: no
-- update or delete policy is ever defined, so corrections are new `reversal`
-- rows referencing `reverses_id`, never mutations.
