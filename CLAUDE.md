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
coral `#F76C5E` (the one accent colour — CTAs, highlights, section bands) · cream/stone `#F3F1EC` (background) · ink/navy `#1B263B` (text) · display: Outfit 800 (or Fredoka One) · body: Inter · logo: Windsor Pro Bold, uppercase, used only for the wordmark itself (Header/Hero/Footer/PassCardMock/printables/OG image — `font-logo` in Tailwind, `public/fonts/windsor-pro-bold.ttf`). Navy text on a very light stone background is the base palette; no yellow. Sections alternate coral/stone, never pure white. No gradients, shadows, emoji, photos.

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
