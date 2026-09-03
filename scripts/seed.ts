// Phase A seed: chichester town + 3 friendly merchants for the first test cohort.
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

  const merchants = [
    {
      name: 'The Roastery',
      slug: 'the-roastery',
      category: 'Coffee',
      address: '12 East Street, Chichester PO19 1HA',
      lat: 50.8365,
      lng: -0.7792,
      base_multiplier: 2,
      status: 'live' as const,
    },
    {
      name: 'Chichester Book Co.',
      slug: 'chichester-book-co',
      category: 'Books',
      address: '4 South Street, Chichester PO19 1EL',
      lat: 50.8358,
      lng: -0.7785,
      base_multiplier: 1,
      status: 'live' as const,
    },
    {
      name: 'Cathedral Deli',
      slug: 'cathedral-deli',
      category: 'Food',
      address: '9 West Street, Chichester PO19 1RP',
      lat: 50.8373,
      lng: -0.7811,
      base_multiplier: 1,
      status: 'live' as const,
    },
  ];

  for (const merchant of merchants) {
    const { data: row, error } = await supabase
      .from('merchants')
      .upsert({ ...merchant, town_id: town.id }, { onConflict: 'town_id,slug' })
      .select()
      .single();
    if (error || !row) throw error ?? new Error(`Failed to upsert ${merchant.name}`);

    await supabase.from('merchant_users').upsert(
      {
        merchant_id: row.id,
        role: 'owner',
        name: `${merchant.name} owner`,
      },
      { onConflict: 'id' },
    );
    console.log(`Seeded merchant: ${merchant.name}`);
  }

  console.log(`Seeded town: ${town.name} (${town.id})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
