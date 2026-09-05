import { ForBusinesses } from './ForBusinesses';
import { MerchantForm } from './MerchantForm';
import { PricingTable } from './PricingTable';
import { SectionBand } from './SectionBand';
import { Footer } from './Footer';
import { getShopperCounts, formatTractionHeadline } from '@/lib/marketing/shopper-count';

// Dedicated business page (/business) — homepage is shopper-first now, so
// every business-facing section (benefits, pricing, the trial form) lives
// only here. `getShopperCounts` is the core KPI a prospective merchant
// actually cares about: how many shoppers are already using this, right
// now — shown as a headline stat rather than left to the placeholder
// per-shop dashboard preview inside `ForBusinesses`.
export async function BusinessPageContent() {
  const headline = formatTractionHeadline(await getShopperCounts());

  return (
    <>
      <SectionBand index={0} color="ink" className="pt-8">
        <ForBusinesses headline={headline} />
      </SectionBand>

      <SectionBand index={1} color="card" id="pricing">
        <PricingTable />
      </SectionBand>

      <SectionBand index={2} color="coral">
        <MerchantForm />
      </SectionBand>

      <Footer />
    </>
  );
}
