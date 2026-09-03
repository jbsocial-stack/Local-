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
            backgroundColor: '#FFF9E6',
            borderRadius: 24,
            padding: '48px 64px',
            width: 760,
          }}
        >
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 800, color: '#F76C5E', lineHeight: 0.95 }}>
            Eat.
          </div>
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 800, color: '#F76C5E', lineHeight: 0.95 }}>
            Shop.
          </div>
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 800, color: '#F76C5E', lineHeight: 0.95 }}>
            Earn.
          </div>
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 800, color: '#F76C5E', lineHeight: 0.95 }}>
            Local.
          </div>
          {town && (
            <div style={{ display: 'flex', marginTop: 24, fontSize: 32, color: '#2B2B2B' }}>{town.name}</div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
