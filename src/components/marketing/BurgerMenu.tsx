'use client';

import { useState } from 'react';
import Link from 'next/link';

const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'For shoppers', href: '/shoppers' },
  { label: 'For businesses', href: '/business' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About us', href: '/about' },
];

// Site-wide nav — the marketing site is now split across a few real pages
// (/, /shoppers, /business) rather than one long page of anchors, so this
// is how you get between them from anywhere, including on mobile where the
// header only has room for the logo and a sign-in button.
export function BurgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-ink/40" onClick={() => setOpen(false)}>
          <nav
            aria-label="Site"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto flex h-full w-72 max-w-[85%] flex-col gap-1 bg-cream px-6 py-6 shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-xl text-ink">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-lg font-medium text-ink hover:bg-ink/5"
              >
                {l.label}
              </Link>
            ))}

            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="mt-4 rounded-full bg-ink px-5 py-3 text-center text-sm font-medium text-cream"
            >
              Sign in
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
