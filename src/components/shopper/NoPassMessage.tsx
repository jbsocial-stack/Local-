export function NoPassMessage({ town }: { town: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-lg font-medium">You&apos;re signed in, but we can&apos;t find a pass for this town yet.</p>
      <a href={`/${town}`} className="rounded-full bg-coral px-6 py-3 font-medium text-cream">
        Get your Local pass
      </a>
    </main>
  );
}
