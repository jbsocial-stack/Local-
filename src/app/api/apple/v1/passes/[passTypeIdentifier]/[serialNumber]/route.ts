import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { authenticateAppleRequest } from '@/lib/wallet/apple-webservice-auth';
import { generateApplePass, AppleCertificatesMissingError } from '@/lib/wallet/apple';
import { generateToken, encodeQrPayload } from '@/lib/token/rotating-token';
import { formatLastActivity } from '@/lib/wallet/last-activity';
import { buildClaimUrl } from '@/lib/wallet/claim-url';

interface Params {
  passTypeIdentifier: string;
  serialNumber: string;
}

// Apple PassKit Web Service: return the latest signed pass for this serial.
// Regenerated fresh on every call so the barcode carries a current rotating
// token (R2) and the header shows the current balance (R1).
export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { serialNumber } = await params;
  const auth = await authenticateAppleRequest(req, serialNumber);
  if (!auth) return new NextResponse(null, { status: 401 });

  const supabase = createServiceClient();
  const { data: pass } = await supabase
    .from('passes')
    .select('id, serial, secret, balance_points, updated_at, town_id, revoked_at')
    .eq('id', auth.passId)
    .maybeSingle();
  if (!pass || pass.revoked_at) return new NextResponse(null, { status: 404 });

  const ifModifiedSince = req.headers.get('if-modified-since');
  if (ifModifiedSince && new Date(pass.updated_at) <= new Date(ifModifiedSince)) {
    return new NextResponse(null, { status: 304 });
  }

  const { data: town } = await supabase.from('towns').select('name, slug').eq('id', pass.town_id).single();
  const { data: lastLedgerRow } = await supabase
    .from('ledger')
    .select('type, points, created_at')
    .eq('pass_id', pass.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  try {
    const qrPayload = encodeQrPayload(generateToken(pass.secret, pass.id));
    const buffer = await generateApplePass({
      serial: pass.serial,
      authenticationToken: pass.secret,
      townName: town?.name ?? 'Regulars',
      balancePoints: pass.balance_points,
      lastActivityLabel: formatLastActivity(lastLedgerRow ?? null),
      qrPayload,
      claimUrl: buildClaimUrl(req.nextUrl.origin, town?.slug ?? ''),
    });
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Last-Modified': pass.updated_at,
      },
    });
  } catch (err) {
    if (err instanceof AppleCertificatesMissingError) {
      return new NextResponse(null, { status: 503 });
    }
    throw err;
  }
}
