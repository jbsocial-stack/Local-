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

export function SectionBand({
  index,
  children,
  className = '',
  id,
  color,
}: {
  index: number;
  children: React.ReactNode;
  className?: string;
  id?: string;
  color?: 'coral' | 'yellow' | 'ink' | 'card' | 'plain';
}) {
  const resolved = color ?? (index % 2 === 0 ? 'coral' : 'card');

  if (resolved === 'plain') {
    return (
      <section id={id} className={`px-4 py-4 sm:px-6 ${className}`}>
        <div className="mx-auto max-w-5xl">{children}</div>
      </section>
    );
  }

  return (
    <section id={id} className={`px-4 py-4 sm:px-6 ${className}`}>
      <div className={`mx-auto max-w-5xl rounded-3xl px-6 py-12 sm:px-10 sm:py-16 ${CARD_STYLES[resolved]}`}>
        {children}
      </div>
    </section>
  );
}
