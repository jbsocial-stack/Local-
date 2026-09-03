'use client';

import { MagicLinkForm } from '@/components/MagicLinkForm';

export function ReissueSignIn({ town }: { town: string }) {
  const redirectTo =
    typeof window === 'undefined' ? '' : `${window.location.origin}/auth/callback?next=/${town}/reissue`;

  return (
    <MagicLinkForm
      title="Get your pass on this phone"
      subtitle="Sign in with the email you claimed your account with."
      redirectTo={redirectTo}
    />
  );
}
