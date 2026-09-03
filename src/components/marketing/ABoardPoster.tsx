import { PointsPill } from './PointsPill';
import { HERO_ILLUSTRATIONS, type IllustrationProps } from './illustrations';

export interface PosterItem {
  Icon: (props: IllustrationProps) => React.ReactElement;
  points: number;
}

// §4 motif: "the A-board poster: cream card with stacked display text and
// scattered items." The hero visual and the template for printables (R12
// in the product PRD already generates real posters — this is the marketing
// site's illustrated stand-in for the same idea).
export function ABoardPoster({
  headlineLines,
  items = [...HERO_ILLUSTRATIONS],
}: {
  headlineLines: string[];
  items?: readonly PosterItem[];
}) {
  const positions = [
    { top: '4%', left: '58%', rotate: -8 },
    { top: '20%', left: '8%', rotate: 6 },
    { top: '42%', left: '68%', rotate: 10 },
    { top: '58%', left: '4%', rotate: -6 },
    { top: '74%', left: '52%', rotate: 4 },
    { top: '2%', left: '20%', rotate: -12 },
  ];

  return (
    <div className="relative aspect-[4/5] w-full max-w-sm rounded-2xl bg-cream p-8 shadow-xl">
      <div className="font-display text-4xl leading-[0.95] text-coral">
        {headlineLines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
      {items.map(({ Icon, points }, i) => {
        const pos = positions[i % positions.length]!;
        return (
          <div
            key={i}
            className="float-in absolute"
            style={
              {
                top: pos.top,
                left: pos.left,
                '--float-rotate': `${pos.rotate}deg`,
                '--float-delay': `${i * 80}ms`,
                transform: `rotate(${pos.rotate}deg)`,
              } as React.CSSProperties
            }
          >
            <Icon className="h-10 w-10 text-coral" />
            <PointsPill points={points} rotate={-pos.rotate} className="mt-1 block w-max" />
          </div>
        );
      })}
    </div>
  );
}
