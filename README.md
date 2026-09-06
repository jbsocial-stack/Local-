# Local

Eat. Shop. Earn. Local. — all the independent shops in your town rolled into
one loyalty programme.

This repo implements **Phase A and Phase B of the product PRD** (schema/
ledger, scan-to-earn/redeem, the merchant PWA, the nightly expiry job,
merchant onboarding/settings, the shopper directory + map, account
sign-up/sign-in, the merchant dashboard, the ops console, printables) plus
the full **Marketing Homepage PRD** (the public `/` and `/[town]` site —
hero, pitch, pricing, both sign-up forms, the UK demand map) for the
Chichester pilot. Product Phase C (letterbox campaign) and Phase D (P1
features: push offers, missions, lapsed-customer lists) are not built. See
the two PRDs for full context.

## Two apps, one repo

`src/app/(marketing)/` is the public marketing site (`/`, `/[town]`,
`/shoppers`, `/[town]/shoppers`, `/business`, `/pricing`, `/privacy`,
`/terms`) — its own layout, fonts (self-hosted Outfit/Inter via
`next/font`), and `styles/brand.css`. Every other route (`/m/...`,
`/ops/...`, the bare `/[town]/shops` / `/[town]/reissue`, all of
`/api/...`) is the product app and is untouched by the marketing layout.
The two `[town]` dynamic segments — `app/(marketing)/[town]/page.tsx` and
`app/[town]/shops/page.tsx` — coexist fine since route groups don't add a
URL segment and the two never claim the exact same path; this is confirmed
by `next build`, which errors loudly on any real route conflict.

**The marketing homepage absorbed the product's old `/[town]` landing
page.** R1 originally called for `/[town]` to be a simple "Add to Wallet"
page; the Marketing Homepage PRD independently claims `/` and `/[town]` for
the full pitch-and-signup page. Per the resolution in that PRD, `/[town]`
is now the marketing page (an overview, linking out to `/[town]/shoppers`
for the actual sign-up), and a live town's shopper form creates the
account, the pass, and a signed-in session all in one step (see
"Password sign-in" below) — the old standalone landing page and its
`IssuePassButtons` component were removed early on, and the anonymous
pass + separate claim-page flow that replaced it was removed later still,
once it turned out to be exactly the kind of friction it was meant to
avoid.

## Stack

Next.js 15 (App Router, TypeScript) · Supabase (Postgres, RLS, Auth magic
link, Edge Functions) · Tailwind · `passkit-generator` (Apple Wallet) ·
`@zxing/browser` (QR scanning) · `react-leaflet` + OpenStreetMap (directory
map) · `pdf-lib` + `qrcode` (printables) · `next/font` (Outfit/Inter) ·
`next/og` (dynamic OG images) · Plausible (analytics) · Vitest · Playwright.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + wallet credentials
npm run dev
```

Apply the schema against a Supabase project (SQL editor or `supabase db
push` with the CLI), in order — `supabase/migrations/0001` through `0011`.
`0005` adds the trigger that mirrors new `auth.users` rows (merchant owners
and ops staff, who sign in via magic link; shoppers too, now, since signup
creates a real Supabase Auth account) into `public.users`; `0007` creates
the `merchant-photos` (public) and `printables` (private) storage buckets;
`0008` adds the marketing site's `signups` and `merchant_leads` tables
(anon insert-only RLS — no select policy at all, verified by
`tests/integration/rls.test.ts`); `0009` adds the signed-in shopper app's
profile fields, venue gallery/social links, likes, and the `avatars`
storage bucket; `0010` drops `passes.platform`'s `not null` — a pass exists
from the moment of signup, before a wallet platform has necessarily been
chosen; `0011` adds `signups.referral_code` for the refer-a-friend/
early-access mechanic (see "Password sign-in" below).

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
npm test            # Vitest — token rotation, points/redeem/expiry calc, dashboard & town stats, CSV, geocode parsing, marketing signup/lead/demand-map logic
npm run test:e2e    # Playwright — product happy path + marketing forms
npm run lint
```

The unit suite covers every server-only calculation exactly against the
PRD's acceptance criteria (e.g. "£12.40 at 3x → 37 points", "balance 1500 +
request £20 → rejected, £15.00 available", "QR older than 5 minutes is
rejected", "net position equals the ledger sum", "5+ venues tags the
notification email `[multi-site]`"). The Playwright suite drives the real
UI — product (staff login → scan → earn/redeem) and marketing (`/chichester`
pre-fill, both forms' live/coming-soon/planned success states) — against a
mocked API layer, since this environment has no live Supabase project to
seed; point a real deployment's Playwright run at it directly (drop the
`page.route` mocks) to turn either suite into a true end-to-end test.

