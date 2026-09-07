import type { TownConfig } from '../../../config/towns';
import { ForShoppers } from './ForShoppers';
import { ShopperForm } from './ShopperForm';
import { SectionBand } from './SectionBand';
import { Footer } from './Footer';

// Dedicated shopper page (/shoppers, /[town]/shoppers) — the benefits also
// appear on the homepage (ForShoppers there links out to here instead of
// to an in-page anchor), but the actual sign-up form now lives only here.
export function ShopperPageContent({ town }: { town?: TownConfig }) {
  return (
    <>
      <SectionBand index={0} color="card" className="pt-8">
        <ForShoppers town={town} />
      </SectionBand>

      <SectionBand index={1} color="card">
        <ShopperForm defaultTown={town} />
      </SectionBand>

      <Footer />
    </>
  );
}
