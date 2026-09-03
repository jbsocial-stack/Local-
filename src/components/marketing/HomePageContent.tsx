import type { TownConfig } from '../../../config/towns';
import { Hero } from './Hero';
import { SectionBand } from './SectionBand';
import { HowItWorks } from './HowItWorks';
import { ProblemColumns } from './ProblemColumns';
import { Mission } from './Mission';
import { ForShoppers } from './ForShoppers';
import { ShopperForm } from './ShopperForm';
import { ForBusinesses } from './ForBusinesses';
import { PricingTable } from './PricingTable';
import { MerchantForm } from './MerchantForm';
import { DemandMap } from './DemandMap';
import { Footer } from './Footer';

// S1-S11 assembled in spec order. Shared by `/` (no town) and `/[town]`
// (H8: pre-fills the hero pill and the shopper form's town field).
export function HomePageContent({ town }: { town?: TownConfig }) {
  return (
    <>
      <Hero town={town} />

      <SectionBand index={1} color="plain">
        <HowItWorks />
      </SectionBand>

      <SectionBand index={1} color="card">
        <ProblemColumns />
      </SectionBand>

      <SectionBand index={3} color="ink">
        <Mission />
      </SectionBand>

      <SectionBand index={4} color="card">
        <ForShoppers town={town} />
      </SectionBand>

      <SectionBand index={4} color="yellow">
        <ShopperForm defaultTown={town} />
      </SectionBand>

      <SectionBand index={6} color="ink" id="business">
        <ForBusinesses />
      </SectionBand>

      <SectionBand index={7} color="card" id="pricing">
        <PricingTable />
      </SectionBand>

      <SectionBand index={8} color="coral">
        <MerchantForm />
      </SectionBand>

      <SectionBand index={9} color="card">
        <DemandMap />
      </SectionBand>

      <Footer />
    </>
  );
}
