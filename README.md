# Local

Eat. Shop. Earn. Local. — all the independent shops in your town rolled into
one loyalty programme.

This repo implements **Phase A** of the PRD (`towns`/`passes`/`ledger`
schema, rotating-QR scan-to-earn/redeem, the merchant PWA, and the nightly
expiry/reconciliation job) for the Chichester pilot. See the PRD for full
product context and the Phase B/C/D roadmap.

## Stack

Next.js 15 (App Router, TypeScript) · Supabase (Postgres, RLS, Edge
Functions) · Tailwind · `passkit-generator` (Apple Wallet) · `@zxing/browser`
(QR scanning) · Vitest · Playwright.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + wallet credentials
npm run dev
```

Apply the schema against a Supabase project (SQL editor or `supabase db
push` with the CLI), in order:

```
supabase/migrations/0001_init.sql
supabase/migrations/0002_ledger_functions.sql
supabase/migrations/0003_apple_device_registrations.sql
supabase/migrations/0004_pass_updated_at.sql
```

Then seed the Chichester pilot town and its three friendly test merchants:

```bash
npm run seed
```

## Testing

```bash
npm run typecheck   # tsc --noEmit
npm test            # Vitest — token rotation, points/redeem calc, FIFO expiry, multiplier resolution
npm run test:e2e    # Playwright — staff login -> scan -> earn/redeem happy path
npm run lint
```

The unit suite covers every server-only calculation exactly against the
PRD's acceptance criteria (e.g. "£12.40 at 3x → 37 points", "balance 1500 +
request £20 → rejected, £15.00 available", "QR older than 5 minutes is
rejected"). The Playwright suite drives the real merchant UI against a
mocked API layer, since this environment has no live Supabase project to
seed — point `NEXT_PUBLIC_E2E_TEST_MODE` at a real deployment with seeded
data and swap the `page.route` mocks for the real network calls to turn it
into a true end-to-end test.

## Known blocker: Apple Wallet

**R1 is blocked on the PRD's own open question #2** ("Apple Developer Pass
Type ID and certificate — who holds it?"). The full Apple Wallet code path
is implemented and wired end-to-end — issuance, the PassKit Web Service
(register/unregister device, list updated passes, get updated pass, log),
and the APNs push trigger on every balance change — but every entry point
throws a typed `AppleCertificatesMissingError` / fails with a `503` until
these env vars are set (see `.env.example`):

```
APPLE_TEAM_ID
APPLE_PASS_TYPE_IDENTIFIER
APPLE_WWDR_CERT_PATH
APPLE_SIGNER_CERT_PATH
APPLE_SIGNER_KEY_PATH
APNS_KEY_ID / APNS_TEAM_ID / APNS_KEY_PATH
```

The `.pkpass` template model (`src/lib/wallet/apple-pass-model/`) uses 1×1
placeholder PNGs for `icon.png` / `icon@2x.png` / `logo.png` / `logo@2x.png`
— swap in real brand assets (29×29 / 58×58 icon, 160×50 / 320×100 logo)
alongside the certificates.

Google Wallet (`src/lib/wallet/google.ts`) follows the same pattern against
`GOOGLE_WALLET_ISSUER_ID` / `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL` /
`GOOGLE_WALLET_SERVICE_ACCOUNT_KEY`, and is not blocked by anything in the
PRD's open questions — it just needs a Google Wallet issuer account set up.

## What's implemented (Phase A: R1–R5)

- **Schema + RLS** (`supabase/migrations/`) — every table from PRD §10, plus
  `apple_device_registrations` (needed for the Apple push flow but not
  listed in §10) and `passes.updated_at` (needed for the "list changed
  passes" web-service endpoint). Ledger is insert-only; `apply_ledger_entry`
  locks the pass row, inserts the ledger row, and updates the balance cache
  in one transaction so the cache can never drift from the ledger mid-write.
- **Rotating QR token** (`src/lib/token/rotating-token.ts`) — 60s step,
  1-step future tolerance for clock skew, 5-minute max age.
- **Scan → earn / redeem** (`src/app/api/scan/verify`,
  `src/app/api/ledger/{earn,redeem}`) — points are always computed
  server-side from a basket/redemption amount in pence; the client never
  sends a points value. Duplicate-award guard (same pass + merchant within
  2 minutes). Redemption is capped at the pass balance.
- **Merchant PWA** (`src/app/m/`) — PIN-only staff sign-in (scanner-scoped
  vs. full/owner-scoped sessions), camera QR scanner, earn/redeem
  confirmation flow.
- **Nightly job** (`supabase/functions/nightly/`) — FIFO points expiry per
  town's `expiry_months`, and balance-cache reconciliation against the
  ledger (logs and corrects drift). The FIFO logic
  (`src/lib/ledger/expiry.ts`) is pure and shared between the Edge Function
  and its unit tests.

R6–R12 (merchant onboarding/settings, staff invites beyond PIN creation,
directory/map, account claim, merchant dashboard analytics, ops console,
printables) are Phase B per the PRD's phasing and are not built here.
