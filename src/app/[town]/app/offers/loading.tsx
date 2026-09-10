// Instant skeleton while OffersPage's requireShopper() + offers fetch
// resolve.
export default function OffersLoading() {
  return (
    <main className="px-4 pt-10">
      <div className="mx-auto max-w-md animate-pulse">
        <div className="h-6 w-24 rounded-full bg-line" />
        <div className="mt-2 h-3 w-56 rounded-full bg-line" />

        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl bg-paper p-4">
              <div>
                <div className="h-3.5 w-28 rounded-full bg-line" />
                <div className="mt-2 h-3 w-20 rounded-full bg-line" />
              </div>
              <div className="h-5 w-16 rounded-full bg-line" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
