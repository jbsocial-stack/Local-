import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { parseSumUpWebhookBody, verifySumUpSignature, SUMUP_SIGNATURE_HEADER } from '@/lib/sumup/webhook';

// SumUp POSTs here on every checkout status change (see
// lib/sumup/webhook.ts). Deliberately does NOT award ledger points yet —
// SumUp's own docs say never to trust the webhook body for the actual
// result, only that *something* changed, and to re-fetch the checkout by
// id to confirm it. This records what SumUp told us and always returns
// 2xx once the signature checks out, so a retried delivery (SumUp retries
// failed deliveries at 1min/5min/20min) doesn't loop forever — the
// re-fetch-and-award-points step is the next piece of this integration,
// once a real SumUp sandbox account exists to confirm the checkout-fetch
// response shape against.
export async function POST(req: NextRequest) {
  const secret = process.env.SUMUP_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'sumup_not_configured' }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get(SUMUP_SIGNATURE_HEADER);
  if (!verifySumUpSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  const event = parseSumUpWebhookBody(rawBody);
  if (!event) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const supabase = createServiceClient();
  // Idempotent on (checkout_id, event_type) — a retried delivery just
  // no-ops rather than recording a duplicate row.
  const { error } = await supabase
    .from('sumup_webhook_events')
    .upsert(
      { checkout_id: event.checkoutId, event_type: event.eventType, raw_payload: JSON.parse(rawBody) },
      { onConflict: 'checkout_id,event_type', ignoreDuplicates: true },
    );
  if (error) {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
