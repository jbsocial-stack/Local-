const PROBLEMS = [
  {
    title: 'Re-invigorate the high street',
    body: "We all want to shop independently. Other than \"it's the right thing to do\", nothing rewards us for it.",
  },
  {
    title: 'Siloed rewards',
    body: 'Every shop has its own stamp card. Nobody carries them.',
  },
  {
    title: 'Who are my customers?',
    body: "Independents don't know who comes back, how often, or who's stopped.",
  },
];

export function ProblemColumns() {
  return (
    <div className="grid gap-8 sm:grid-cols-3">
      {PROBLEMS.map((p) => (
        <div key={p.title}>
          <h3 className="font-display text-xl">{p.title}</h3>
          <p className="mt-1 text-ink/80">{p.body}</p>
        </div>
      ))}
    </div>
  );
}
