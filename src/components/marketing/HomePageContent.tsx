import type { TownConfig } from '../../../config/towns';
import { Hero } from './Hero';
import { SectionBand } from './SectionBand';
import { VideoSection } from './VideoSection';
import { HowItWorks } from './HowItWorks';
import { ProblemColumns } from './ProblemColumns';
import { Mission } from './Mission';
import { ForShoppers } from './ForShoppers';
import { DemandMap } from './DemandMap';
import { Footer } from './Footer';
import { DecorField } from './DecorIcons';

// Shared by `/` (no town) and `/[town]` (H8: pre-fills the hero pill and
// links out to the town-scoped shopper page). Shopper-first: every
// business-facing section (benefits, pricing, the trial form) now lives
// only on /business — a business owner still finds their way there via the
// hero's "I run a business" tile and every header/footer/burger-menu nav,
// same as before. What's left here is the shopper pitch, then everything
// else, as a stack of cards (SectionBand's `stackOrder`) that pile up as
// you scroll past them.
export function HomePageContent({ town }: { town?: TownConfig }) {
  return (
    <div className="relative">
      <DecorField />

      <Hero town={town} />

      <SectionBand index={1} color="card">
        <VideoSection />
      </SectionBand>

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

      <SectionBand index={9} color="card" stackOrder={3}>
        <DemandMap />
      </SectionBand>

      <Footer />
    </div>
  );
}
