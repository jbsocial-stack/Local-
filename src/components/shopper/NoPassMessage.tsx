export function NoPassMessage({ town }: { town: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-lg font-medium">You&apos;re signed in, but we can&apos;t find a pass for this town yet.</p>
      <a
        href={`/${town}`}
        className="flex h-12 items-center rounded-full bg-ink px-6 font-medium text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-2"
      >
        Get your Regulars pass
      </a>
    </main>
  );
}
