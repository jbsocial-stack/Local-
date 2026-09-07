// Every section on the marketing site is a rounded, inset card sitting on
// the cream page background — coral/ink for colored cards, or a
// thin-bordered neutral card for everything else. `color="plain"` skips the
// card chrome entirely, for sections (like HowItWorks) that build their own
// smaller cards internally.
const CARD_STYLES: Record<string, string> = {
  coral: 'bg-coral text-cream',
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
  color?: 'coral' | 'ink' | 'card' | 'plain';
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

  // While stacking, the card itself fills the viewport (from the sticky
  // offset down) and centers its own content — that's what keeps the
  // "stack" continuous, with the next card sliding straight in to fully
  // replace this one and no blank page background ever showing between
  // them. A short card that just hugged its own content would leave a gap
  // below it for the rest of the dwell scroll, which reads as the stack
  // breaking rather than continuing. `dvh` (not `vh`) so this doesn't
  // undershoot the real visible viewport on mobile browsers whose address
  // bar shows/hides as you scroll.
  const card = (
    <div
      className={`stack-card-fill mx-auto max-w-5xl rounded-3xl px-6 py-12 sm:px-10 sm:py-16 ${
        stacking ? 'flex min-h-[calc(100dvh-5rem)] flex-col justify-center shadow-xl' : ''
      } ${(stacking ? STACK_CARD_STYLES : CARD_STYLES)[resolved]}`}
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

  // A `position: sticky` element only stays pinned for as much extra
  // scroll distance as its containing block (this wrapper) has *beyond*
  // the element's own offset + height — here, exactly one viewport
  // (`top-20` + the card's `100dvh - 5rem` = 100dvh). A wrapper that's
  // only `min-h-screen` gives it none: the card is never actually stuck,
  // it just flows past at normal scroll speed like any other section, so
  // nothing visibly stacks. `180dvh` gives it real room — 80dvh of dwell,
  // during which the card stays pinned and fully covers the previous one
  // — before the next section's wrapper starts feeding its own card in.
  return (
    <section
      id={id}
      className={`stack-card-wrapper relative min-h-[180dvh] px-4 py-4 sm:px-6 ${className}`}
      style={{ zIndex: 10 + stackOrder }}
    >
      <div className="stack-card sticky top-20">{card}</div>
    </section>
  );
}
