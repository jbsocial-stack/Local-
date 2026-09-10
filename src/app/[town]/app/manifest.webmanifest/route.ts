import { NextResponse } from 'next/server';

// Per-town shopper-app PWA manifest. start_url is the wallet, not sign-in
// — unlike the merchant PIN pad this is a personal device with a
// long-lived Supabase session, so reopening straight to the card/balance
// is the right "app" experience; wallet/page.tsx itself already redirects
// to sign-in on the rare case that session has actually expired. See the
// sibling layout.tsx for how this gets linked in.
export async function GET(_req: Request, { params }: { params: Promise<{ town: string }> }) {
  const { town } = await params;
  const scope = `/${town}/app`;

  return NextResponse.json(
    {
      name: 'Regulars — Eat. Shop. Earn.',
      short_name: 'Regulars',
      description: 'The independent-shop loyalty scheme for your town.',
      start_url: `${scope}/wallet`,
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
