-- Merchant owners and ops staff authenticate via Supabase Auth magic link
-- (shoppers do not — R1's anonymous pass issuance never touches auth.users).
-- This mirrors every new auth.users row into public.users with the same id,
-- so `auth.uid()` lines up with `users.id` and the existing
-- `users_self_select` / `users_self_update` RLS policies apply to owners
-- and ops staff exactly as they do to a shopper who has claimed their pass.

create or replace function sync_auth_user_to_public()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, created_at)
  values (new.id, new.email, new.created_at)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function sync_auth_user_to_public();

create trigger on_auth_user_email_changed
after update of email on auth.users
for each row execute function sync_auth_user_to_public();

-- R11: ops staff who may create towns, approve merchants, adjust balances.
-- Membership is keyed by email and checked server-side against the
-- signed-in Supabase Auth user's email (see lib/auth/require-ops.ts) —
-- there is no signup flow, ops adds rows by hand. No RLS policy grants
-- any browser access, same as merchant_users/ledger.
create table ops_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
alter table ops_users enable row level security;
