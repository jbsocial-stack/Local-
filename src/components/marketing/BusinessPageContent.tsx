import { ForBusinesses } from './ForBusinesses';
import { MerchantForm } from './MerchantForm';
import { SectionBand } from './SectionBand';
import { Footer } from './Footer';

// Dedicated business page (/business) — the benefits also appear on the
// homepage (ForBusinesses there links out to here instead of to an in-page
// anchor), but the actual trial sign-up form now lives only here.
export function BusinessPageContent() {
  return (
    <>
      <SectionBand index={0} color="ink" className="pt-8">
        <ForBusinesses />
      </SectionBand>

      <SectionBand index={1} color="coral">
        <MerchantForm />
      </SectionBand>

      <Footer />
    </>
  );
}
