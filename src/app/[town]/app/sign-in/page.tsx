'use client';

import { useParams } from 'next/navigation';
import { MagicLinkForm } from '@/components/MagicLinkForm';
import { PasswordSignInForm } from '@/components/shopper/PasswordSignInForm';

export default function ShopperSignInPage() {
  const params = useParams<{ town: string }>();
  const redirectTo =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}/auth/callback?next=/${params.town}/app/wallet`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12">
      <PasswordSignInForm
        title="Sign in to Local"
        subtitle="Use the password you set."
        redirectTo={`/${params.town}/app/wallet`}
      />
      <div className="flex w-full max-w-sm items-center gap-3 text-xs text-ink/40">
        <span className="h-px flex-1 bg-ink/10" />
        or
        <span className="h-px flex-1 bg-ink/10" />
      </div>
      <MagicLinkForm
        title="No password yet?"
        subtitle="We'll email you a sign-in link instead."
        redirectTo={redirectTo}
      />
    </main>
  );
}