`tests/integration/rls.test.ts` hits a real Supabase project's REST API
with the anon key to verify `signups` accepts an insert but returns zero
rows on select — it's outside `vitest.config.ts`'s default include glob
(same live-network limitation as the Playwright suite), so run it
explicitly: `npx vitest run tests/integration/rls.test.ts`.

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

**Until either is configured, shoppers can still fully onboard — and scan.**
Signing up for a live town (`/api/signup`) creates the account, the pass,
and a signed-in session in one step, with no dependency on Apple/Google
Wallet at all — see "Password sign-in" below. Adding the pass to an actual
wallet app is a separate, later, optional action from the wallet page
(`AddToWalletButtons.tsx` → `/api/pass`, which requires the shopper to
already be signed in and just generates the file for their existing pass);
until that's configured, that one button shows an inline error but nothing
else about the product is blocked.

That includes scanning: tapping the wallet card (`FlippableWalletCard.tsx`)
flips it over to reveal the same rotating QR code
(`encodeQrPayload(generateToken(...))`, `src/lib/token/rotating-token.ts`)
a real wallet pass's barcode would show, rendered as a plain PNG
(`GET /api/pass/qr`, using the `qrcode` package already used for
printables) rather than embedded in a `.pkpass`/Google Wallet object.
`/api/scan/verify` reads the same payload format either way, so the
merchant scanner needs no changes — this is a genuine fallback for the
whole earn/redeem loop, not just a UI placeholder, and it's what makes the
product usable end-to-end before any wallet credentials exist.

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
- **Shopper landing page** — originally a standalone `/[town]` page with
  just "Add to Apple/Google Wallet" buttons; since superseded by the
  marketing homepage's `/[town]` (see "Two apps, one repo" above), which
  absorbed the same functionality into its shopper-form success state.

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
- **R9 account + pass re-issue** (`src/app/[town]/reissue/`,
  `src/app/api/pass/reissue/`) — an account and its pass are created
  together at signup (see "Password sign-in" below), so there's no separate
  claim step; reissue (a distinct lost-device recovery flow, still
  magic-link) revokes the old pass (including its Apple web-service auth)
  and transfers the balance to a new one via a pair of ledger `adjust`
  entries. Every wallet pass's back field links to `/[town]/app/sign-in`.
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

### Marketing site (H1–H11)

- **Town config** (`config/towns.ts`) — single source of truth for the hero
  pill, the shopper form's town select, and the demand map's coordinates.
  Currently seeded with Chichester (`coming-soon`) plus seven other South
  East towns (`planned`) as a starting set — add more towns by adding rows,
  no code changes needed.
