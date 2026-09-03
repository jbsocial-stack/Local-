import type { TownConfig } from '../../../config/towns';
import { Eyebrow } from './Eyebrow';

const BULLETS = [
  'Lives in Apple or Google Wallet. No app.',
  '1 point = 1p, spend at any shop in the scheme.',
  "Find every independent on the map, see who's giving double points today.",
  'Free. Forever.',
];

export function ForShoppers({ town }: { town?: TownConfig }) {
  const live = town?.status === 'live';
  return (
    <div className="grid items-center gap-10 md:grid-cols-2">
      <PhoneMock />
      <div>
        <Eyebrow>Your wallet pass, always in your pocket</Eyebrow>
        <h2 className="mt-2 font-display text-3xl">For shoppers</h2>
        <ul className="mt-4 space-y-2">
          {BULLETS.map((b) => (
            <li key={b} className="flex gap-2 text-ink/80">
              <span aria-hidden className="text-coral">
                •
              </span>
              {b}
            </li>
          ))}
        </ul>
        <a href="#shopper-form" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 font-medium text-cream">
          {live ? 'Get your pass' : 'Sign me up'}
        </a>
      </div>
    </div>
  );
}

function PhoneMock() {
  return (
    <svg viewBox="0 0 240 480" className="mx-auto h-96 w-auto" aria-hidden="true">
      <rect x="4" y="4" width="232" height="472" rx="32" fill="#1a1a1a" />
      <rect x="14" y="14" width="212" height="452" rx="24" fill="var(--cream, #fff9e6)" />
      <rect x="30" y="120" width="180" height="110" rx="16" fill="var(--coral, #f76c5e)" />
      <text x="46" y="160" fontFamily="var(--font-display, sans-serif)" fontSize="22" fill="#fff9e6">
        Local
      </text>
      <text x="46" y="190" fontSize="13" fill="#fff9e6" opacity="0.85">
        BALANCE
      </text>
      <text x="46" y="212" fontSize="20" fontWeight="700" fill="#fff9e6">
        £4.20
      </text>
    </svg>
  );
}
