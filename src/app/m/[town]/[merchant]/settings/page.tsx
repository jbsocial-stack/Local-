import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/require-owner';
import { SettingsForm } from './SettingsForm';

export default async function MerchantSettingsPage({
  params,
}: {
  params: Promise<{ town: string; merchant: string }>;
}) {
  const { town, merchant: merchantSlug } = await params;
  const supabase = createServiceClient();

  const { data: townRow } = await supabase.from('towns').select('id').eq('slug', town).maybeSingle();
  if (!townRow) redirect('/');

  const { data: merchant } = await supabase
    .from('merchants')
    .select('*')
    .eq('town_id', townRow.id)
    .eq('slug', merchantSlug)
    .maybeSingle();
  if (!merchant) redirect('/');

  const auth = await requireOwner(merchant.id);
  if (!auth.ok) redirect(`/m/${town}/${merchantSlug}/owner-login`);

  const [{ data: boosts }, { data: staff }, { data: photos }, { data: sumupConnection }] = await Promise.all([
    supabase
      .from('merchant_boosts')
      .select('*')
      .eq('merchant_id', merchant.id)
      .order('starts_at', { ascending: true }),
    supabase
      .from('merchant_users')
      .select('id, name, role, email')
      .eq('merchant_id', merchant.id)
      .order('role', { ascending: true }),
    supabase.from('merchant_photos').select('*').eq('merchant_id', merchant.id).order('position'),
    supabase
      .from('merchant_sumup_connections')
      .select('sumup_merchant_code')
      .eq('merchant_id', merchant.id)
      .maybeSingle(),
  ]);

  return (
    <main className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-bold text-ink">{merchant.name} — settings</h1>
        <SettingsForm
          merchant={merchant}
          boosts={boosts ?? []}
          staff={staff ?? []}
          photos={photos ?? []}
          sumupConnected={!!sumupConnection}
        />
      </div>
    </main>
  );
}
