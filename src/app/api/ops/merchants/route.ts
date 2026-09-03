import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOps } from '@/lib/auth/require-ops';
import { geocodeAddress, GeocodeNotFoundError } from '@/lib/geocode';

// R6: "ops creates merchant" — starts as `pending` until ops approves it
// (R11), and the owner shows up in merchant_users so their magic-link
// email (see lib/auth/require-owner.ts) can reach settings/dashboard.
const bodySchema = z.object({
  townId: z.string().uuid(),
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and hyphens only'),
  category: z.string().min(1),
  address: z.string().min(1),
  ownerName: z.string().min(1),
  ownerEmail: z.string().email(),
});

export async function POST(req: NextRequest) {
  const auth = await requireOps();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request', issues: parsed.error.issues }, { status: 400 });
  }
  const { townId, ownerName, ownerEmail, address, ...merchantFields } = parsed.data;

  let lat: number;
  let lng: number;
  try {
    ({ lat, lng } = await geocodeAddress(address));
  } catch (err) {
    if (err instanceof GeocodeNotFoundError) {
      return NextResponse.json({ error: 'address_not_found', message: err.message }, { status: 422 });
    }
    throw err;
  }

  const supabase = createServiceClient();
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .insert({ ...merchantFields, address, lat, lng, town_id: townId })
    .select()
    .single();
  if (merchantError || !merchant) {
    return NextResponse.json({ error: 'create_failed', message: merchantError?.message }, { status: 500 });
  }

  const { error: ownerError } = await supabase
    .from('merchant_users')
    .insert({ merchant_id: merchant.id, role: 'owner', name: ownerName, email: ownerEmail });
  if (ownerError) {
    return NextResponse.json({ error: 'owner_create_failed', message: ownerError.message }, { status: 500 });
  }

  return NextResponse.json({ merchant }, { status: 201 });
}
