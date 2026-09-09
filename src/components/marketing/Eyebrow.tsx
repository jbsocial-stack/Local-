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
      className={`text-[11px] font-medium uppercase tracking-[0.14em] ${
        tone === 'cream' ? 'text-cream-muted' : 'text-ink-muted'
      }`}
    >
      {children}
    </p>
  );
}
