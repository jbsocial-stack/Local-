import { redirect } from 'next/navigation';
import { requireShopper } from '@/lib/auth/require-shopper';
import { createServiceClient } from '@/lib/supabase/server';
import { NoPassMessage } from '@/components/shopper/NoPassMessage';
import { ProfileForm } from './ProfileForm';

export default async function ProfilePage({ params }: { params: Promise<{ town: string }> }) {
  const { town } = await params;
  const auth = await requireShopper(town);
  if (!auth.ok) {
    if (auth.reason === 'not_signed_in') redirect(`/${town}/app/sign-in`);
    return <NoPassMessage town={town} />;
  }

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, email, phone, avatar_url')
    .eq('id', auth.userId)
    .single();

  return (
    <main className="px-4 pt-10">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-2xl">Profile</h1>
        <ProfileForm
          town={town}
          initial={{
            displayName: profile?.display_name ?? '',
            email: profile?.email ?? '',
            phone: profile?.phone ?? '',
            avatarUrl: profile?.avatar_url ?? null,
          }}
        />
      </div>
    </main>
  );
}
