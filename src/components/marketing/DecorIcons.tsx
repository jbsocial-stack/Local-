// Decorative background icon pack for the marketing homepage — line-art
// glyphs matching public/icons/decor/*.svg (same paths, inlined here so
// Tailwind can tint/size/opacity them with `currentColor` instead of
// needing a CSS filter on an <img>). Purely decorative: aria-hidden,
// pointer-events-none, no semantic meaning of their own.

type DecorIconName =
  | 'card'
  | 'cocktail'
  | 'shop'
  | 'location-pin'
  | 'heels'
  | 'sweater'
  | 'donut'
  | 'sausage'
  | 'scissors'
  | 'phone-heart'
  | 'picture-frame'
  | 'perfume';

function DecorSvg({
  name,
  className,
  style,
}: {
  name: DecorIconName;
  className?: string;
  style?: React.CSSProperties;
}) {
  const common = { viewBox: '0 0 48 48', fill: 'none', stroke: 'currentColor', className, style, 'aria-hidden': true };
  switch (name) {
    case 'card':
      return (
        <svg {...common} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="13" width="40" height="26" rx="4" />
          <rect x="10" y="20" width="9" height="7" rx="1.5" />
          <path d="M10 33 h9" />
          <path d="M23 33 h7" />
          <rect x="31" y="17" width="9" height="6" rx="1.5" />
        </svg>
      );
    case 'cocktail':
      return (
        <svg {...common} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 8 L24 26 L40 8 Z" />
          <path d="M24 26 V38" />
          <path d="M16 40 H32" />
          <circle cx="27" cy="14" r="2.2" />
          <path d="M27 11.5 L31 8" />
          <path d="M36 10 L31 6" />
          <path d="M36 10 L36 4" />
          <path d="M36 10 L41 6" />
          <path d="M31 6 Q36 2 41 6" />
          <path d="M36 10 L36 16" />
        </svg>
      );
    case 'shop':
      return (
        <svg {...common} strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 14 Q10 8 14 14 Q18 8 22 14 Q26 8 30 14 Q34 8 38 14" />
          <rect x="6" y="18" width="36" height="22" />
          <rect x="24" y="28" width="8" height="12" />
          <rect x="11" y="23" width="9" height="8" />
        </svg>
      );
    case 'location-pin':
      return (
        <svg {...common} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 4C15.16 4 8 11.16 8 20c0 12 16 24 16 24s16-12 16-24C40 11.16 32.84 4 24 4z" />
          <circle cx="24" cy="20" r="7" />
          <text x="24" y="24" textAnchor="middle" fontSize="10" fontWeight="700" stroke="none" fill="currentColor">
            £
          </text>
        </svg>
      );
    case 'heels':
      return (
        <svg {...common} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 30 C6 24 10 22 14 22 C18 22 20 18 24 10 C25 8 28 7 30 9 C32 11 31 14 28 17 C24 21 22 24 22 28 C22 31 19 33 15 33 L8 33 C6 33 6 31 6 30 Z" />
          <path d="M22 28 L27 43" />
        </svg>
      );
    case 'sweater':
      return (
        <svg {...common} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <rect x="18" y="6" width="12" height="7" rx="3.5" />
          <path d="M14 12 L34 12 L38 40 L10 40 Z" />
          <path d="M14 12 L4 17 L8 29 L16 24 Z" />
          <path d="M34 12 L44 17 L40 29 L32 24 Z" />
          <path d="M13 40 V37" />
          <path d="M19 40 V37" />
          <path d="M29 40 V37" />
          <path d="M35 40 V37" />
        </svg>
      );
    case 'donut':
      return (
        <svg {...common} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="24" cy="24" r="18" />
          <circle cx="24" cy="24" r="7" />
          <path d="M14 12 L17 15" />
          <path d="M32 12 L29 15" />
          <path d="M9 24 L13 24" />
          <path d="M39 24 L35 24" />
          <path d="M14 36 L17 33" />
          <path d="M32 36 L29 33" />
          <path d="M24 7 L24 11" />
          <path d="M24 41 L24 37" />
        </svg>
      );
    case 'sausage':
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 36 C2 28 4 14 16 10 C28 6 42 12 40 22 C38 30 28 34 20 34" strokeWidth={8} />
          <path d="M9 39 L11 33" strokeWidth={3} />
          <path d="M19 37 L21 31" strokeWidth={3} />
        </svg>
      );
    case 'scissors':
      return (
        <svg {...common} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 22 L10 6" />
          <path d="M24 22 L38 6" />
          <path d="M24 22 L14 34" />
          <path d="M24 22 L34 34" />
          <circle cx="12" cy="37" r="5" />
          <circle cx="36" cy="37" r="5" />
        </svg>
      );
    case 'phone-heart':
      return (
        <svg {...common} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <rect x="14" y="4" width="20" height="38" rx="4" />
          <path d="M21 8 H27" />
          <circle cx="24" cy="38" r="0.6" />
          <path d="M24 27 C21.5 21.5 15 23.5 15 28 C15 32.5 20.5 34.5 24 39 C27.5 34.5 33 32.5 33 28 C33 23.5 26.5 21.5 24 27 Z" />
          <path d="M31 10 V16" />
          <path d="M28 13 H34" />
        </svg>
      );
    case 'picture-frame':
      return (
        <svg {...common} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 14 L24 6 L30 14" />
          <rect x="8" y="14" width="32" height="28" />
          <rect x="13" y="19" width="22" height="18" />
        </svg>
      );
    case 'perfume':
      return (
        <svg {...common} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <rect x="19" y="4" width="10" height="6" rx="1" />
          <rect x="21" y="10" width="6" height="4" />
          <rect x="12" y="14" width="24" height="26" rx="3" />
          <rect x="17" y="24" width="14" height="7" rx="1" />
        </svg>
      );
  }
}

