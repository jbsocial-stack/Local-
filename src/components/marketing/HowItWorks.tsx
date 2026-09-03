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
      <div className="grid gap-8 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n}>
            <div className="font-display text-4xl text-coral">{step.n}</div>
            <h3 className="mt-2 font-display text-xl">{step.title}</h3>
            <p className="mt-1 text-ink/80">{step.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-10 font-medium">
        All the independent shops in your area rolled into one loyalty programme.
      </p>
    </>
  );
}
