import { describe, expect, it } from 'vitest';
import {
  decodeQrPayload,
  encodeQrPayload,
  generateToken,
  STEP_SECONDS,
  verifyToken,
} from '../../src/lib/token/rotating-token';

const SECRET = 'test-secret-do-not-use-in-prod';
const PASS_ID = 'pass_abc123';

describe('rotating token', () => {
  it('a freshly generated token verifies', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const t = generateToken(SECRET, PASS_ID, now);
    expect(verifyToken(SECRET, PASS_ID, t.step, t.token, now)).toEqual({ valid: true });
  });

  it('rejects a token for the wrong pass', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const t = generateToken(SECRET, PASS_ID, now);
    expect(verifyToken(SECRET, 'pass_other', t.step, t.token, now)).toEqual({
      valid: false,
      reason: 'mismatch',
    });
  });

  it('rejects a token signed with a different secret', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const t = generateToken('a-different-secret', PASS_ID, now);
    expect(verifyToken(SECRET, PASS_ID, t.step, t.token, now)).toEqual({
      valid: false,
      reason: 'mismatch',
    });
  });

  it('accepts one step of future clock skew', () => {
    const generatedAt = new Date('2026-01-01T12:00:00Z');
    const t = generateToken(SECRET, PASS_ID, generatedAt);
    const verifiedAt = new Date(generatedAt.getTime() - STEP_SECONDS * 1000);
    expect(verifyToken(SECRET, PASS_ID, t.step, t.token, verifiedAt)).toEqual({ valid: true });
  });

  it('rejects more than one step of future skew', () => {
    const generatedAt = new Date('2026-01-01T12:00:00Z');
    const t = generateToken(SECRET, PASS_ID, generatedAt);
    const verifiedAt = new Date(generatedAt.getTime() - 2 * STEP_SECONDS * 1000);
    expect(verifyToken(SECRET, PASS_ID, t.step, t.token, verifiedAt)).toEqual({
      valid: false,
      reason: 'expired',
    });
  });

  it('still verifies a token that is just under 5 minutes old', () => {
    const generatedAt = new Date('2026-01-01T12:00:00Z');
    const t = generateToken(SECRET, PASS_ID, generatedAt);
    const verifiedAt = new Date(generatedAt.getTime() + 4.9 * 60 * 1000);
    expect(verifyToken(SECRET, PASS_ID, t.step, t.token, verifiedAt)).toEqual({ valid: true });
  });

  it('rejects a token older than 5 minutes (static screenshot)', () => {
    const generatedAt = new Date('2026-01-01T12:00:00Z');
    const t = generateToken(SECRET, PASS_ID, generatedAt);
    const verifiedAt = new Date(generatedAt.getTime() + 5.5 * 60 * 1000);
    expect(verifyToken(SECRET, PASS_ID, t.step, t.token, verifiedAt)).toEqual({
      valid: false,
      reason: 'expired',
    });
  });

  it('round-trips through the QR payload encoding', () => {
    const t = generateToken(SECRET, PASS_ID, new Date('2026-01-01T12:00:00Z'));
    const decoded = decodeQrPayload(encodeQrPayload(t));
    expect(decoded).toEqual({ passId: t.passId, step: t.step, token: t.token });
  });

  it('rejects a malformed QR payload', () => {
    expect(decodeQrPayload('not-a-valid-payload')).toBeNull();
    expect(decodeQrPayload('a.b.c.d')).toBeNull();
    expect(decodeQrPayload('a.notanumber.token')).toBeNull();
  });
});
