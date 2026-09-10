// Every section on the marketing site is a rounded, inset card sitting on
// the cream page background — coral/ink for colored cards, or a paper
// neutral card for everything else (design system: cards get no border,
// just the one step up from cream to paper). `color="plain"` skips the
// card chrome entirely, for sections (like HowItWorks) that build their
// own smaller cards internally.
const CARD_STYLES: Record<string, string> = {
  coral: 'bg-coral text-cream',
  ink: 'bg-ink text-cream',
  card: 'bg-paper text-ink',
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
  color?: 'coral' | 'ink' | 'card' | 'plain';
}) {
  const resolved = color ?? (index % 2 === 0 ? 'ink' : 'card');

  if (resolved === 'plain') {
    return (
      <section id={id} className={`px-4 py-4 sm:px-6 ${className}`}>
        <div className="mx-auto max-w-5xl">{children}</div>
      </section>
    );
  }

  return (
    <section id={id} className={`px-4 py-4 sm:px-6 ${className}`}>
      <div className={`mx-auto max-w-5xl rounded-[28px] px-6 py-12 sm:px-10 sm:py-16 ${CARD_STYLES[resolved]}`}>
        {children}
      </div>
    </section>
  );
}
