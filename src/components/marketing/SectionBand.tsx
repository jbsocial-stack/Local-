// Every section on the marketing site is a rounded, inset card sitting on
// the cream page background — coral/yellow/ink for colored cards, or a
// thin-bordered neutral card for everything else. `color="plain"` skips the
// card chrome entirely, for sections (like HowItWorks) that build their own
// smaller cards internally.
const CARD_STYLES: Record<string, string> = {
  coral: 'bg-coral text-cream',
  yellow: 'bg-accent-yellow text-ink',
  ink: 'bg-ink text-cream',
  card: 'border border-ink/10 bg-white/60 text-ink',
};

// Stacking cards (see `stackOrder` below) must be fully opaque — a
// translucent background lets whatever's scrolled underneath show through
// during the transition, which reads as a glitch rather than one card
// covering the next.
const STACK_CARD_STYLES: Record<string, string> = {
  ...CARD_STYLES,
  card: 'border border-ink/10 bg-cream text-ink',
};

export function SectionBand({
  index,
  children,
  className = '',
  id,
  color,
  stackOrder,
}: {
  index: number;
  children: React.ReactNode;
  className?: string;
  id?: string;
  color?: 'coral' | 'yellow' | 'ink' | 'card' | 'plain';
  /** Cards-stacking scroll effect: pass a sequential number (0, 1, 2…) on
      consecutive sections that should stack as the user scrolls past them;
      omit for sections that should scroll normally (Hero, HowItWorks,
      Footer). Implemented as `position: sticky` at a shared offset with an
      increasing z-index — no JS, degrades to normal flow under
      prefers-reduced-motion (see styles/brand.css). */
  stackOrder?: number;
}) {
  const resolved = color ?? (index % 2 === 0 ? 'coral' : 'card');

  if (resolved === 'plain') {
    return (
      <section id={id} className={`px-4 py-4 sm:px-6 ${className}`}>
        <div className="mx-auto max-w-5xl">{children}</div>
      </section>
    );
  }

  const stacking = stackOrder !== undefined;

  const card = (
    <div
      className={`mx-auto max-w-5xl rounded-3xl px-6 py-12 sm:px-10 sm:py-16 ${stacking ? 'shadow-xl' : ''} ${
        (stacking ? STACK_CARD_STYLES : CARD_STYLES)[resolved]
      }`}
    >
      {children}
    </div>
  );

  if (!stacking) {
    return (
      <section id={id} className={`px-4 py-4 sm:px-6 ${className}`}>
        {card}
      </section>
    );
  }

  // `stack-card-wrapper` gets a min-height of one full viewport (regardless
  // of how tall the card itself is) so the sticky card has real scroll
  // distance to sit still and fully cover the previous one before the next
  // section's wrapper starts feeding its own card in — without this, a
  // short card's wrapper ends (and unsticks) almost immediately, so the
  // next card starts sliding over before the current one has finished
  // covering the one before it.
  return (
    <section
      id={id}
      className={`stack-card-wrapper relative min-h-screen px-4 py-4 sm:px-6 ${className}`}
      style={{ zIndex: 10 + stackOrder }}
    >
      <div className="stack-card sticky top-20">{card}</div>
    </section>
  );
}
