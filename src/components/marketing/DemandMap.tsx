import { TOWNS } from '../../../config/towns';
import { buildDemandDots, topTowns, MAP_WIDTH, MAP_HEIGHT } from '@/lib/marketing/demand-map';
import { getDemandCounts } from '@/lib/marketing/get-demand-counts';
import { Eyebrow } from './Eyebrow';

// S10. Server Component: fetches the aggregate directly (see
// get-demand-counts.ts) rather than round-tripping through /api/demand,
// which exists for any future client-side refresh.
export async function DemandMap() {
  const counts = await getDemandCounts();
  const dots = buildDemandDots(counts, TOWNS);
  const top10 = topTowns(counts, TOWNS);

  return (
    <div>
      <Eyebrow>Where next</Eyebrow>
      <h2 className="mt-2 font-display text-3xl">Coming to your town?</h2>
      <p className="mt-2 text-lg font-medium text-ink/70">
        We launch where you tell us to. Sign up and pick your town.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TOWNS.map((t) => (
          <span
            key={t.slug}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              t.status === 'live' ? 'bg-coral/15 text-coral' : 'bg-ink/5 text-ink/70'
            }`}
          >
            {t.name}
          </span>
        ))}
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[2fr_1fr]">
        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="w-full rounded-xl bg-ink/5" role="img" aria-label="Map of sign-up demand across the UK">
          {/* Simplified, stylised GB outline — not survey-accurate, purely
              a backdrop for the dots. */}
          <path
            d="M120 20 L180 10 L220 60 L260 40 L300 90 L280 150 L320 200 L290 260 L310 320
               L270 380 L290 440 L250 500 L220 560 L180 590 L150 560 L160 500 L120 460
               L140 400 L100 350 L130 300 L90 250 L110 200 L80 150 L100 100 Z"
            fill="none"
            stroke="var(--ink, #2b2b2b)"
            strokeOpacity="0.2"
            strokeWidth="2"
          />
          {dots.map((dot) => (
            <g key={dot.slug}>
              <circle
                cx={dot.x}
                cy={dot.y}
                r={dot.radius}
                fill={dot.live ? 'var(--yellow, #ffd400)' : 'var(--coral, #f76c5e)'}
                fillOpacity="0.85"
              />
              <title>
                {dot.name}: {dot.count} sign-ups
              </title>
            </g>
          ))}
        </svg>

        <ol className="space-y-1">
          {top10.map((t, i) => (
            <li key={t.name} className="flex justify-between border-b border-ink/10 py-1.5 text-sm">
              <span>
                {i + 1}. {t.name}
              </span>
              <span className="font-semibold">{t.count}</span>
            </li>
          ))}
          {top10.length === 0 && <li className="text-sm text-ink/60">No sign-ups yet — be the first.</li>}
        </ol>
      </div>
    </div>
  );
}
