// Instant skeleton while DiscoverPage's requireShopper() + listings fetch
// resolve.
export default function DiscoverLoading() {
  return (
    <main className="px-4 pt-10">
      <div className="mx-auto max-w-md animate-pulse">
        <div className="h-6 w-32 rounded-full bg-line" />
        <div className="mt-4 h-10 rounded-full bg-paper" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
              <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-line" />
              <div className="flex-1">
                <div className="h-3.5 w-32 rounded-full bg-line" />
                <div className="mt-2 h-3 w-24 rounded-full bg-line" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
