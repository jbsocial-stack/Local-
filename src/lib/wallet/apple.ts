import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PKPass } from 'passkit-generator';

export class AppleCertificatesMissingError extends Error {
  constructor(missing: string[]) {
    super(
      `Apple Wallet is not configured (missing: ${missing.join(', ')}). Blocked on PRD open ` +
        "question #2 (Apple Developer Pass Type ID + certificate owner — 'who holds it?'). " +
        'Set the APPLE_* vars in .env.example before pass generation can work.',
    );
    this.name = 'AppleCertificatesMissingError';
  }
}

interface AppleCertConfig {
  wwdrPath: string;
  signerCertPath: string;
  signerKeyPath: string;
  teamId: string;
  passTypeId: string;
  webServiceUrl: string;
}

function loadCertConfig(): AppleCertConfig {
  const vars = {
    wwdrPath: process.env.APPLE_WWDR_CERT_PATH,
    signerCertPath: process.env.APPLE_SIGNER_CERT_PATH,
    signerKeyPath: process.env.APPLE_SIGNER_KEY_PATH,
    teamId: process.env.APPLE_TEAM_ID,
    passTypeId: process.env.APPLE_PASS_TYPE_IDENTIFIER,
    webServiceUrl: process.env.APPLE_PASS_WEB_SERVICE_URL,
  };
  const missing = Object.entries(vars)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new AppleCertificatesMissingError(missing);
  }
  return vars as AppleCertConfig;
}

export interface ApplePassInput {
  serial: string;
  authenticationToken: string; // pass.secret — used by the web service, not the barcode
  townName: string;
  balancePoints: number;
  lastActivityLabel: string;
  qrPayload: string; // R2: rotating token payload, refreshed on every regeneration
  claimUrl: string; // R8/R9: "linked from the pass back field"
}

const MODEL_DIR = path.join(process.cwd(), 'src/lib/wallet/apple-pass-model');

/**
 * Builds a signed .pkpass buffer. Called both at issuance (R1) and by the
 * Apple web service's "get updated pass" endpoint, which regenerates the
 * pass fresh each time so the barcode always carries a current token — the
 * pass only *shows* a rotated code when Apple re-fetches it after a push,
 * so keeping shopper-visible rotation close to the PRD's 60s target means
 * pushing roughly that often while the pass is likely in use, not on every
 * balance change alone.
 */
export async function generateApplePass(input: ApplePassInput): Promise<Buffer> {
  const certs = loadCertConfig();

  const pass = await PKPass.from(
    {
      model: MODEL_DIR,
      certificates: {
        wwdr: readFileSync(certs.wwdrPath),
        signerCert: readFileSync(certs.signerCertPath),
        signerKey: readFileSync(certs.signerKeyPath),
        signerKeyPassphrase: process.env.APPLE_SIGNER_KEY_PASSPHRASE || undefined,
      },
    },
    {
      serialNumber: input.serial,
      passTypeIdentifier: certs.passTypeId,
      teamIdentifier: certs.teamId,
      webServiceURL: certs.webServiceUrl,
      authenticationToken: input.authenticationToken,
    },
  );

  pass.type = 'storeCard';
  pass.headerFields.push({
    key: 'balance',
    label: 'BALANCE',
    value: (input.balancePoints / 100).toFixed(2),
    currencyCode: 'GBP',
  });
  pass.primaryFields.push({ key: 'town', label: 'LOCAL', value: input.townName });
  pass.secondaryFields.push({
    key: 'lastActivity',
    label: 'LAST ACTIVITY',
    value: input.lastActivityLabel,
  });
  pass.setBarcodes({
    message: input.qrPayload,
    format: 'PKBarcodeFormatQR',
    messageEncoding: 'iso-8859-1',
  });
  pass.backFields.push({
    key: 'manage',
    label: 'DIRECTORY & ACCOUNT',
    value: input.claimUrl,
    dataDetectorTypes: ['PKDataDetectorTypeLink'],
  });

  return pass.getAsBuffer();
}
