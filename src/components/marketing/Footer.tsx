const LINKS = [
  { label: 'Shoppers', href: '/shoppers' },
  { label: 'Businesses', href: '/business' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About us', href: '/about' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: 'mailto:hello@regulars.app' },
];

export function Footer() {
  return (
    <footer className="bg-cream px-6 py-10 text-ink">
      <div className="mx-auto max-w-5xl">
        <p className="font-logo uppercase text-2xl text-coral">Regulars</p>
        <p className="mt-1 text-ink/70">Get Regular. Eat, shop and earn points in your town.</p>

        <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="underline underline-offset-2">
              {l.label}
            </a>
          ))}
        </nav>

        {/* H11: legal placeholders flagged for review — see Q4 in the PRD's open questions. */}
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted">
          Regulars [company name TBD] · Company number TBD, registered in England &amp; Wales · ICO
          registration TBD.
        </p>
      </div>
    </footer>
  );
}
