import { Eyebrow } from './Eyebrow';

const SUPPORTING = [
  {
    title: 'Re-invigorate the high street',
    body: "We all want to shop independently. Other than \"it's the right thing to do\", nothing rewards us for it.",
  },
  {
    title: 'Your loyalty, scattered.',
    body: 'A punch card at the café, another at the bakery — none of them add up to anything.',
  },
];

export function ProblemColumns() {
  return (
    <div>
      <Eyebrow>The problem</Eyebrow>
      <h2 className="mt-2 font-display text-3xl leading-tight md:text-4xl">
        Every shop has its own stamp card. Nobody carries them.
      </h2>

      <div className="mt-6 flex items-center gap-4 rounded-2xl bg-accent-yellow px-5 py-4">
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-cream">
          ★
        </span>
        <p className="text-sm font-medium text-ink">
          All the independent shops in your area, rolled into one loyalty programme.
        </p>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        {SUPPORTING.map((p) => (
          <div key={p.title}>
            <h3 className="font-display text-xl">{p.title}</h3>
            <p className="mt-1 text-ink/80">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
