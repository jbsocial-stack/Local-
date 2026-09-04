import { createSign } from 'node:crypto';

export class GoogleWalletCredentialsMissingError extends Error {
  constructor(missing: string[]) {
    super(`Google Wallet is not configured (missing: ${missing.join(', ')}).`);
    this.name = 'GoogleWalletCredentialsMissingError';
  }
}

interface GoogleWalletConfig {
  issuerId: string;
  serviceAccountEmail: string;
  serviceAccountKey: string;
}

function loadConfig(): GoogleWalletConfig {
  const vars = {
    issuerId: process.env.GOOGLE_WALLET_ISSUER_ID,
    serviceAccountEmail: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
    serviceAccountKey: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY,
  };
  const missing = Object.entries(vars)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) throw new GoogleWalletCredentialsMissingError(missing);
  return vars as GoogleWalletConfig;
}

function base64url(input: Buffer): string {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Minimal RS256 JWT signer — avoids pulling in a JWT library for a couple of call sites. */
export function signRS256(claims: Record<string, unknown>, privateKeyPem: string): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  const signingInput = `${base64url(Buffer.from(JSON.stringify(header)))}.${base64url(
    Buffer.from(JSON.stringify(claims)),
  )}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = base64url(signer.sign(privateKeyPem));
  return `${signingInput}.${signature}`;
}

export interface GooglePassInput {
  serial: string;
  townName: string;
  balancePoints: number;
  lastActivityLabel: string;
  qrPayload: string;
  claimUrl: string; // R8/R9: "linked from the pass back field"
}

/** Returns the "Add to Google Wallet" save URL, or throws if unconfigured. */
export function generateGoogleWalletSaveUrl(input: GooglePassInput): string {
  const config = loadConfig();
  const classId = `${config.issuerId}.local_loyalty_class`;
  const objectId = `${config.issuerId}.${input.serial}`;

  const loyaltyObject = {
    id: objectId,
    classId,
    state: 'ACTIVE',
    accountName: input.townName,
    loyaltyPoints: {
      label: 'Balance',
      balance: { string: `£${(input.balancePoints / 100).toFixed(2)}` },
    },
    textModulesData: [{ header: 'LAST ACTIVITY', body: input.lastActivityLabel }],
    linksModuleData: { uris: [{ uri: input.claimUrl, description: 'Directory & account' }] },
    barcode: { type: 'QR_CODE', value: input.qrPayload },
  };

  const claims = {
    iss: config.serviceAccountEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: { loyaltyObjects: [loyaltyObject] },
  };

  const token = signRS256(claims, config.serviceAccountKey.replace(/\\n/g, '\n'));
  return `https://pay.google.com/gp/v/save/${token}`;
}

/**
 * R1: "the pass shows the new balance within 30s" — for Google Wallet this
 * is a direct PATCH of the loyaltyObject; Google propagates it to devices
 * on its own, no separate push notification step. Auth is the standard
 * service-account JWT-bearer OAuth2 flow (RFC 7523): a self-signed JWT
 * traded at Google's token endpoint for a short-lived access token.
 */
export async function pushGoogleWalletBalance(input: { serial: string; balancePoints: number }): Promise<void> {
  const config = loadConfig();
  const objectId = `${config.issuerId}.${input.serial}`;
  const now = Math.floor(Date.now() / 1000);

  const assertion = signRS256(
    {
      iss: config.serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    config.serviceAccountKey.replace(/\\n/g, '\n'),
  );

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`Google OAuth token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
  }
  const { access_token: accessToken } = (await tokenRes.json()) as { access_token: string };

  const patchRes = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      loyaltyPoints: {
        label: 'Balance',
        balance: { string: `£${(input.balancePoints / 100).toFixed(2)}` },
      },
    }),
  });
  if (!patchRes.ok) {
    throw new Error(`Google Wallet PATCH failed: ${patchRes.status} ${await patchRes.text()}`);
  }
}
