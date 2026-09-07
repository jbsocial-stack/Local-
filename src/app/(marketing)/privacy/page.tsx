import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy — Regulars',
  description: 'How Regulars collects, uses, and protects your data.',
};

// H11: "privacy policy... placeholder copy flagged for review." Implemented
// as a plain page rather than MDX (no functional difference for static
// text — MDX would only matter if non-engineers needed to edit copy
// directly in the repo, which isn't blocking anything here).
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <p className="mb-6 rounded-lg bg-coral/15 px-4 py-3 text-sm">
        <strong>Placeholder — flagged for legal review</strong> before launch (PRD open question #4:
        company entity, ICO registration, and privacy policy author still TBD).
      </p>
      <h1 className="font-display text-3xl">Privacy policy</h1>
      <p className="mt-4 text-ink/80">
        Regulars collects the information you give us when you sign up (email, town, optional
        postcode) and, once you claim a pass, your loyalty activity with participating merchants.
        We use it to run the scheme, tell you when your town goes live, and — only if you&apos;ve
        opted in — send you occasional updates. We never sell your data.
      </p>
      <p className="mt-4 text-ink/80">
        Merchants see aggregate and per-visit activity for their own shop only. Ops and support
        staff can look up your account to help with a lost pass or a mistaken charge.
      </p>
      <p className="mt-4 text-ink/80">
        To ask what we hold on you, or to have it deleted, email{' '}
        <a href="mailto:hello@regulars.app" className="underline">
          hello@regulars.app
        </a>
        .
      </p>
    </main>
  );
}
