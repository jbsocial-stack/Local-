# Regulars — CLAUDE.md

Context file for Claude Code. Read this first, then the docs it points to. Do not re-open decisions listed here; raise them as questions if you think one is wrong.

## What this is
Regulars is a town-wide loyalty card for independent businesses, launching in Chichester, UK. One wallet pass; earn points at any member shop, spend at any other; **1 point = 1p, fixed everywhere**; merchants set an earn multiplier (1x–5x). Shoppers free; merchants pay a venue-tiered SaaS fee (£40–£120/mo) with a 30% intro premium for six months. BIDs/councils sponsor towns.

## Docs (in this folder)
| File | Use it for |
|---|---|
| `regulars_prd.md` | Product v1 — requirements R1–R13, data model, stack, build order. **Start here.** |
| `regulars_homepage_prd.md` | Marketing site — sections, copy, forms, routes, tables. Same repo, `app/(marketing)/`. |
| `regulars_chichester_launch_kit.md` | Walk-in script, objections, printables. Source for poster/card/counter-stand generators (R12). |
| `regulars_competitive_brief.md` | Why the shared currency is the wedge; why card-linking is v1.5. |
| `town_loyalty_economics.xlsx` | Financial model. Not needed for build. |

## Naming
- Brand/wordmark: **Regulars**. Previously "Local" — renamed because SumUp launched *SumUp Local* (April 2026). Never use "Local" anywhere in code, copy, slugs or straplines.
- Strapline: *Get Regular. Eat, shop and earn points in your town.* The word "Local" appears nowhere — zero overlap with SumUp Local.
- Paid shopper tier (v2): **Regulars+**.
- Repo/package name suggestion: `regulars`. DB schema unchanged from the PRD.

## Locked decisions
1. Points at fixed 1p. Merchants vary earn, never redemption. Every merchant must accept redemption, no minimum, no exclusions.
2. No money moves between merchants in v1. Append-only `ledger`; net settlement is v2.
3. Earn is QR at launch (rotating token in the wallet pass). **Card-linked earn is R13 / v1.5**, not launch scope, but the ledger takes `source in (qr, card_link, system)` from day one.
4. No native apps. Shopper = wallet pass + `/[town]` web; merchant = PWA at `/m`; ops at `/ops`.
5. Chichester first, single town in UI, `town_id` on everything.
6. Points server-side only. The client never sends a points value.
7. Stack: Next.js 15 App Router + TypeScript, Supabase (Postgres/Auth/RLS/cron), Tailwind + shadcn/ui, passkit-generator, Google Wallet API, @zxing/browser, otplib, Leaflet/OSM, Web Push, Vercel.

## Brand tokens
Per **Regulars Design System v1.0** (9 Sep 2026 — source `.dc.html` kept by John, ask him for the latest export). Tailwind keys in `tailwind.config.ts`:

`ink` / --navy `#1C2B44` (primary — hero/section backgrounds, body text on cream) · `ink-2` / --navy-2 `#243452` (table stripes, inset panels on navy) · `ink-muted` / --ink-muted `#7C8698` (secondary text, captions) · `cream` / --cream `#F4F2ED` (page background, text on navy) · `cream-muted` / --cream-muted `#B9C1CF` (secondary text on navy) · `paper` / --paper `#FAF8F4` (cards/tiles on cream — one step lighter, no shadow) · `coral` / --coral `#F26B5B` (accent — action tiles, one emphasised word, never body copy, never more than ~10% of a screen) · `coral-soft` / --coral-soft `#FBE1DC` (icon backgrounds) · `line` / --line `#E6E9EE` (pills, dividers, table stripes on light) · `success` `#2E8B57` (confirmations only) · `error` `#C0392B` (errors only).

Backgrounds are navy or cream, never pure white/black; sections alternate. No gradients, shadows (except the one loyalty-card shadow: `0 8px 24px rgba(28,43,68,.18)`), emoji, or stock photos.

Type: `font-display`/`font-logo` = Windsor Pro **Ultra Heavy** (900) for the wordmark, H1, H2 — `public/fonts/windsor-pro-ultheavy.ttf`. `font-h3` = Windsor Pro **Bold** (700) for H3/card titles — `public/fonts/windsor-pro-bold.ttf`. Headings sentence case; the wordmark alone is uppercase. Body/lead/small/label/overline = Inter. `font-mono` = JetBrains Mono, for footer/metadata strips only (uppercase, tracked). Never bold Inter for a heading.

Buttons: pill, 44px mobile/48px desktop, 24px horizontal padding, hover darkens 6%, focus = 3px coral ring at 2px offset, one accent (coral) button per screen. Card radius 28px, inner cards/inputs 16px, chips 8px. Spacing scale 4/8/12/16/24/32/48/64.

## Build order (Phase A, weeks 1–3)
1. Schema + RLS + seed (`towns: chichester`, 3 merchants).
2. Pass issuance + Apple Wallet web service endpoints.
3. Rotating QR token issue/verify.
4. Merchant PWA: PIN login, scanner, earn, redeem.
5. Balance update → pass push.
6. Nightly expiry + reconciliation with a drift test.
Then Phase B (R6–R12), then homepage, then R13 spike.

## Definition of done
Playwright happy path per requirement; Vitest on points maths and token window; Lighthouse PWA ≥ 90 on `/m`; ledger sum == balance in a nightly test; RLS test proving anon can only insert to `signups`/`merchant_leads`.

## Open questions (don't block on these; ask John)
Apple Pass Type ID cert · 1x floor vs 0x merchants (default 1x) · daily per-pass cap (default £150) · Fidel quote · trademark on "Regulars".
