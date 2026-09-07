import { Eyebrow } from './Eyebrow';

const TIERS = [
  {
    name: 'Shoppers',
    price: 'Free',
    unit: 'forever',
    bullets: ['Pass, earn, spend, map, missions'],
    cta: { label: 'Get your pass', href: '/shoppers' },
    style: 'card' as const,
  },
  {
    name: 'Regulars Business Standard',
    price: 'from £40',
    unit: '/mo',
    bullets: [
      '£40 single site · £60 (2 sites) · £85 (3–4) · £120 (5+)',
      'Scanner, earn/redeem, dashboard',
      'Map listing, 1 push offer/week',
      'Poster & window sticker',
    ],
    cta: { label: 'Request a trial', href: '/business' },
    style: 'ink' as const,
  },
  {
    name: 'Pro add-on',
    price: '+£60',
    unit: '/mo',
    bullets: ['Unlimited push', 'Lapsed-customer lists', 'Segmentation', 'Email lead gen'],
    cta: { label: 'Ask about Pro', href: '/business' },
    style: 'card' as const,
  },
];

const CARD_STYLE: Record<string, string> = {
  card: 'border border-ink/10 bg-white/60 text-ink',
  ink: 'bg-ink text-cream',
};

const DOT_STYLE: Record<string, string> = {
  card: 'bg-coral',
  ink: 'bg-coral',
};

export function PricingTable() {
  return (
    <div>
      <Eyebrow>Simple, honest pricing</Eyebrow>
      <h2 className="mt-2 font-display text-3xl">Pricing that keeps you independent.</h2>
      <p className="mt-2 text-ink/70">
        Set your own earn rate from 1x to 5x. Points you award are your marketing spend — points
        redeemed with you are sales.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {TIERS.map((tier) => (
          <div key={tier.name} className={`rounded-2xl p-6 ${CARD_STYLE[tier.style]}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] opacity-60">{tier.name}</p>
            <p className="mt-3 font-display text-3xl">
              {tier.price}
              <span className="ml-1 text-base font-normal opacity-70">{tier.unit}</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {tier.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span aria-hidden className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT_STYLE[tier.style]}`} />
                  {b}
                </li>
              ))}
            </ul>
            <a
              href={tier.cta.href}
              className={`mt-6 block rounded-full px-5 py-2.5 text-center text-sm font-medium ${
                tier.style === 'ink' ? 'bg-coral text-cream' : 'bg-ink text-cream'
              }`}
            >
              {tier.cta.label}
            </a>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm text-ink/60">
        Monthly billing for your first 6 months (+30%), then annual. Cancel anytime in the intro
        period.
      </p>
    </div>
  );
}
