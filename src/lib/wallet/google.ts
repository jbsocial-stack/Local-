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

/** Minimal RS256 JWT signer — avoids pulling in a JWT library for one call site. */
function signRS256(claims: Record<string, unknown>, privateKeyPem: string): string {
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
