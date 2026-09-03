-- Apple PassKit Web Service device registrations (R1 key flow: "Register
-- device on Apple's web service callback"). Not in the PRD's section-10
-- table list but required to implement the spec's register/unregister/
-- push-update flow — server-only, no RLS policy grants any browser access.

create table apple_device_registrations (
  id uuid primary key default gen_random_uuid(),
  device_library_identifier text not null,
  pass_type_identifier text not null,
  pass_id uuid not null references passes(id) on delete cascade,
  push_token text not null,
  created_at timestamptz not null default now(),
  unique (device_library_identifier, pass_type_identifier, pass_id)
);
create index apple_device_registrations_pass_id_idx on apple_device_registrations(pass_id);

alter table apple_device_registrations enable row level security;
-- No policies: service-role only, same as ledger/merchant_users.
