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
  const stickyStyle: React.CSSProperties | undefined = stacking
    ? { position: 'sticky', top: '5rem', zIndex: 10 + stackOrder }
    : undefined;

  return (
    <section
      id={id}
      style={stickyStyle}
      className={`${stacking ? 'stack-card' : ''} px-4 py-4 sm:px-6 ${className}`}
    >
      <div
        className={`mx-auto max-w-5xl rounded-3xl px-6 py-12 sm:px-10 sm:py-16 ${stacking ? 'shadow-xl' : ''} ${
          (stacking ? STACK_CARD_STYLES : CARD_STYLES)[resolved]
        }`}
      >
        {children}
      </div>
    </section>
  );
}
