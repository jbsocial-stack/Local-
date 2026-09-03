-- Needed by the Apple PassKit Web Service's "list updated serials since tag"
-- endpoint (GET .../registrations/{passTypeIdentifier}?passesUpdatedSince=).
alter table passes add column updated_at timestamptz not null default now();

create or replace function touch_pass_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger passes_touch_updated_at
before update on passes
for each row
when (old.balance_points is distinct from new.balance_points)
execute function touch_pass_updated_at();
