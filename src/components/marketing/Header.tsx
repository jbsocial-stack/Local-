import Link from 'next/link';

// H-nav: sits above the hero on every marketing route (see (marketing)/layout.tsx).
// "Sign in" is for shoppers who already have a pass — it's town-agnostic, so it
// goes through /sign-in -> /auth/callback -> /app, which resolves which town's
// wallet to land them on.
export function Header() {
  return (
    <header className="bg-cream px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="font-display text-2xl text-coral">
          Local
        </Link>
        <Link
          href="/sign-in"
          className="rounded-full border-2 border-coral px-5 py-2 text-sm font-medium text-coral"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
