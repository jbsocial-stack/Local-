import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — Local',
  description: 'Why Local started in Chichester, and why now.',
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/50">Why we started here</p>
      <h1 className="mt-2 font-display text-3xl">One high street. Then the next one on the list.</h1>

      <p className="mt-6 text-ink/80">
        Local isn&apos;t a national rollout with Chichester as stop one — it&apos;s the other way round.
        Our founder lives in Chichester, so that&apos;s the high street we built this for first: the café
        that remembers your order, the bookshop owner who&apos;ll order in the title you asked about last
        month. We wanted to prove this works somewhere we could feel it working, not just read it in a
        dashboard.
      </p>

      <h2 className="mt-10 font-display text-2xl">Why now</h2>
      <p className="mt-4 text-ink/80">
        There&apos;s also a policy window. Government business rates reform is bringing in permanently
        lower multipliers for retail, hospitality, and leisure premises, paid for by a higher rate on the
        most valuable properties — aimed at stopping the high street being taxed out of existence. Councils
        also have new &ldquo;high street rental auction&rdquo; powers, introduced under the Levelling-up and
        Regeneration Act, to force persistently empty shops back into use instead of sitting vacant for
        years.
      </p>
      <p className="mt-4 text-ink/80">
        Both are aimed at supply — making it cheaper and more possible to run a shop on a high street.
        Neither puts a single extra customer through the door. That&apos;s the gap we think is left once the
        reforms do their job: someone still has to give people a reason to choose the shop on their street
        over the app on their phone. That&apos;s what Local is for.
      </p>

      <h2 className="mt-10 font-display text-2xl">Why Chichester first</h2>
      <p className="mt-4 text-ink/80">
        Every town on our waiting list is real interest, not a guess — you can see it on the map on the
        homepage. But you can only start in one place, and it made sense to start where our founder can
        walk into every shop on the list in an afternoon and fix a problem in person, not over a support
        ticket. Once it&apos;s working here — properly, for the shopkeepers as much as the shoppers —
        we&apos;ll take the same playbook to whichever town asks for it loudest next.
      </p>

      <h2 className="mt-10 font-display text-2xl">500 passes, to start</h2>
      <p className="mt-4 text-ink/80">
        We&apos;re deliberately starting small: the first 500 passes in each town, so we can get this right
        before it&apos;s everywhere. If your town isn&apos;t live yet, join the waitlist and refer friends —
        it&apos;s the only way to move up it.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/shoppers" className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream">
          Join the waitlist
        </Link>
        <Link href="/business" className="rounded-full border border-ink/20 px-6 py-3 text-sm font-medium text-ink">
          Bring your shop in
        </Link>
      </div>
    </main>
  );
}
