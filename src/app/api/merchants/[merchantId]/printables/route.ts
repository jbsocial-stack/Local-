import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/require-owner';
import { requireOps } from '@/lib/auth/require-ops';
import { generatePosterPdf, generateStickerPdf } from '@/lib/printables/generate';

interface Params {
  merchantId: string;
}

// R12: reachable by the merchant's own owner (reprint) or by ops (bulk
// printing before the letterbox campaign, Phase A/B timeline section 9).
export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { merchantId } = await params;
  const [owner, ops] = await Promise.all([requireOwner(merchantId), requireOps()]);
  if (!owner.ok && !ops.ok) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const kind = req.nextUrl.searchParams.get('kind') === 'sticker' ? 'sticker' : 'poster';

  const supabase = createServiceClient();
  const { data: merchant } = await supabase
    .from('merchants')
    .select('name, towns(slug)')
    .eq('id', merchantId)
    .maybeSingle();
  if (!merchant) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const townSlug = (merchant.towns as unknown as { slug: string } | null)?.slug ?? '';

  const input = { merchantName: merchant.name, townSlug, appOrigin: req.nextUrl.origin };
  const pdfBytes = kind === 'sticker' ? await generateStickerPdf(input) : await generatePosterPdf(input);

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${townSlug}-${kind}.pdf"`,
    },
  });
}
