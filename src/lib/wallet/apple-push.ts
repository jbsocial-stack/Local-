import { sign as cryptoSign } from 'node:crypto';
import { connect } from 'node:http2';

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * APNs provider authentication token — a JWT signed with the .p8 key, per
 * Apple's token-based (HTTP/2) push spec. ES256 needs the raw IEEE-P1363
 * (r||s) signature format, not the DER format `crypto.sign` returns by
 * default — `dsaEncoding: 'ieee-p1363'` gets that directly from Node's
 * crypto module, no hand-rolled DER parsing needed.
 */
export function signApnsToken({
  teamId,
  keyId,
  privateKeyPem,
  issuedAt = Math.floor(Date.now() / 1000),
}: {
  teamId: string;
  keyId: string;
  privateKeyPem: string;
  issuedAt?: number;
}): string {
  const header = { alg: 'ES256', kid: keyId };
  const claims = { iss: teamId, iat: issuedAt };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signature = cryptoSign('sha256', Buffer.from(signingInput), {
    key: privateKeyPem,
    dsaEncoding: 'ieee-p1363',
  });
  return `${signingInput}.${base64url(signature)}`;
}

export interface ApnsPushResult {
  pushToken: string;
  ok: boolean;
  status: number;
  /** APNs says this token is permanently dead (410 Unregistered) — the
      caller should delete the device registration row. */
  shouldForget: boolean;
}

/**
 * Sends one empty-payload "wake up and re-fetch the pass" push per device,
 * per Apple's PassKit Web Service spec — the payload is always `{}`; the
 * device responds by calling GET /v1/passes/... on our own web service.
 */
export async function sendApnsPassPush({
  pushTokens,
  topic,
  token,
}: {
  pushTokens: string[];
  topic: string;
  token: string;
}): Promise<ApnsPushResult[]> {
  const client = connect('https://api.push.apple.com');
  client.on('error', () => {
    // Individual request promises below resolve on their own 'error'
    // event; this just stops an unhandled session-level error from
    // crashing the process.
  });
  try {
    return await Promise.all(
      pushTokens.map(
        (pushToken) =>
          new Promise<ApnsPushResult>((resolve) => {
            const req = client.request({
              ':method': 'POST',
              ':path': `/3/device/${pushToken}`,
              authorization: `bearer ${token}`,
              'apns-topic': topic,
              'apns-push-type': 'background',
              'apns-priority': '5',
              'content-type': 'application/json',
            });
            let status = 0;
            req.on('response', (headers) => {
              status = Number(headers[':status']) || 0;
            });
            req.on('end', () => resolve({ pushToken, ok: status === 200, status, shouldForget: status === 410 }));
            req.on('error', () => resolve({ pushToken, ok: false, status: 0, shouldForget: false }));
            req.end(JSON.stringify({}));
          }),
      ),
    );
  } finally {
    client.close();
  }
}
