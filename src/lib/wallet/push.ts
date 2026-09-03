import type { PassPlatform } from '../supabase/types';

// R1: "the pass shows the new balance without the user opening anything,
// within 30s" — Apple does this via an APNs push telling the device to hit
// the pass web service's GET /v1/passes/... endpoint again; Google Wallet
// pushes via a PATCH to the Wallet API object, which propagates to devices
// on its own.
//
// Neither is wired to a real provider yet: Apple push needs the APNs .p8 key
// (see .env.example) and Google push needs the issuer service account — both
// blocked on open question #2. This module isolates that gap behind one
// interface so the ledger routes can call it unconditionally today and it
// starts working the moment credentials land, with no call-site changes.

export interface PassPushTarget {
  passId: string;
  platform: PassPlatform;
  serial: string;
}

export interface PassPusher {
  push(target: PassPushTarget): Promise<void>;
}

class ApplePassPusher implements PassPusher {
  async push(target: PassPushTarget): Promise<void> {
    const keyPath = process.env.APNS_KEY_PATH;
    if (!keyPath) {
      console.warn(
        `[wallet/push] APNS_KEY_PATH not configured — skipping Apple push for pass ${target.passId}. ` +
          'Blocked on open question #2 (Apple Developer Pass Type ID + cert owner).',
      );
      return;
    }
    // TODO(R1): look up registered device push tokens for target.serial from
    // the apple_registrations table (written by /api/apple/v1/devices) and
    // send an empty-payload APNs notification to each, per Apple's
    // PassKit Web Service spec ("Sending update notifications").
    throw new Error('Apple push not implemented — APNS_KEY_PATH is set but no client is wired.');
  }
}

class GooglePassPusher implements PassPusher {
  async push(target: PassPushTarget): Promise<void> {
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    if (!issuerId) {
      console.warn(
        `[wallet/push] GOOGLE_WALLET_ISSUER_ID not configured — skipping Google push for pass ${target.passId}.`,
      );
      return;
    }
    // TODO(R1): PATCH the loyaltyObject via the Google Wallet REST API;
    // Google propagates the update to devices, no separate push step needed.
    throw new Error('Google Wallet push not implemented — issuer ID is set but no client is wired.');
  }
}

const pushers: Record<PassPlatform, PassPusher> = {
  apple: new ApplePassPusher(),
  google: new GooglePassPusher(),
};

/** Best-effort: a push failure must never fail the earn/redeem request itself. */
export async function pushPassUpdate(target: PassPushTarget): Promise<void> {
  try {
    await pushers[target.platform].push(target);
  } catch (err) {
    console.error(`[wallet/push] failed to push update for pass ${target.passId}`, err);
  }
}
