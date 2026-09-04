import type { TownConfig } from '../../../config/towns';
import { Hero } from './Hero';
import { SectionBand } from './SectionBand';
import { HowItWorks } from './HowItWorks';
import { ProblemColumns } from './ProblemColumns';
import { Mission } from './Mission';
import { ForShoppers } from './ForShoppers';
import { ForBusinesses } from './ForBusinesses';
import { PricingTable } from './PricingTable';
import { DemandMap } from './DemandMap';
import { Footer } from './Footer';

// Shared by `/` (no town) and `/[town]` (H8: pre-fills the hero pill and
// links out to the town-scoped shopper page). The shopper/merchant sign-up
// forms live on their own pages now (/shoppers, /business) — this stays
// the overview: benefits + a link out for each persona, then everything
// else, as a stack of cards (SectionBand's `stackOrder`) that pile up as
// you scroll past them.
export function HomePageContent({ town }: { town?: TownConfig }) {
  return (
    <>
      <Hero town={town} />

      <SectionBand index={1} color="plain">
        <HowItWorks />
      </SectionBand>

      <SectionBand index={1} color="card" stackOrder={0}>
        <ProblemColumns />
      </SectionBand>

      <SectionBand index={3} color="ink" stackOrder={1}>
        <Mission />
      </SectionBand>

      <SectionBand index={4} color="card" stackOrder={2}>
        <ForShoppers town={town} formHref={town ? `/${town.slug}/shoppers` : '/shoppers'} />
      </SectionBand>

      <SectionBand index={6} color="ink" id="business" stackOrder={3}>
        <ForBusinesses formHref="/business" />
      </SectionBand>

      <SectionBand index={7} color="card" id="pricing" stackOrder={4}>
        <PricingTable />
      </SectionBand>

      <SectionBand index={9} color="card" stackOrder={5}>
        <DemandMap />
      </SectionBand>

      <Footer />
    </>
  );
}
