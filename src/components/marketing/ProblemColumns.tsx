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

      <div className="mt-6 flex items-center gap-4 rounded-2xl bg-paper px-5 py-4">
        <span
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-coral-soft"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F26B5B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
          </svg>
        </span>
        <p className="text-sm font-medium text-ink">
          All the independent shops in your area, rolled into one loyalty programme.
        </p>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        {SUPPORTING.map((p) => (
          <div key={p.title}>
            <h3 className="font-h3 text-xl">{p.title}</h3>
            <p className="mt-1 text-ink-muted">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
