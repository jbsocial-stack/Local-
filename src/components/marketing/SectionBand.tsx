// §4 rule: "sections alternate coral / cream, never white." `index` is the
// section's position in the page so callers never have to track parity
// themselves — just number sections 0, 1, 2... in document order.
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
  /** Override the alternating pattern — e.g. S3 explicitly "continues" S2's cream. */
  color?: 'coral' | 'cream';
}) {
  const coral = color ? color === 'coral' : index % 2 === 0;
  return (
    <section
      id={id}
      className={`${coral ? 'bg-coral text-cream' : 'bg-cream text-ink'} px-6 py-16 ${className}`}
    >
      <div className="mx-auto max-w-5xl">{children}</div>
    </section>
  );
}
