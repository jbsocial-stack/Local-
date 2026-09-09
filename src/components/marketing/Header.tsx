import Link from 'next/link';
import { BurgerMenu } from './BurgerMenu';

// Sits above every marketing route (see (marketing)/layout.tsx). Sticky so
// the burger menu and sign-in stay reachable while scrolling through the
// stacking cards further down the page. "Sign in" is for shoppers who
// already have a pass — it's town-agnostic, so it goes through
// /sign-in -> /auth/callback -> /app, which resolves which town's wallet
// to land them on.
export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-cream px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink font-logo uppercase text-sm text-cream">
            R
          </span>
          <span className="font-logo uppercase text-2xl text-ink">Regulars</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-2 sm:h-12"
          >
            Sign in
          </Link>
          <BurgerMenu />
        </div>
      </div>
    </header>
  );
}
