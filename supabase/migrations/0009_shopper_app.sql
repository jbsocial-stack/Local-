-- Shopper app: profile fields, venue gallery/social links, likes.

alter table users add column phone text;
alter table users add column avatar_url text;
-- No RLS policy changes needed: the existing users_self_select/
-- users_self_update policies (id = auth.uid()) already cover these columns.

alter table merchants add column social_links jsonb not null default '{}'::jsonb;
-- {instagram, facebook, twitter, website}, all optional keys.

create table merchant_photos (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index merchant_photos_merchant_id_idx on merchant_photos(merchant_id, position);

alter table merchant_photos enable row level security;
create policy merchant_photos_public_read on merchant_photos
  for select using (
    exists (select 1 from merchants m where m.id = merchant_photos.merchant_id and m.status = 'live')
  );
-- Insert/update/delete only via /api/merchants/[id]/photos using the
-- service role (owner-gated) — no browser-facing write policy.

create table merchant_likes (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (merchant_id, user_id)
);
create index merchant_likes_merchant_id_idx on merchant_likes(merchant_id);
create index merchant_likes_user_id_idx on merchant_likes(user_id);

alter table merchant_likes enable row level security;
-- No policies: like counts and "did I like this" are read server-side
-- (service role) alongside the merchant data; toggling goes through
-- /api/merchants/[id]/like, which resolves the caller's identity from
-- their Supabase Auth session, not from a client-supplied user_id — same
-- server-only pattern as ledger/merchant_users/ops_users.

-- Profile avatars, public-read (shown wherever a shopper's name appears),
-- uploaded only through /api/profile/avatar using the service role.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');
