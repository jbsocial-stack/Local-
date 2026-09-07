import { notFound, redirect } from 'next/navigation';
import { requireShopper } from '@/lib/auth/require-shopper';
import { createServiceClient } from '@/lib/supabase/server';
import { resolveActiveMultiplier } from '@/lib/ledger/multiplier';
import { computeVenueRelationship } from '@/lib/ledger/venue-relationship';
import { NoPassMessage } from '@/components/shopper/NoPassMessage';
import { LikeButton } from '@/components/shopper/LikeButton';

const VISIT_LABEL: Record<string, string> = {
  earn: 'You earned',
  redeem: 'You spent',
  mission: 'Bonus',
};

const FIRST_VISIT_FORMAT: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
const VISIT_DATE_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter / X',
  website: 'Website',
};

export default async function VenuePage({
  params,
}: {
  params: Promise<{ town: string; merchant: string }>;
}) {
  const { town, merchant: merchantSlug } = await params;
  const auth = await requireShopper(town);
  if (!auth.ok) {
    if (auth.reason === 'not_signed_in') redirect(`/${town}/app/sign-in`);
    return <NoPassMessage town={town} />;
  }

  const supabase = createServiceClient();
  const { data: townRow } = await supabase.from('towns').select('id').eq('slug', town).maybeSingle();
  if (!townRow) notFound();

  const { data: merchant } = await supabase
    .from('merchants')
    .select('*')
    .eq('town_id', townRow.id)
    .eq('slug', merchantSlug)
    .eq('status', 'live')
    .maybeSingle();
  if (!merchant) notFound();

  const [{ data: photos }, { data: boosts }, { count: likeCount }, { data: myLike }, { data: visitRows }] =
    await Promise.all([
      supabase.from('merchant_photos').select('id, url').eq('merchant_id', merchant.id).order('position'),
      supabase.from('merchant_boosts').select('multiplier, starts_at, ends_at, label').eq('merchant_id', merchant.id),
      supabase.from('merchant_likes').select('id', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
      supabase
        .from('merchant_likes')
        .select('id')
        .eq('merchant_id', merchant.id)
        .eq('user_id', auth.userId)
        .maybeSingle(),
      supabase
        .from('ledger')
        .select('type, points, created_at')
        .eq('pass_id', auth.pass.id)
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false }),
    ]);

  const now = new Date();
  const activeMultiplier = resolveActiveMultiplier(merchant.base_multiplier, boosts ?? [], now);
  const activeBoosts = (boosts ?? []).filter((b) => new Date(b.starts_at) <= now && now < new Date(b.ends_at));
  const socialLinks = Object.entries((merchant.social_links as Record<string, string>) ?? {}).filter(([, v]) => v);
  const relationship = computeVenueRelationship(visitRows ?? []);

  return (
    <main className="pb-4">
      <Gallery photos={photos ?? []} fallback={merchant.photo_url} name={merchant.name} />

      <div className="px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl">{merchant.name}</h1>
            <p className="text-sm text-ink/60">
              {merchant.category} · {merchant.address}
            </p>
          </div>
          <LikeButton merchantId={merchant.id} initialLiked={!!myLike} initialCount={likeCount ?? 0} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-coral/15 px-3 py-1 text-xs font-semibold text-coral">
            {activeMultiplier}x points
          </span>
          {activeMultiplier > merchant.base_multiplier && (
            <span className="rounded-full bg-coral px-3 py-1 text-xs font-semibold text-cream">Boosted now</span>
          )}
        </div>

        {merchant.description && <p className="mt-4 text-ink/80">{merchant.description}</p>}

        <YourStory relationship={relationship} merchantName={merchant.name} visitRows={visitRows ?? []} />

        {activeBoosts.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Current offers</h2>
            <ul className="mt-2 space-y-2">
              {activeBoosts.map((b, i) => (
                <li key={i} className="rounded-2xl border border-ink/10 bg-white/70 p-3">
                  <p className="font-medium">{b.label || `${b.multiplier}x points`}</p>
                  <p className="text-xs text-ink/50">
                    Until {new Date(b.ends_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {socialLinks.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Find them</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {socialLinks.map(([key, url]) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-ink/20 px-4 py-1.5 text-sm"
                >
                  {SOCIAL_LABELS[key] ?? key}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

// R8-adjacent: this is deliberately framed as a relationship ("your
// story here"), not a transaction ledger — that's what the wallet page's
// Activity list already is, town-wide. Redemptions can happen anywhere in
// the scheme, so only `earn` rows count as a visit to *this* venue.
function YourStory({
  relationship,
  merchantName,
  visitRows,
}: {
  relationship: ReturnType<typeof computeVenueRelationship>;
  merchantName: string;
  visitRows: { type: string; points: number; created_at: string }[];
}) {
  if (relationship.visits === 0) {
    return (
      <section className="mt-6 rounded-2xl border border-ink/10 bg-white/70 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Your story here</h2>
        <p className="mt-2 text-sm text-ink/70">
          You haven&apos;t earned points at {merchantName} yet — tap your pass here to start.
        </p>
      </section>
    );
  }

  const since = relationship.firstVisitAt
    ? new Date(relationship.firstVisitAt).toLocaleDateString('en-GB', FIRST_VISIT_FORMAT)
    : null;
  const visits = visitRows.filter((r) => r.type === 'earn' || r.type === 'redeem').slice(0, 10);

  return (
    <section className="mt-6 rounded-2xl border border-ink/10 bg-white/70 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Your story here</h2>
      {since && <p className="mt-1 text-sm text-ink/70">A regular since {since}.</p>}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-cream px-4 py-3">
          <p className="font-display text-2xl">{relationship.visits}</p>
          <p className="text-xs text-ink/60">{relationship.visits === 1 ? 'visit' : 'visits'}</p>
        </div>
        <div className="rounded-xl bg-cream px-4 py-3">
          <p className="font-display text-2xl">{relationship.pointsEarned}</p>
          <p className="text-xs text-ink/60">points earned here</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {visits.map((row, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="text-ink/70">
              {VISIT_LABEL[row.type] ?? row.type} {Math.abs(row.points)} points
            </span>
            <span className="text-ink/40">
              {new Date(row.created_at).toLocaleDateString('en-GB', VISIT_DATE_FORMAT)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Gallery({
  photos,
  fallback,
  name,
}: {
  photos: { id: string; url: string }[];
  fallback: string | null;
  name: string;
}) {
  const images = photos.length > 0 ? photos.map((p) => p.url) : fallback ? [fallback] : [];
  if (images.length === 0) {
    return <div className="h-48 w-full bg-coral/20" />;
  }
  return (
    <div className="flex h-56 gap-1 overflow-x-auto">
      {images.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={url} alt={name} className="h-full w-full flex-shrink-0 snap-center object-cover" />
      ))}
    </div>
  );
}
