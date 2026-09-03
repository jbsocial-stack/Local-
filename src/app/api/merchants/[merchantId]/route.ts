import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/require-owner';
import { geocodeAddress, GeocodeNotFoundError } from '@/lib/geocode';
import type { Database } from '@/lib/supabase/types';

type MerchantUpdate = Database['public']['Tables']['merchants']['Update'];

interface Params {
  merchantId: string;
}

const hoursSchema = z.record(
  z.string(),
  z.object({ open: z.string(), close: z.string() }).nullable(),
);

// R6: owner edits name/category/address/hours/base multiplier. Address
// changes are re-geocoded here so the directory map (R8) never shows a
// stale pin.
const socialLinksSchema = z.object({
  instagram: z.string().url().optional(),
  facebook: z.string().url().optional(),
  twitter: z.string().url().optional(),
  website: z.string().url().optional(),
});

const bodySchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  address: z.string().min(1).optional(),
  hours: hoursSchema.optional(),
  baseMultiplier: z.number().int().min(1).max(5).optional(),
  socialLinks: socialLinksSchema.optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { merchantId } = await params;
  const auth = await requireOwner(merchantId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { address, baseMultiplier, hours, socialLinks, ...rest } = parsed.data;

  const update: MerchantUpdate = { ...rest };
  if (hours) update.hours = hours;
  if (baseMultiplier) update.base_multiplier = baseMultiplier;
  if (socialLinks) update.social_links = socialLinks;

  if (address) {
    try {
      const { lat, lng } = await geocodeAddress(address);
      update.address = address;
      update.lat = lat;
      update.lng = lng;
    } catch (err) {
      if (err instanceof GeocodeNotFoundError) {
        return NextResponse.json({ error: 'address_not_found', message: err.message }, { status: 422 });
      }
      throw err;
    }
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('merchants')
    .update(update)
    .eq('id', merchantId)
    .select()
    .single();
  if (error || !data) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  return NextResponse.json({ merchant: data });
}
