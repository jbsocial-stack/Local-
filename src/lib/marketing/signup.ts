import { findTown, type TownConfig } from '../../../config/towns';

export interface SignupResolution {
  kind: 'live' | 'coming-soon' | 'planned';
  town: TownConfig | null;
  label: string;
}

/**
 * AC: "Given a visitor in a `planned` town, when they submit the shopper
 * form, then the success state shows the town's updated sign-up count and
 * no wallet button." A slug not in config, or a free-text town, both fall
 * through to `planned` — the only meaningful difference between "no config
 * row at all" and "explicitly marked planned" is the label to show back.
 */
export function resolveSignupTown(townSlug: string | null, townFreeText: string | null): SignupResolution {
  if (townSlug) {
    const town = findTown(townSlug);
    if (town) return { kind: town.status, town, label: town.name };
  }
  const label = townFreeText?.trim() || 'your town';
  return { kind: 'planned', town: null, label };
}
