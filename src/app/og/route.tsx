import { ImageResponse } from 'next/og';
import { findTown } from '../../../config/towns';

export const runtime = 'edge';

// H8: "OG image of the A-board poster." A code-drawn stand-in for the same
// motif as ABoardPoster.tsx — next/og's renderer only supports a small
// subset of CSS/SVG, so this is a simpler, purpose-built version rather
// than reusing that component directly.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const townSlug = searchParams.get('town');
  const town = townSlug ? findTown(townSlug) : undefined;

  // Self-fetch from public/ — the standard way to get a real font into an
  // edge ImageResponse, since it can't read the filesystem directly.
  const windsorPro = await fetch(new URL('/fonts/windsor-pro-bold.ttf', req.url)).then((res) =>
    res.arrayBuffer(),
  );

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F76C5E',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#F3F1EC',
            borderRadius: 24,
            padding: '48px 64px',
            width: 760,
          }}
        >
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 800, color: '#1B263B', lineHeight: 0.95 }}>
            Eat.
          </div>
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 800, color: '#1B263B', lineHeight: 0.95 }}>
            Shop.
          </div>
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 800, color: '#1B263B', lineHeight: 0.95 }}>
            Earn.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 96,
              fontFamily: 'Windsor Pro',
              color: '#F76C5E',
              lineHeight: 0.95,
            }}
          >
            REGULARS.
          </div>
          {town && (
            <div style={{ display: 'flex', marginTop: 24, fontSize: 32, color: '#1B263B' }}>{town.name}</div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Windsor Pro', data: windsorPro, weight: 700, style: 'normal' }],
    },
  );
}
