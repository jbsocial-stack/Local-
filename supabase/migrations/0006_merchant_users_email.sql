-- R6/R7: owner accounts sign in via Supabase Auth magic link, matched by
-- email against this column at request time (see lib/auth/require-owner.ts)
-- — no separate claim step needed. Staff PIN accounts leave this null.
alter table merchant_users add column email text;
create unique index merchant_users_merchant_email_idx
  on merchant_users (merchant_id, lower(email))
  where email is not null;
