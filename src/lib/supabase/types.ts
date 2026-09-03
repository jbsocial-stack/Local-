// Hand-maintained mirror of supabase/migrations/*.sql.
// Regenerate with `supabase gen types typescript` once a real project exists;
// keep in sync manually until then.

export type LedgerType = 'earn' | 'redeem' | 'expire' | 'adjust' | 'reversal' | 'mission';
export type MerchantTier = 'single' | 'two' | 'group' | 'multi';
export type MerchantPlan = 'standard' | 'pro';
export type MerchantStatus = 'pending' | 'live' | 'paused';
export type PassPlatform = 'apple' | 'google';
export type MerchantRole = 'owner' | 'staff';

type NoRelationships = { Relationships: [] };

export interface Database {
  public: {
    Tables: {
      towns: {
        Row: {
          id: string;
          slug: string;
          name: string;
          point_value_pence: number;
          base_points: number;
          expiry_months: number;
          settings: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['towns']['Row']> & {
          slug: string;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['towns']['Row']>;
      } & NoRelationships;
      users: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          claimed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['users']['Row']>;
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      } & NoRelationships;
      passes: {
        Row: {
          id: string;
          user_id: string;
          town_id: string;
          platform: PassPlatform;
          serial: string;
          secret: string;
          balance_points: number;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['passes']['Row']> & {
          user_id: string;
          town_id: string;
          platform: PassPlatform;
          serial: string;
          secret: string;
        };
        Update: Partial<Database['public']['Tables']['passes']['Row']>;
      } & NoRelationships;
      merchants: {
        Row: {
          id: string;
          town_id: string;
          name: string;
          slug: string;
          category: string;
          description: string | null;
          address: string;
          lat: number;
          lng: number;
          hours: Record<string, unknown>;
          photo_url: string | null;
          tier: MerchantTier;
          plan: MerchantPlan;
          status: MerchantStatus;
          base_multiplier: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['merchants']['Row']> & {
          town_id: string;
          name: string;
          slug: string;
          category: string;
          address: string;
          lat: number;
          lng: number;
        };
        Update: Partial<Database['public']['Tables']['merchants']['Row']>;
      } & NoRelationships;
      merchant_boosts: {
        Row: {
          id: string;
          merchant_id: string;
          multiplier: number;
          starts_at: string;
          ends_at: string;
          label: string | null;
        };
        Insert: Partial<Database['public']['Tables']['merchant_boosts']['Row']> & {
          merchant_id: string;
          multiplier: number;
          starts_at: string;
          ends_at: string;
        };
        Update: Partial<Database['public']['Tables']['merchant_boosts']['Row']>;
      } & NoRelationships;
      merchant_users: {
        Row: {
          id: string;
          merchant_id: string;
          user_id: string | null;
          role: MerchantRole;
          name: string;
          pin_hash: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['merchant_users']['Row']> & {
          merchant_id: string;
          role: MerchantRole;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['merchant_users']['Row']>;
      } & NoRelationships;
      ledger: {
        Row: {
          id: string;
          town_id: string;
          pass_id: string;
          merchant_id: string | null;
          staff_id: string | null;
          type: LedgerType;
          points: number;
          gbp_value_pence: number;
          multiplier: number | null;
          basket_pence: number | null;
          reason: string | null;
          reverses_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['ledger']['Row']> & {
          town_id: string;
          pass_id: string;
          type: LedgerType;
          points: number;
          gbp_value_pence: number;
        };
        // Ledger is insert-only — no direct update path, enforced by RLS too.
        Update: Record<string, never>;
      } & NoRelationships;
      apple_device_registrations: {
        Row: {
          id: string;
          device_library_identifier: string;
          pass_type_identifier: string;
          pass_id: string;
          push_token: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['apple_device_registrations']['Row']> & {
          device_library_identifier: string;
          pass_type_identifier: string;
          pass_id: string;
          push_token: string;
        };
        Update: Partial<Database['public']['Tables']['apple_device_registrations']['Row']>;
      } & NoRelationships;
      metrics_daily: {
        Row: {
          town_id: string;
          merchant_id: string | null;
          date: string;
          passes_issued: number;
          active_earners: number;
          earns: number;
          redeems: number;
          points_issued: number;
          points_redeemed: number;
          gmv_pence: number;
        };
        Insert: Partial<Database['public']['Tables']['metrics_daily']['Row']> & {
          town_id: string;
          date: string;
        };
        Update: Partial<Database['public']['Tables']['metrics_daily']['Row']>;
      } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: {
      apply_ledger_entry: {
        Args: {
          p_town_id: string;
          p_pass_id: string;
          p_merchant_id: string | null;
          p_staff_id: string | null;
          p_type: LedgerType;
          p_points: number;
          p_gbp_value_pence: number;
          p_multiplier: number | null;
          p_basket_pence: number | null;
          p_reason: string | null;
          p_reverses_id: string | null;
        };
        Returns: Database['public']['Tables']['ledger']['Row'];
      };
    };
  };
}
