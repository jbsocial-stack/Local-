-- Refer-a-friend / early-access mechanic: every waitlist signup gets a
-- shareable code, and referring friends moves you up the queue for your
-- town — which matters once a town's first launch-capacity passes are
-- claimed and further "live" signups fall back onto this same waitlist
-- (see LAUNCH_CARD_LIMIT in config/towns.ts and /api/signup).
--
-- `ref_code` already existed (H2/H3 marketing attribution) but was
-- write-only and unused — it's reused here as "the referral_code of
-- whoever referred this signup," same column, same nullable-text shape.
alter table signups add column referral_code text;
update signups set referral_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
  where referral_code is null;
alter table signups alter column referral_code set not null;
alter table signups alter column referral_code
  set default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
create unique index signups_referral_code_idx on signups (referral_code);
