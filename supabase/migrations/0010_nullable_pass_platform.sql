-- Signing up no longer requires choosing Apple vs Google Wallet up front —
-- that's now a separate "add to wallet" action taken from the signed-in
-- wallet page, once the account (and its pass) already exist. A pass can
-- exist with no platform chosen yet.
alter table passes alter column platform drop not null;
