import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/require-owner';

interface Params {
  merchantId: string;
  photoId: string;
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { merchantId, photoId } = await params;
  const auth = await requireOwner(merchantId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const supabase = createServiceClient();
  await supabase.from('merchant_photos').delete().eq('id', photoId).eq('merchant_id', merchantId);
  return new NextResponse(null, { status: 204 });
}
