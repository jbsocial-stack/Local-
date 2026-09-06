-- SumUp POS integration: a merchant connects their own SumUp account via
-- OAuth 2.0 (authorization-code grant against api.sumup.com/authorize +
-- /token — see src/lib/sumup/oauth.ts) so we can trigger card-present
-- checkouts on their terminal and get notified when they complete. One
-- connection per merchant; reconnecting replaces it.
create table merchant_sumup_connections (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  sumup_merchant_code text, -- the connected SumUp account's own identifier, best-effort (see fetchSumUpMerchantCode)
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  connected_by uuid references merchant_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (merchant_id)
);

-- Audit trail for inbound webhooks, keyed by SumUp's own checkout id so a
-- retried delivery (SumUp retries at 1min/5min/20min on a non-2xx
-- response) can't be processed twice. Deliberately doesn't award ledger
-- points yet — see README's SumUp integration section for why.
create table sumup_webhook_events (
  id uuid primary key default gen_random_uuid(),
  checkout_id text not null,
  event_type text not null,
  confirmed_status text, -- filled in after re-fetching the checkout from SumUp's API
  raw_payload jsonb not null,
  received_at timestamptz not null default now(),
  unique (checkout_id, event_type)
);

alter table merchant_sumup_connections enable row level security;
alter table sumup_webhook_events enable row level security;
-- No anon/authenticated policy on either — service-role only, same as
-- every other server-only table in this schema (ops/owner access goes
-- through server routes using requireOwner/requireOps, not direct RLS).
