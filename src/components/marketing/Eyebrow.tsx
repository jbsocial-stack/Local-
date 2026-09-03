// Small-caps label used above headings across the redesigned marketing
// site and shopper app ("WHERE NEXT", "FOR INDEPENDENT SHOPS", etc).
export function Eyebrow({
  children,
  tone = 'ink',
}: {
  children: React.ReactNode;
  tone?: 'ink' | 'cream';
}) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-[0.15em] ${
        tone === 'cream' ? 'text-cream/60' : 'text-ink/45'
      }`}
    >
      {children}
    </p>
  );
}
