import { Eyebrow } from './Eyebrow';

const STATS = [
  { label: 'Visits (30d)', value: '214' },
  { label: 'Repeat customers', value: '61' },
  { label: 'Net position', value: '£38.20' },
];

const COLUMNS = [
  {
    title: 'Your customers, finally.',
    body: 'See who comes back, how often, what they spend — across the whole scheme, not just your till.',
  },
  {
    title: 'Marketing that costs minutes.',
    body: 'One push offer a week to the people who already shop with you.',
  },
  {
    title: 'Footfall from next door.',
    body: 'Points earned at the café get spent in your shop.',
  },
];

export function ForBusinesses({ formHref = '#merchant-form' }: { formHref?: string }) {
  return (
    <div>
      <Eyebrow tone="cream">For independent shops</Eyebrow>
      <h2 className="mt-2 font-display text-3xl leading-tight">
        See who&apos;s coming back — not just who&apos;s passing.
      </h2>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl bg-cream/10 p-4">
            <p className="font-display text-3xl">{s.value}</p>
            <p className="mt-1 text-sm text-cream/70">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <h3 className="font-display text-lg">{c.title}</h3>
            <p className="mt-1 text-cream/80">{c.body}</p>
          </div>
        ))}
      </div>

      <a href={formHref} className="mt-8 inline-block rounded-full bg-cream px-6 py-3 font-medium text-ink">
        Start a free trial →
      </a>
    </div>
  );
}
