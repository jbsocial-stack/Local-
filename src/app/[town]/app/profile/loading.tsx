// Instant skeleton while ProfilePage's requireShopper() + profile fetch
// resolve.
export default function ProfileLoading() {
  return (
    <main className="px-4 pt-10">
      <div className="mx-auto max-w-md animate-pulse">
        <div className="h-6 w-24 rounded-full bg-line" />

        <div className="mt-6 flex justify-center">
          <div className="h-20 w-20 rounded-full bg-paper" />
        </div>

        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 rounded-full bg-line" />
              <div className="mt-2 h-11 rounded-2xl bg-paper" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