interface Placement {
  name: DecorIconName;
  top: string;
  side: 'left' | 'right';
  inset: string;
  size: string;
  rotate: number;
  tone: 'ink' | 'coral';
}

// Scattered down the page, alternating edges, sitting just outside the
// centered max-w-3xl/5xl section cards on wide viewports so a card's
// rounded corner "peeks" over part of the icon. `-z-10` keeps them behind
// every section (SectionBand's stacking cards start at z-index 10), and
// they only render at xl+ where a max-w-5xl card actually leaves margin
// to peek into — below that breakpoint a card can span edge to edge, so
// there's nowhere for them to peek from behind.
const PLACEMENTS: Placement[] = [
  { name: 'cocktail', top: '4%', side: 'left', inset: '1%', size: 'w-16', rotate: -10, tone: 'ink' },
  { name: 'shop', top: '11%', side: 'right', inset: '2%', size: 'w-20', rotate: 8, tone: 'coral' },
  { name: 'card', top: '19%', side: 'left', inset: '3%', size: 'w-14', rotate: 6, tone: 'ink' },
  { name: 'location-pin', top: '27%', side: 'right', inset: '1%', size: 'w-16', rotate: -7, tone: 'ink' },
  { name: 'heels', top: '35%', side: 'left', inset: '2%', size: 'w-14', rotate: 9, tone: 'coral' },
  { name: 'sweater', top: '43%', side: 'right', inset: '3%', size: 'w-20', rotate: -9, tone: 'ink' },
  { name: 'donut', top: '51%', side: 'left', inset: '1%', size: 'w-16', rotate: 7, tone: 'ink' },
  { name: 'sausage', top: '59%', side: 'right', inset: '2%', size: 'w-16', rotate: -6, tone: 'coral' },
  { name: 'scissors', top: '67%', side: 'left', inset: '3%', size: 'w-14', rotate: 5, tone: 'ink' },
  { name: 'phone-heart', top: '75%', side: 'right', inset: '1%', size: 'w-16', rotate: -5, tone: 'ink' },
  { name: 'picture-frame', top: '84%', side: 'left', inset: '2%', size: 'w-16', rotate: 8, tone: 'coral' },
  { name: 'perfume', top: '92%', side: 'right', inset: '3%', size: 'w-14', rotate: -8, tone: 'ink' },
];

export function DecorField() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden xl:block">
      {PLACEMENTS.map((p, i) => (
        <DecorSvg
          key={i}
          name={p.name}
          className={`absolute ${p.size} ${p.tone === 'coral' ? 'text-coral/25' : 'text-ink/10'}`}
          style={
            {
              top: p.top,
              [p.side]: p.inset,
              transform: `rotate(${p.rotate}deg)`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
