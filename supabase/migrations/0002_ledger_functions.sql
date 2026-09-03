-- Atomic ledger insert + balance cache update, called via supabase.rpc(...)
-- from the API routes. Runs as a single transaction so `passes.balance_points`
-- can never drift from the ledger between the insert and the cache write.
-- Only the service role may execute this — no grant to anon/authenticated.

create or replace function apply_ledger_entry(
  p_town_id uuid,
  p_pass_id uuid,
  p_merchant_id uuid,
  p_staff_id uuid,
  p_type ledger_type,
  p_points int,
  p_gbp_value_pence int,
  p_multiplier int,
  p_basket_pence int,
  p_reason text,
  p_reverses_id uuid
) returns ledger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_balance int;
  v_row ledger;
begin
  select balance_points into v_current_balance
  from passes
  where id = p_pass_id
  for update; -- lock the pass row for the duration of this transaction

  if v_current_balance is null then
    raise exception 'pass % not found', p_pass_id;
  end if;

  if v_current_balance + p_points < 0 then
    raise exception 'insufficient_balance' using errcode = 'P0001';
  end if;

  insert into ledger (
    town_id, pass_id, merchant_id, staff_id, type, points,
    gbp_value_pence, multiplier, basket_pence, reason, reverses_id
  ) values (
    p_town_id, p_pass_id, p_merchant_id, p_staff_id, p_type, p_points,
    p_gbp_value_pence, p_multiplier, p_basket_pence, p_reason, p_reverses_id
  ) returning * into v_row;

  update passes
  set balance_points = balance_points + p_points
  where id = p_pass_id;

  return v_row;
end;
$$;

revoke all on function apply_ledger_entry from public;
