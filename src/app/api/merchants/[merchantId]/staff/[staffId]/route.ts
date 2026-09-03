import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/require-owner';

interface Params {
  merchantId: string;
  staffId: string;
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { merchantId, staffId } = await params;
  const auth = await requireOwner(merchantId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const supabase = createServiceClient();
  // Owners remove themselves via the ops console, not this staff-management
  // endpoint, so a PIN-only staff row is the only thing this can delete.
  await supabase
    .from('merchant_users')
    .delete()
    .eq('id', staffId)
    .eq('merchant_id', merchantId)
    .eq('role', 'staff');
  return new NextResponse(null, { status: 204 });
}
