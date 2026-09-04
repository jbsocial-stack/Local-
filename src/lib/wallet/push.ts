import { readFile } from 'node:fs/promises';
import { createServiceClient } from '../supabase/server';
import { signApnsToken, sendApnsPassPush } from './apple-push';
import { pushGoogleWalletBalance } from './google';
import type { PassPlatform } from '../supabase/types';

// R1: "the pass shows the new balance without the user opening anything,
// within 30s" — Apple does this via an APNs push telling the device to hit
// the pass web service's GET /v1/passes/... endpoint again; Google Wallet
// pushes via a PATCH to the Wallet API object, which propagates to devices
// on its own.
//
// Both are no-ops (logged, not thrown) until their respective credentials
// are configured — see "Known blocker: Apple Wallet" in the README. This
// module isolates that gap behind one interface so the ledger routes can
// call it unconditionally today and it starts working the moment
// credentials land, with no call-site changes.

export interface PassPushTarget {
  passId: string;
  platform: PassPlatform;
  serial: string;
  balancePoints: number;
}

export interface PassPusher {
  push(target: PassPushTarget): Promise<void>;
}

// APNs provider tokens are valid up to an hour and Apple asks providers not
// to regenerate one on every request — cached at module scope, which helps
// within a warm serverless instance even though it can't persist across
// cold starts.
let cachedApnsToken: { token: string; expiresAt: number } | null = null;

class ApplePassPusher implements PassPusher {
  async push(target: PassPushTarget): Promise<void> {
    const keyPath = process.env.APNS_KEY_PATH;
    const keyId = process.env.APNS_KEY_ID;
    const teamId = process.env.APNS_TEAM_ID;
    const topic = process.env.APPLE_PASS_TYPE_IDENTIFIER;
    if (!keyPath || !keyId || !teamId || !topic) {
      console.warn(
        `[wallet/push] Apple push not configured — skipping for pass ${target.passId}. ` +
          'Blocked on open question #2 (Apple Developer Pass Type ID + cert owner).',
      );
      return;
    }

    const supabase = createServiceClient();
    const { data: registrations } = await supabase
      .from('apple_device_registrations')
      .select('id, push_token')
      .eq('pass_id', target.passId);
    if (!registrations || registrations.length === 0) return;

    const now = Math.floor(Date.now() / 1000);
    if (!cachedApnsToken || cachedApnsToken.expiresAt <= now) {
      const privateKeyPem = await readFile(keyPath, 'utf8');
      cachedApnsToken = {
        token: signApnsToken({ teamId, keyId, privateKeyPem, issuedAt: now }),
        expiresAt: now + 45 * 60,
      };
    }

    const results = await sendApnsPassPush({
      pushTokens: registrations.map((r) => r.push_token),
      topic,
      token: cachedApnsToken.token,
    });

    const staleIds = registrations.filter((_, i) => results[i]?.shouldForget).map((r) => r.id);
    if (staleIds.length > 0) {
      await supabase.from('apple_device_registrations').delete().in('id', staleIds);
    }

    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      console.error(
        `[wallet/push] ${failed.length}/${results.length} Apple pushes failed for pass ${target.passId}`,
        failed,
      );
    }
  }
}

class GooglePassPusher implements PassPusher {
  async push(target: PassPushTarget): Promise<void> {
    if (!process.env.GOOGLE_WALLET_ISSUER_ID) {
      console.warn(
        `[wallet/push] GOOGLE_WALLET_ISSUER_ID not configured — skipping Google push for pass ${target.passId}.`,
      );
      return;
    }
    await pushGoogleWalletBalance({ serial: target.serial, balancePoints: target.balancePoints });
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
