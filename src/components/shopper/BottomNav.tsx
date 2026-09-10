'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef, useState } from 'react';
import { CompassIcon, TagIcon, UserIcon, WalletIcon } from './icons';

// "Glass effect hovering navigation at the bottom" — a fixed, blurred,
// translucent pill floating above the content, only shown once signed in
// (see layout.tsx, which decides whether to render this at all).
export function BottomNav({ town }: { town: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/${town}/app/wallet`, label: 'Wallet', Icon: WalletIcon },
    { href: `/${town}/app/discover`, label: 'Discover', Icon: CompassIcon },
    { href: `/${town}/app/offers`, label: 'Offers', Icon: TagIcon },
    { href: `/${town}/app/profile`, label: 'Profile', Icon: UserIcon },
  ];

  const activeIndex = tabs.findIndex((t) => pathname?.startsWith(t.href));
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  // Measure the active tab's own box and slide a coral pill to match it,
  // rather than hard-coding widths — the four labels aren't the same
  // length. useLayoutEffect (not useEffect) so the very first paint
  // already has the pill in place, with no flash at the wrong tab.
  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs.current[activeIndex];
      setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeIndex]);

  return (
    <nav
      className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-1
                 rounded-full border border-white/40 bg-white/60 px-2 py-2 shadow-[0_8px_32px_rgba(43,43,43,0.15)]
                 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-ink/60"
      aria-label="Main"
    >
      {pill && (
        <span
          aria-hidden
          className="absolute inset-y-2 left-0 rounded-full bg-coral transition-[transform,width] duration-300 ease-out"
          style={{ width: pill.width, transform: `translateX(${pill.left}px)` }}
        />
      )}
      {tabs.map(({ href, label, Icon }, i) => {
        const active = i === activeIndex;
        return (
          <Link
            key={href}
            href={href}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            className={`relative z-10 flex flex-col items-center gap-0.5 rounded-full px-4 py-2 text-xs font-medium transition-colors duration-300 ${
              active ? 'text-cream' : 'text-ink-muted'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
