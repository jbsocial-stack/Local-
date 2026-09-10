// Instant skeleton while VenuePage's requireShopper() + merchant fetch
// resolve.
export default function VenueLoading() {
  return (
    <main className="animate-pulse pb-4">
      <div className="h-56 w-full bg-line" />

      <div className="px-4 pt-4">
        <div className="h-6 w-40 rounded-full bg-paper" />
        <div className="mt-2 h-3 w-28 rounded-full bg-paper" />

        <div className="mt-3 h-6 w-24 rounded-full bg-paper" />

        <div className="mt-6 h-28 rounded-[28px] bg-paper" />
      </div>
    </main>
  );
}
