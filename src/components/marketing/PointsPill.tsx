// §4: "yellow, rotates ±6°" — attached to illustrations and used standalone
// for point-value callouts ("+48 points").
export function PointsPill({
  points,
  rotate = 0,
  className = '',
}: {
  points: number;
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-full bg-accent-yellow px-3 py-1 text-xs font-bold text-ink ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      +{points} points
    </span>
  );
}
