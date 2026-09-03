-- R6: merchant photos, public-read (shown on the public directory, R8).
-- Uploaded only through /api/merchants/[id]/photo using the service role,
-- so no INSERT/UPDATE storage policy is needed for the anon/authenticated
-- roles — only a public SELECT policy for read.
insert into storage.buckets (id, name, public)
values ('merchant-photos', 'merchant-photos', true)
on conflict (id) do nothing;

create policy "merchant photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'merchant-photos');

-- R12: generated poster/sticker PDFs, private — served through an
-- ops/owner-gated route, not fetched directly from the bucket.
insert into storage.buckets (id, name, public)
values ('printables', 'printables', false)
on conflict (id) do nothing;