- **Site structure**: the homepage (`/`, `/[town]`) is shopper-first — the
  shopper pitch (`ForShoppers`) plus everything general-purpose (mission,
  the problem, the demand map), not a dual-audience overview. Every
  business-facing section (`ForBusinesses`, `PricingTable`, the trial
  form) lives only on `/business`, which also carries the one KPI a
  prospective merchant actually cares about — how many shoppers are
  already using Local, right now (`getShopperCounts`/
  `formatTractionHeadline` in `src/lib/marketing/shopper-count.ts`, a
  non-revoked-`passes` count per live town, same distinction /api/signup's
  launch-capacity check makes). `/pricing` redirects to `/business#pricing`
  (pricing tiers are business content — the one shopper tier, "Free
  forever", is already a bullet in `ForShoppers`). The shopper sign-up form
  lives on its own pages too: `/shoppers` and the town-scoped
  `/[town]/shoppers` (pre-fills the town field). `ShopperPageContent.tsx`
  composes the shopper page from the same `ForShoppers` component the
  homepage uses, so the "why" is consistent in both places, only the form
  is page-specific. A business owner still reaches `/business` from the
  homepage — the hero's "I run a business" tile, and every
  header/footer/burger-menu nav — it just isn't pitched inline on `/`
  any more. `BurgerMenu.tsx` (in the sticky `Header`) is how you get
  between all of these, particularly on mobile where there's no room for a
  full nav bar.
- **Both forms** (`src/components/marketing/ShopperForm.tsx`,
  `MerchantForm.tsx`, `src/app/api/{signup,lead}/`) — real `<form
  method="POST">` elements that work with JavaScript disabled (the route
  handler renders a server-side success page) and are progressively
  enhanced client-side into the richer inline states the PRD describes
  (live-town wallet buttons, coming-soon/planned messaging, the merchant
  trial-booking confirmation). Duplicate shopper sign-ups (same email +
  town) are a no-op success, not an error — enforced by a unique index,
  same fix pattern as `metrics_daily`'s.
- **Cards-stacking scroll effect** (`SectionBand`'s `stackOrder` prop,
  `styles/brand.css`) — consecutive sections passed a sequential
  `stackOrder` are `position: sticky` at a shared offset with increasing
  z-index, so each one's top edge catches up to and visually covers the
  previous one as you scroll. Pure CSS (no scroll-jank risk), falls back to
  normal static flow under `prefers-reduced-motion: reduce`. Stacking cards
  must use fully opaque backgrounds (`STACK_CARD_STYLES` in
  `SectionBand.tsx`) — a translucent one lets whatever's underneath show
  through mid-transition.
- **Demand map** (`src/components/marketing/DemandMap.tsx`,
  `src/lib/marketing/demand-map.ts`) — signups aggregated by town, a simple
  equirectangular lat/lng projection onto a stylised (not survey-accurate)
  GB outline, dot radius area-proportional to count, live towns in yellow.
  Cached 5 minutes (`export const revalidate = 300`) on both `/api/demand`
  and the homepage itself — without that, Next tries to fully prerender the
  page at build time and fails the same way the product's root-redirect
  page once did (see the git history if curious). `/business` sets the
  same `revalidate = 300` for the same reason, now that it fetches the
  shopper-count KPI above.
- **SEO** — per-route metadata, `generateStaticParams` for every configured
  town, a `next/og`-rendered OG image (`/og`, optionally `?town=slug`).
- **Analytics** (`src/lib/marketing/analytics.ts`) — Plausible (cookie-less,
  so "no cookie banner required" holds with zero extra work); set
  `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to turn it on, otherwise every `track()`
  call is a silent no-op. Covers pageview (automatic), CTA clicks, form
  start/submit, and wallet-add, with UTM params auto-merged from the
  current URL into every event.
- **Merchant lead notifications** (`src/lib/marketing/notify-lead.ts`) —
  best-effort email (via a direct Resend API call, no SDK dependency) plus
  an optional generic webhook; needs `RESEND_API_KEY` /
  `LEAD_NOTIFICATION_EMAIL` / `LEAD_NOTIFICATION_FROM` (webhook needs only
  `LEAD_WEBHOOK_URL`). Neither is a hard blocker like Apple Wallet — the
  lead is written to `merchant_leads` regardless of whether anyone gets
  emailed about it — but nothing fires until those are set.
- **Legal pages** (`/privacy`, `/terms`) — plain pages rather than MDX (no
  functional difference for static placeholder text), both flagged
  on-page as needing legal review per H11 and PRD open question #4.

`/business` is a real page (see above); `/pricing` still redirects to
`/#pricing` since pricing — both shopper and business tiers together — only
makes sense as one comparison, not split across the shopper/business pages.

## Signed-in shopper app (`/[town]/app/`)

A four-tab app for shoppers with an account (created at signup, R9) — Wallet,
Discover, Offers, Profile — behind a floating glassmorphism bottom nav
(`src/components/shopper/BottomNav.tsx`) that only renders once there's a
real Supabase Auth session (`src/app/[town]/app/layout.tsx` checks this;
each page separately enforces the redirect-to-sign-in via
`requireShopper()`, same split as `requireOwner`/`requireOps`).

- **Wallet** (`.../app/wallet`) — a Monzo-style card showing the pass
  balance, and every ledger row for that pass (earned and spent) below it.
- **Discover** (`.../app/discover`) — the same category-filterable
  directory as the public `/[town]/shops` (they now share
  `src/lib/directory/get-listings.ts`), but every card links to a level-2
  venue page (`.../app/discover/[merchant]`): photo gallery, description,
  current offers, social links, and a like button
  (`merchant_likes`, toggled via `/api/merchants/[id]/like` — identity
  always comes from the caller's own session, never a request body).
- **Offers** (`.../app/offers`) — a deals feed built entirely from data
  merchants already manage in Settings (base multiplier + scheduled
  boosts) — no new "offer" concept on the merchant side. Classification
  (`src/lib/offers.ts`, unit-tested) sorts live boosts first, then a
  merchant's standing multiplier if above 1x, then upcoming boosts;
  anything already ended is dropped.
- **Profile** (`.../app/profile`) — name/phone/avatar editing (email is
  read-only here; changing it needs Supabase Auth's own confirm-both-
  addresses flow, out of scope for this pass) and **delete account**.
  Deletion can't hard-delete a user with real ledger history — the schema
  already blocks that (`ledger.pass_id ... on delete restrict`), on
  purpose, to protect the financial record — so it revokes every pass,
  scrubs PII from `users`, and deletes the underlying Supabase Auth
  identity via the admin API instead.

**Venue-side additions** (owner's existing `/m/[town]/[merchant]/settings`
page): a gallery uploader (`merchant_photos`, distinct from the single
`photo_url` used as the directory thumbnail) and a social links form
(`merchants.social_links`) — both feed directly into what Discover's venue
page displays, so there's no separate "build your page" form to maintain.

Testing note: unlike the marketing forms, these pages read a real Supabase
Auth session server-side (`requireShopper`) rather than taking client-side
fetches that `page.route` can mock — so Playwright coverage here is limited
to what's testable without a live session (the sign-in redirect, the nav's
absence when signed out). Point a real deployment with a seeded, signed-in
session at these routes to exercise the rest.

### Password sign-in (shopper auth is password-only)

One form, one step, no email round-trip: signing up for a live town
(`/[town]/shoppers` or `/shoppers`) creates the account, the pass, and a
signed-in session together, in a single `POST /api/signup` — no separate
claim page, and no dependency on Apple/Google Wallet (that's a later,
optional action from the wallet page; see "Known blocker: Apple Wallet"
above). Merchant owner/ops sign-in and the separate lost-device
pass-reissue flow still use magic link — see below.

- **`/[town]/shoppers`** (also plain **`/shoppers`**, town-agnostic) —
  `ShopperForm` shows a password field once the selected town resolves to
  `live` (`config/towns.ts`). On submit, `/api/signup` does everything
  server-side in one request: `supabase.auth.admin.createUser({ email,
  password, email_confirm: true })` (the service-role admin API — no
  confirmation email is ever sent, regardless of the project's own
  "Confirm email" dashboard setting), creates the pass row, then signs the
  shopper in (`signInWithPassword`, via the route-handler client so the
  session cookie lands on this same response) and returns
  `{ status: 'live', redirectTo }`. The client just navigates there. If
  the email's already registered, it falls back to treating the submitted
  password as a sign-in attempt instead of erroring.
- **`/sign-in`** (town-agnostic, linked from the marketing header) and
  **`/[town]/app/sign-in`** — `PasswordSignInForm` calls
  `supabase.auth.signInWithPassword` for a returning shopper.
- **Profile → Password** — `supabase.auth.updateUser({ password })` lets a
  shopper change their password once signed in.
- **`/reset-password`** ("Forgot password?" on the sign-in form) — the one
  email this path can still send: `supabase.auth
  .resetPasswordForEmail(email, { redirectTo })` mails a recovery link that
  round-trips through `/auth/callback?next=/reset-password/confirm` (the
  same generic code-exchange route used everywhere else here) and lands on
  `/reset-password/confirm`, which just calls `updateUser({ password })`
  against the session that exchange already established.

`/[town]/reissue` (lost-device pass transfer) is a separate,
intentionally-still-magic-link flow, not a shopper sign-up/sign-in path —
it's for someone who already has an account and lost the device the pass
was on, so email is the right recovery mechanism there.

#### Refer-a-friend / early access

Only `LAUNCH_CARD_LIMIT` (`config/towns.ts`, currently 500) passes go out
per town at launch. Every `/api/signup` call — waitlist or live — writes a
`signups` row and gets back a `referral_code` (`supabase/migrations/0011`).
Once a live town's non-revoked `passes` count hits the limit, `/api/signup`
stops creating accounts for it and falls back onto the same waitlist path
as a not-yet-live town, reporting `status: 'capacity'` instead of `'live'`.

Anyone on a waitlist (`coming-soon` / `planned` / `capacity`) sees their
queue position and a shareable link (`?ref=<code>`, read client-side in
`ShopperForm` and threaded back into the next `/api/signup` call as
`refCode`). Position is ranked purely by referral count, tie-broken by
signup order (`computeWaitlistStats` in `src/lib/marketing/waitlist.ts`) —
referring friends is the only way to move up. `GET /api/waitlist/status?
code=<code>` re-checks a position without re-submitting the form.
