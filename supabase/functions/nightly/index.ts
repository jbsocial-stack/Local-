// Supabase Edge Function (Deno), scheduled nightly via Supabase cron.
// Two jobs per PRD R5 / section 10 "Key flows > 3. Nightly":
//   1. Expire FIFO points older than each town's expiry_months.
//   2. Reconcile passes.balance_points against the ledger sum and log/fix
//      any drift.
//
// Deploy: supabase functions deploy nightly
// Schedule: supabase functions schedule nightly --cron "0 3 * * *" (03:00 UTC)
import { createClient } from 'npm:@supabase/supabase-js@2';
import { calculateExpiry, type LedgerRowForExpiry } from '../../../src/lib/ledger/expiry.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RunSummary {
  passesChecked: number;
  pointsExpired: number;
  passesExpiredFor: number;
  driftFound: { passId: string; expected: number; actual: number }[];
}

async function run(): Promise<RunSummary> {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const summary: RunSummary = {
    passesChecked: 0,
    pointsExpired: 0,
    passesExpiredFor: 0,
    driftFound: [],
  };

  const { data: passes, error: passesError } = await supabase
    .from('passes')
    .select('id, town_id, balance_points, revoked_at, towns!inner(expiry_months)');
  if (passesError) throw passesError;

  for (const pass of passes ?? []) {
    if (pass.revoked_at) continue;
    summary.passesChecked += 1;

    const expiryMonths = (pass.towns as unknown as { expiry_months: number }).expiry_months;
    const cutoff = new Date();
    cutoff.setUTCMonth(cutoff.getUTCMonth() - expiryMonths);

    const { data: ledgerRows, error: ledgerError } = await supabase
      .from('ledger')
      .select('points, created_at')
      .eq('pass_id', pass.id)
      .order('created_at', { ascending: true });
    if (ledgerError) throw ledgerError;

    const rows: LedgerRowForExpiry[] = ledgerRows ?? [];
    const expirable = calculateExpiry(rows, cutoff);

    if (expirable > 0) {
      const { error: rpcError } = await supabase.rpc('apply_ledger_entry', {
        p_town_id: pass.town_id,
        p_pass_id: pass.id,
        p_merchant_id: null,
        p_staff_id: null,
        p_type: 'expire',
        p_points: -expirable,
        p_gbp_value_pence: expirable, // point_value_pence is fixed at 1 in v1
        p_multiplier: null,
        p_basket_pence: null,
        p_reason: `FIFO expiry after ${expiryMonths} months`,
        p_reverses_id: null,
      });
      if (rpcError) throw rpcError;
      summary.pointsExpired += expirable;
      summary.passesExpiredFor += 1;
    }

    // Reconciliation: ledger is the source of truth for the balance cache.
    const ledgerSum =
      rows.reduce((sum, r) => sum + r.points, 0) - expirable; // expirable not yet reflected in `rows`
    const { data: refreshed } = await supabase
      .from('passes')
      .select('balance_points')
      .eq('id', pass.id)
      .single();

    if (refreshed && refreshed.balance_points !== ledgerSum) {
      summary.driftFound.push({
        passId: pass.id,
        expected: ledgerSum,
        actual: refreshed.balance_points,
      });
      console.error(
        `[nightly] balance drift on pass ${pass.id}: ledger says ${ledgerSum}, cache says ${refreshed.balance_points} — correcting cache`,
      );
      await supabase.from('passes').update({ balance_points: ledgerSum }).eq('id', pass.id);
    }
  }

  return summary;
}

Deno.serve(async () => {
  try {
    const summary = await run();
    console.log('[nightly] complete', summary);
    return new Response(JSON.stringify(summary), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[nightly] failed', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
