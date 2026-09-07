// Numbered circle used in "how it works"-style step lists, rotating
// through the three accent colors so a sequence of steps reads as a set.
const COLORS = ['bg-coral/30 text-ink', 'bg-coral text-cream', 'bg-ink text-cream'];

export function StepBadge({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full font-display text-lg ${
        COLORS[index % COLORS.length]
      }`}
    >
      {children}
    </span>
  );
}
