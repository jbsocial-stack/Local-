'use client';

import { useParams } from 'next/navigation';
import { MagicLinkForm } from '@/components/MagicLinkForm';

export default function ShopperSignInPage() {
  const params = useParams<{ town: string }>();
  const redirectTo =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}/auth/callback?next=/${params.town}/app/wallet`;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <MagicLinkForm
        title="Sign in to Local"
        subtitle="Use the email you claimed your pass with."
        redirectTo={redirectTo}
      />
    </main>
  );
}
