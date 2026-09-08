// Phase A seed: the chichester town row. Real merchants are onboarded
// through /business and the ops console, not seeded fake data.
// Run with `npm run seed` (requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
import { createServiceClient } from '../src/lib/supabase/server';

async function main() {
  const supabase = createServiceClient();

  const { data: town, error: townError } = await supabase
    .from('towns')
    .upsert(
      {
        slug: 'chichester',
        name: 'Chichester',
        point_value_pence: 1,
        base_points: 1,
        expiry_months: 12,
      },
      { onConflict: 'slug' },
    )
    .select()
    .single();

  if (townError || !town) {
    throw townError ?? new Error('Failed to upsert Chichester');
  }

  console.log(`Seeded town: ${town.name} (${town.id})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
