import { unstable_cache } from 'next/cache';
import { createServiceClient } from '../supabase/server';

export interface TownRow {
  id: string;
  name: string;
}

// Town rows are effectively static — new towns are a deploy event, not a
// runtime one — so every shopper-app page/navigation doing its own
// slug -> id lookup was a pure-overhead DB round-trip. Cached here and
// shared by every call site that needs it.
export const getTownBySlug = unstable_cache(
  async (slug: string): Promise<TownRow | null> => {
    const supabase = createServiceClient();
    const { data } = await supabase.from('towns').select('id, name').eq('slug', slug).maybeSingle();
    return data;
  },
  ['town-by-slug'],
  { revalidate: 3600, tags: ['towns'] },
);
