# Local

Eat. Shop. Earn. Local. — all the independent shops in your town rolled into
one loyalty programme.

This repo implements **Phase A and Phase B** of the PRD — schema/ledger,
scan-to-earn/redeem, the merchant PWA, the nightly expiry job, merchant
onboarding/settings, the shopper directory + map, account claim, the
merchant dashboard, the ops console, and printables — for the Chichester
pilot. Phase C (letterbox campaign) and Phase D (P1 features: push offers,
missions, lapsed-customer lists) are not built. See the PRD for full
product context.

## Stack

Next.js 15 (App Router, TypeScript) · Supabase (Postgres, RLS, Auth magic
link, Edge Functions) · Tailwind · `passkit-generator` (Apple Wallet) ·
`@zxing/browser` (QR scanning) · `react-leaflet` + OpenStreetMap (directory
map) · `pdf-lib` + `qrcode` (printables) · Vitest · Playwright.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + wallet credentials
npm run dev
```

Apply the schema against a Supabase project (SQL editor or `supabase db
push` with the CLI), in order — `supabase/migrations/0001` through `0007`.
`0005` adds the trigger that mirrors new `auth.users` rows (merchant owners
and ops staff, who sign in via magic link) into `public.users`; `0007`
creates the `merchant-photos` (public) and `printables` (private) storage
buckets.

In the Supabase dashboard, set **Auth → URL Configuration → Site URL** to
your app's origin and add it (plus `/auth/callback`) to the redirect
allowlist, or every magic link will fail to exchange. Then seed the
Chichester pilot town, its three friendly test merchants, and (by hand, via
SQL or the dashboard) at least one row in `ops_users` for yourself before
`/ops` will let you in:

```bash
npm run seed
```

## Testing

```bash
npm run typecheck   # tsc --noEmit
npm test            # Vitest — token rotation, points/redeem/expiry calc, dashboard & town stats, CSV, geocode parsing
npm run test:e2e    # Playwright — staff login -> scan -> earn/redeem happy path
npm run lint
```

The unit suite covers every server-only calculation exactly against the
PRD's acceptance criteria (e.g. "£12.40 at 3x → 37 points", "balance 1500 +
request £20 → rejected, £15.00 available", "QR older than 5 minutes is
rejected", "net position equals the ledger sum"). The Playwright suite
drives the real merchant UI against a mocked API layer, since this
environment has no live Supabase project to seed — point
`NEXT_PUBLIC_E2E_TEST_MODE` at a real deployment with seeded data and swap
the `page.route` mocks for the real network calls to turn it into a true
end-to-end test.

## Known blocker: Apple Wallet

**R1 is blocked on the PRD's own open question #2** ("Apple Developer Pass
Type ID and certificate — who holds it?"). The full Apple Wallet code path
is implemented and wired end-to-end — issuance, re-issuance (R9), the
PassKit Web Service (register/unregister device, list updated passes, get
updated pass, log), and the APNs push trigger on every balance change — but
every entry point throws a typed `AppleCertificatesMissingError` / fails
with a `503` until these env vars are set (see `.env.example`):

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

## What's implemented

### Phase A (R1–R5)

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
- **Shopper landing page** (`src/app/[town]/page.tsx`) — the actual
  "Add to Apple/Google Wallet" page R1 calls for. This was missed in the
  first Phase A pass (only the `/api/pass` endpoint existed) and got built
  alongside Phase B once the gap surfaced while wiring R12's poster QR,
  which needed somewhere to point.

### Phase B (R6–R12)

- **Supabase Auth (magic link)** for merchant owners and ops staff
  (`src/middleware.ts`, `src/lib/supabase/route-handler.ts`,
  `src/app/auth/callback/`) — distinct from the PIN till-device session:
  owners/ops get a real signed-in session tied to their email, checked
  against `merchant_users.email` / `ops_users.email`
  (`src/lib/auth/require-owner.ts`, `require-ops.ts`).
- **R6 merchant settings** (`src/app/m/[town]/[merchant]/settings/`) — name,
  category, address (re-geocoded via Nominatim on save,
  `src/lib/geocode.ts`), description, hours, base multiplier, scheduled
  boosts (CRUD), photo upload (Supabase Storage), staff PIN invites.
- **R8 directory + map** (`src/app/[town]/shops/`) — public, logged-out,
  category filter, live multiplier + boosted badges, Leaflet/OSM map.
- **R9 account claim + re-issue** (`src/app/[town]/claim/`,
  `src/app/[town]/reissue/`, `src/lib/account/claim.ts`,
  `src/app/api/pass/reissue/`) — email → magic link → the anonymous pass is
  re-pointed at the authenticated user; re-issuing to a new device revokes
  the old pass (including its Apple web-service auth) and transfers the
  balance via a pair of ledger `adjust` entries. Both wallet passes' back
  fields link to the claim page.
- **R10 merchant dashboard** (`src/app/m/[town]/[merchant]/dashboard/`) —
  visits (7/30d), unique/repeat customers (30d), points issued/redeemed,
  net position, recent transactions with owner-only void (writes a
  `reversal` ledger row). Stats are a pure function
  (`src/lib/ledger/dashboard-stats.ts`) so "net position equals the ledger
  sum" is asserted directly in a unit test, not just by construction.
- **R11 ops console** (`src/app/ops/`) — create towns, create/approve/pause
  merchants, edit town defaults, per-town dashboard
  (`src/lib/ops/town-stats.ts`), adjust a pass balance with a reason, CSV
  ledger export (`src/lib/csv.ts`).
- **R12 printables** (`src/lib/printables/generate.ts`,
  `src/app/api/merchants/[merchantId]/printables/`) — A4 poster + window
  sticker PDFs (`pdf-lib`), QR pointing straight at the town's Add-to-Wallet
  page per open question #7's recommendation (the directory is reached from
  the pass back field instead, not the poster).

Phase C (letterbox campaign, 1,000-pass push, BID meeting) is a go-to-market
motion, not a build item. Phase D (P1: push offers, missions/streaks, Google
Wallet parity if needed, lapsed-customer list, multi-venue merchants,
segmentation) is intentionally not built.
