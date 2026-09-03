import { describe, expect, it } from 'vitest';

// DoD: "Zero client-side secrets; Supabase anon key only with insert-only
// RLS verified by a test that attempts a select and expects failure."
//
// This hits the real Supabase REST API with the anon key — it needs actual
// network access and a live, migrated project, neither of which this
// sandbox has (same limitation documented in the README for the Playwright
// suite). It's deliberately outside vitest.config.ts's default include
// glob (tests/unit/**) so `npm test` stays green here; run it explicitly
// with `npx vitest run tests/integration/rls.test.ts` against a real
// deployment to verify the RLS policies from supabase/migrations/0008.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe.skipIf(!SUPABASE_URL || !ANON_KEY)('signups RLS (anon key, live Supabase)', () => {
  it('allows an anon insert but denies an anon select', async () => {
    const email = `rls-test-${Date.now()}@example.com`;

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/signups`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY!,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email, consent_version: 'v1', town_slug: 'chichester' }),
    });
    expect(insertRes.status).toBeLessThan(300);

    const selectRes = await fetch(
      `${SUPABASE_URL}/rest/v1/signups?select=*&email=eq.${encodeURIComponent(email)}`,
      { headers: { apikey: ANON_KEY!, Authorization: `Bearer ${ANON_KEY}` } },
    );
    // RLS denies select for anon/authenticated entirely — PostgREST returns
    // an empty array (0 rows visible), not a 4xx, since the query itself is
    // valid; it just can't see any rows.
    const rows = await selectRes.json();
    expect(Array.isArray(rows) ? rows.length : -1).toBe(0);
  });
});
