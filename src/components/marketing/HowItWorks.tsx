import { StepBadge } from './StepBadge';

const STEPS = [
  { n: '1', title: 'Eat. Shop.', body: 'Shop at any independent in the scheme.' },
  { n: '2', title: 'Earn.', body: 'Show your pass. Every £1 earns at least 1 point. Some shops give 3x, 5x.' },
  {
    n: '3',
    title: 'Spend anywhere local.',
    body: '1 point = 1p, at every shop in the scheme. No vouchers, no rules.',
  },
];

export function HowItWorks() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.n} className="rounded-2xl border border-ink/10 bg-white/60 p-6">
            <StepBadge index={i}>{step.n}</StepBadge>
            <h3 className="mt-4 font-display text-xl">{step.title}</h3>
            <p className="mt-1 text-ink/70">{step.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 px-2 font-medium">
        All the independent shops in your area rolled into one loyalty programme.
      </p>
    </>
  );
}
