import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { authenticateAppleRequest } from '@/lib/wallet/apple-webservice-auth';

interface Params {
  deviceLibraryIdentifier: string;
  passTypeIdentifier: string;
  serialNumber: string;
}

const registerBodySchema = z.object({ pushToken: z.string().min(1) });

// Apple PassKit Web Service: register a device for push updates on this pass.
export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params;
  const auth = await authenticateAppleRequest(req, serialNumber);
  if (!auth) return new NextResponse(null, { status: 401 });

  const parsed = registerBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase.from('apple_device_registrations').upsert(
    {
      device_library_identifier: deviceLibraryIdentifier,
      pass_type_identifier: passTypeIdentifier,
      pass_id: auth.passId,
      push_token: parsed.data.pushToken,
    },
    { onConflict: 'device_library_identifier,pass_type_identifier,pass_id' },
  );
  if (error) return new NextResponse(null, { status: 500 });

  return new NextResponse(null, { status: 201 });
}

// Apple PassKit Web Service: unregister a device from push updates.
export async function DELETE(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params;
  const auth = await authenticateAppleRequest(req, serialNumber);
  if (!auth) return new NextResponse(null, { status: 401 });

  const supabase = createServiceClient();
  await supabase
    .from('apple_device_registrations')
    .delete()
    .eq('device_library_identifier', deviceLibraryIdentifier)
    .eq('pass_type_identifier', passTypeIdentifier)
    .eq('pass_id', auth.passId);

  return new NextResponse(null, { status: 200 });
}
