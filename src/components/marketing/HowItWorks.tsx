import { StepBadge } from './StepBadge';

const STEPS = [
  { n: '1', title: 'Eat. Shop.', body: 'Shop at any independent in the scheme.' },
  { n: '2', title: 'Earn.', body: 'Show your pass. Every £1 earns at least 1 point. Some shops give 3x, 5x.' },
  {
    n: '3',
    title: 'Spend anywhere in town.',
    body: '1 point = 1p, at every shop in the scheme. No vouchers, no rules.',
  },
];

export function HowItWorks() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.n} className="rounded-[28px] bg-paper p-6">
            <StepBadge index={i}>{step.n}</StepBadge>
            <h3 className="mt-4 font-h3 text-xl">{step.title}</h3>
            <p className="mt-1 text-ink-muted">{step.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 px-2 font-medium">
        All the independent shops in your area rolled into one loyalty programme.
      </p>
    </>
  );
}
