import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/require-owner';

interface Params {
  merchantId: string;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Gallery photos for the Discover venue page — distinct from the single
// `merchants.photo_url` (used as the directory list thumbnail).
export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { merchantId } = await params;
  const auth = await requireOwner(merchantId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get('photo');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 413 });
  }

  const supabase = createServiceClient();
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${merchantId}/gallery/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('merchant-photos')
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (uploadError) {
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('merchant-photos').getPublicUrl(path);

  const { count } = await supabase
    .from('merchant_photos')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId);

  const { data: photo, error } = await supabase
    .from('merchant_photos')
    .insert({ merchant_id: merchantId, url: publicUrl, position: count ?? 0 })
    .select()
    .single();
  if (error || !photo) {
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }

  return NextResponse.json({ photo }, { status: 201 });
}
