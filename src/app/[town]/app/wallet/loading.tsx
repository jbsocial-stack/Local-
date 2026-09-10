// Instant skeleton while WalletPage's requireShopper() + ledger fetch
// resolve, so tapping "Wallet" in the bottom nav paints immediately
// instead of leaving the screen frozen on the previous tab.
export default function WalletLoading() {
  return (
    <main className="px-4 pt-10">
      <div className="mx-auto max-w-md animate-pulse">
        <div className="h-3 w-40 rounded-full bg-line" />
        <div className="mt-4 h-48 rounded-[28px] bg-paper" />
        <div className="mx-auto mt-2 h-3 w-32 rounded-full bg-line" />

        <div className="mt-8 h-3 w-20 rounded-full bg-line" />
        <div className="mt-3 divide-y divide-line rounded-2xl bg-paper">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="h-3.5 w-28 rounded-full bg-line" />
                <div className="mt-2 h-3 w-20 rounded-full bg-line" />
              </div>
              <div className="h-3.5 w-12 rounded-full bg-line" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
