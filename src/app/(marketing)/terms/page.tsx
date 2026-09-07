import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms — Regulars',
  description: "Regulars' terms for shoppers and merchants.",
};

// H11: "terms... placeholder copy flagged for review."
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <p className="mb-6 rounded-lg bg-coral/15 px-4 py-3 text-sm">
        <strong>Placeholder — flagged for legal review</strong> before launch (PRD open question #4).
      </p>
      <h1 className="font-display text-3xl">Terms</h1>
      <p className="mt-4 text-ink/80">
        Regulars is free for shoppers, forever. 1 point = 1p, redeemable at any participating
        merchant. Points expire 12 months after they&apos;re earned. We can pause or remove a
        merchant from the scheme at any time; points already earned there stay valid to spend
        elsewhere in the scheme.
      </p>
      <p className="mt-4 text-ink/80">
        Merchant accounts are billed per the pricing shown on this site at the time you sign up,
        via a separate agreement sent when your trial is booked.
      </p>
      <p className="mt-4 text-ink/80">
        Questions? Email{' '}
        <a href="mailto:hello@regulars.app" className="underline">
          hello@regulars.app
        </a>
        .
      </p>
    </main>
  );
}
