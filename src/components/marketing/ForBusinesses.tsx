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

export function ForBusinesses() {
  return (
    <div>
      <h2 className="font-display text-3xl">For businesses</h2>
      <div className="mt-6 grid gap-8 sm:grid-cols-3">
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <h3 className="font-display text-xl">{c.title}</h3>
            <p className="mt-1 text-lg font-medium">{c.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <DashboardMock />
      </div>
    </div>
  );
}

function DashboardMock() {
  return (
    <svg viewBox="0 0 480 260" className="w-full max-w-lg" aria-hidden="true">
      <rect x="0" y="0" width="480" height="260" rx="16" fill="var(--cream, #fff9e6)" />
      <text x="24" y="34" fontFamily="var(--font-display, sans-serif)" fontSize="18" fill="#2B2B2B">
        The Roastery — dashboard
      </text>
      {[
        { x: 24, label: 'Visits (30d)', value: '214' },
        { x: 184, label: 'Repeat customers', value: '61' },
        { x: 344, label: 'Net position', value: '£38.20' },
      ].map((card) => (
        <g key={card.label}>
          <rect x={card.x} y="56" width="112" height="72" rx="10" fill="#fff" />
          <text x={card.x + 12} y="80" fontSize="11" fill="#666">
            {card.label}
          </text>
          <text x={card.x + 12} y="108" fontSize="22" fontWeight="700" fill="var(--coral, #f76c5e)">
            {card.value}
          </text>
        </g>
      ))}
      <rect x="24" y="148" width="432" height="88" rx="10" fill="#fff" />
      {[40, 60, 45, 70, 55, 80, 65].map((h, i) => (
        <rect
          key={i}
          x={44 + i * 58}
          y={220 - h}
          width="28"
          height={h}
          rx="4"
          fill="var(--coral, #f76c5e)"
        />
      ))}
    </svg>
  );
}
