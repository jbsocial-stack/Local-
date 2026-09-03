import type { MerchantTier } from '../supabase/types';

export type VenuesOption = '1' | '2' | '3-4' | '5+';

/** S9: "number of venues (1 / 2 / 3–4 / 5+ → pre-selects tier)." */
export function mapVenuesToTier(option: VenuesOption): MerchantTier {
  switch (option) {
    case '1':
      return 'single';
    case '2':
      return 'two';
    case '3-4':
      return 'group';
    case '5+':
      return 'multi';
  }
}

/**
 * AC: "when the merchant form is submitted, then venues = 'multi' is
 * stored and the notification email subject includes '[multi-site]'."
 */
export function leadEmailSubject(businessName: string, tier: MerchantTier): string {
  const tag = tier === 'multi' ? '[multi-site] ' : '';
  return `${tag}New merchant trial request: ${businessName}`;
}
