'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  return (
    <nav
      className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-1
                 rounded-full border border-white/40 bg-white/60 px-2 py-2 shadow-[0_8px_32px_rgba(43,43,43,0.15)]
                 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-ink/60"
      aria-label="Main"
    >
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              active ? 'bg-coral text-cream' : 'text-ink-muted'
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
