import { TOWNS } from '../../../config/towns';
import { topTowns } from '@/lib/marketing/demand-map';
import { getDemandCounts } from '@/lib/marketing/get-demand-counts';
import { Eyebrow } from './Eyebrow';

// S10. Server Component: fetches the aggregate directly (see
// get-demand-counts.ts) rather than round-tripping through /api/demand,
// which exists for any future client-side refresh.
export async function DemandMap() {
  const counts = await getDemandCounts();
  const top10 = topTowns(counts, TOWNS);

  return (
    <div>
      <Eyebrow>Where next</Eyebrow>
      <h2 className="mt-2 font-display text-3xl">Coming to your town?</h2>
      <p className="mt-2 text-lg font-medium text-ink-muted">
        We launch where you tell us to. Sign up and pick your town.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TOWNS.map((t) => (
          <span
            key={t.slug}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              t.status === 'live' ? 'bg-coral-soft text-coral' : 'bg-line text-ink-muted'
            }`}
          >
            {t.name}
          </span>
        ))}
      </div>

      <ol className="mt-8 max-w-sm space-y-1">
        {top10.map((t, i) => (
          <li key={t.name} className="flex justify-between border-b border-line py-1.5 text-sm">
            <span>
              {i + 1}. {t.name}
            </span>
            <span className="font-semibold">{t.count}</span>
          </li>
        ))}
        {top10.length === 0 && <li className="text-sm text-ink-muted">No sign-ups yet — be the first.</li>}
      </ol>
    </div>
  );
}
