'use client';

import { useParams } from 'next/navigation';
import { PasswordSignInForm } from '@/components/shopper/PasswordSignInForm';

export default function ShopperSignInPage() {
  const params = useParams<{ town: string }>();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-ink/10 bg-white/60 px-6 py-10">
        <PasswordSignInForm
          title="Sign in to Regulars"
          subtitle="Use the password you set."
          redirectTo={`/${params.town}/app/wallet`}
        />
      </div>
    </main>
  );
}
