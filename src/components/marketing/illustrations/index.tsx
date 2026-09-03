// §4 illustration set: flat, single-colour coral silhouettes of everyday
// shop items, used in the hero and as section dividers. Only the six items
// the copy explicitly calls out for the hero are built here — the full
// 24-item set from the spec is a straightforward follow-up (same pattern,
// more SVGs) and isn't required by any P0 requirement.
export type IllustrationProps = { className?: string };

export function HeelIcon({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <path d="M10 44c8-2 14-6 20-14 4-6 7-11 13-13 4-1 8 0 9 4 1 3-1 5-1 8 0 4 3 6 7 7 3 1 4 3 3 5-1 3-6 4-10 4H16c-4 0-7-1-6-1z" />
    </svg>
  );
}

export function MartiniIcon({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 10h48L34 34v18h10v4H20v-4h10V34L8 10z" />
      <circle cx="24" cy="16" r="3" />
    </svg>
  );
}

export function CoffeeCupIcon({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 22h32v18a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10V22z" />
      <path d="M44 26h4a7 7 0 0 1 0 14h-4v-6h4a1 1 0 0 0 0-2h-4v-6z" />
      <path d="M20 8c0 3 3 3 3 6s-3 3-3 6M28 8c0 3 3 3 3 6s-3 3-3 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function ChopsticksIcon({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <rect x="8" y="46" width="52" height="4" rx="2" transform="rotate(-18 34 48)" />
      <rect x="8" y="38" width="52" height="4" rx="2" transform="rotate(-24 34 40)" />
    </svg>
  );
}

export function DumplingIcon({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 36c0-12 11-20 24-20s24 8 24 20-11 14-24 14S8 48 8 36z" />
      <path
        d="M20 22c2 3 2 6 0 9M28 18c2 3 2 6 0 9M36 18c2 3 2 6 0 9M44 22c2 3 2 6 0 9"
        stroke="var(--pleat, #fff9e6)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LemonSliceIcon({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="24" />
      <g stroke="var(--pith, #fff9e6)" strokeWidth="2">
        <circle cx="32" cy="32" r="18" fill="none" />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x = 32 + Math.cos(angle) * 18;
          const y = 32 + Math.sin(angle) * 18;
          return <line key={i} x1="32" y1="32" x2={x} y2={y} />;
        })}
      </g>
    </svg>
  );
}

export const HERO_ILLUSTRATIONS = [
  { Icon: HeelIcon, points: 12 },
  { Icon: MartiniIcon, points: 24 },
  { Icon: CoffeeCupIcon, points: 8 },
  { Icon: ChopsticksIcon, points: 18 },
  { Icon: DumplingIcon, points: 15 },
  { Icon: LemonSliceIcon, points: 30 },
] as const;
