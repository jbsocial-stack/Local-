import { NextResponse } from 'next/server';

// Per-merchant PWA manifest. The staff PIN pad is the right start_url —
// it's a shared till device, sessions are meant to be re-entered each
// shift, and unlike /scan it never shows a working screen to a signed-out
// device. See the sibling layout.tsx for how this gets linked in.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ town: string; merchant: string }> },
) {
  const { town, merchant } = await params;
  const scope = `/m/${town}/${merchant}`;

  return NextResponse.json(
    {
      name: 'Regulars — Eat. Shop. Earn.',
      short_name: 'Regulars',
      description: 'The independent-shop loyalty scheme for your town.',
      start_url: `${scope}/login`,
      scope,
      display: 'standalone',
      background_color: '#F4F2ED',
      theme_color: '#F26B5B',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
}
