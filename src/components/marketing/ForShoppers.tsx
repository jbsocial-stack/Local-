import type { TownConfig } from '../../../config/towns';
import { Eyebrow } from './Eyebrow';

const BULLETS = [
  'Lives in Apple or Google Wallet. No app.',
  '1 point = 1p, spend at any shop in the scheme.',
  "Find every independent on the map, see who's giving double points today.",
  'Free. Forever.',
];

export function ForShoppers({ town, formHref = '#shopper-form' }: { town?: TownConfig; formHref?: string }) {
  const live = town?.status === 'live';
  return (
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
      <a
        href={formHref}
        className="mt-6 flex h-11 w-fit items-center rounded-full bg-ink px-6 font-medium text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-2 sm:h-12"
      >
        {live ? 'Get your pass' : 'Sign me up'}
      </a>
    </div>
  );
}
