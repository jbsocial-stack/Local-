import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Params {
  deviceLibraryIdentifier: string;
  passTypeIdentifier: string;
}

// Apple PassKit Web Service: which of this device's registered passes have
// changed since `passesUpdatedSince`, so the device knows what to re-fetch.
export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { deviceLibraryIdentifier, passTypeIdentifier } = await params;
  const since = req.nextUrl.searchParams.get('passesUpdatedSince');

  const supabase = createServiceClient();
  const { data: registrations } = await supabase
    .from('apple_device_registrations')
    .select('pass_id, passes!inner(serial, updated_at)')
    .eq('device_library_identifier', deviceLibraryIdentifier)
    .eq('pass_type_identifier', passTypeIdentifier);

  if (!registrations || registrations.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const sinceDate = since ? new Date(since) : null;
  const updated = registrations.filter((r) => {
    const p = r.passes as unknown as { serial: string; updated_at: string };
    return !sinceDate || new Date(p.updated_at) > sinceDate;
  });

  if (updated.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const serialNumbers = updated.map((r) => (r.passes as unknown as { serial: string }).serial);
  const lastUpdated = new Date().toISOString();

  return NextResponse.json({ lastUpdated, serialNumbers });
}
