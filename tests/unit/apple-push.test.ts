import { describe, expect, it } from 'vitest';
import { generateKeyPairSync, verify as cryptoVerify } from 'node:crypto';
import { signApnsToken } from '../../src/lib/wallet/apple-push';

// The one part of Apple push that's verifiable without a real Apple
// Developer account: that the ES256 JWT we hand-sign is actually a valid,
// verifiable signature over the right data — not that APNs itself accepts
// it (that needs live credentials — see README's "Known blocker").
describe('signApnsToken', () => {
  it('produces a JWT whose signature verifies against the matching public key', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

    const jwt = signApnsToken({ teamId: 'TEAM123456', keyId: 'KEY7890AB', privateKeyPem, issuedAt: 1_700_000_000 });
    const [headerB64, claimsB64, signatureB64] = jwt.split('.') as [string, string, string];
    const signingInput = `${headerB64}.${claimsB64}`;
    const signature = Buffer.from(signatureB64, 'base64url');

    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    const claims = JSON.parse(Buffer.from(claimsB64, 'base64url').toString());

    expect(header).toEqual({ alg: 'ES256', kid: 'KEY7890AB' });
    expect(claims).toEqual({ iss: 'TEAM123456', iat: 1_700_000_000 });
    // ES256 needs a 64-byte raw (IEEE-P1363) signature, not DER.
    expect(signature).toHaveLength(64);

    const valid = cryptoVerify(
      'sha256',
      Buffer.from(signingInput),
      { key: publicKey, dsaEncoding: 'ieee-p1363' },
      signature,
    );
    expect(valid).toBe(true);
  });

  it('a tampered payload fails verification', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

    const jwt = signApnsToken({ teamId: 'TEAM123456', keyId: 'KEY7890AB', privateKeyPem });
    const [headerB64, , signatureB64] = jwt.split('.') as [string, string, string];
    const tamperedInput = `${headerB64}.${Buffer.from(JSON.stringify({ iss: 'ATTACKER', iat: 0 })).toString('base64url')}`;
    const signature = Buffer.from(signatureB64, 'base64url');

    const valid = cryptoVerify(
      'sha256',
      Buffer.from(tamperedInput),
      { key: publicKey, dsaEncoding: 'ieee-p1363' },
      signature,
    );
    expect(valid).toBe(false);
  });
});
