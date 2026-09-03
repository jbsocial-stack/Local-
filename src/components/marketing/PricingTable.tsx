export function PricingTable() {
  return (
    <div>
      <h2 className="font-display text-3xl">Pricing</h2>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-ink/10">
              <th className="py-3 pr-4" />
              <th className="py-3 pr-4 font-display text-lg">Shoppers</th>
              <th className="py-3 pr-4 font-display text-lg">Local Business Standard</th>
              <th className="py-3 font-display text-lg">Pro add-on</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-ink/10 align-top">
              <th className="py-4 pr-4 font-medium">Price</th>
              <td className="py-4 pr-4 font-semibold text-coral">Free forever</td>
              <td className="py-4 pr-4">
                <span className="font-semibold text-coral">from £40/mo</span> (single site) · £60
                (2 sites) · £85 (3–4) · £120 (5+)
              </td>
              <td className="py-4 font-semibold text-coral">+£60/mo</td>
            </tr>
            <tr className="border-b border-ink/10 align-top">
              <th className="py-4 pr-4 font-medium">Includes</th>
              <td className="py-4 pr-4">Pass, earn, spend, map, missions</td>
              <td className="py-4 pr-4">
                Scanner, earn/redeem, dashboard, map listing, 1 push offer/week, poster &amp; sticker
              </td>
              <td className="py-4">Unlimited push, lapsed-customer lists, segmentation, email lead gen</td>
            </tr>
            <tr className="align-top">
              <th className="py-4 pr-4 font-medium">Terms</th>
              <td className="py-4 pr-4">—</td>
              <td className="py-4 pr-4" colSpan={2}>
                Monthly billing for your first 6 months (+30%), then annual. Cancel anytime in the
                intro period.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-ink/60">
        Points you award are your marketing spend. Points redeemed with you are sales. You set your
        own earn rate, 1x–5x.
      </p>
    </div>
  );
}
