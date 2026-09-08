import { beforeAll, describe, expect, it } from 'vitest';
import { createOpsSessionToken, verifyOpsSessionToken, SESSION_TTL_SECONDS } from '../../src/lib/auth/ops-session';

beforeAll(() => {
  process.env.PASS_TOKEN_SECRET = 'test-secret-do-not-use-in-prod';
});

describe('ops session token', () => {
  it('a freshly created token verifies', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const token = createOpsSessionToken(now);
    expect(verifyOpsSessionToken(token, now)).toBe(true);
  });

  it('still verifies just under a week later', () => {
    const createdAt = new Date('2026-01-01T12:00:00Z');
    const token = createOpsSessionToken(createdAt);
    const almostExpired = new Date(createdAt.getTime() + (SESSION_TTL_SECONDS - 60) * 1000);
    expect(verifyOpsSessionToken(token, almostExpired)).toBe(true);
  });

  it('rejects a token older than a week', () => {
    const createdAt = new Date('2026-01-01T12:00:00Z');
    const token = createOpsSessionToken(createdAt);
    const expired = new Date(createdAt.getTime() + (SESSION_TTL_SECONDS + 60) * 1000);
    expect(verifyOpsSessionToken(token, expired)).toBe(false);
  });

  it('rejects a tampered token', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const token = createOpsSessionToken(now);
    const [encoded] = token.split('.');
    expect(verifyOpsSessionToken(`${encoded}.deadbeef`, now)).toBe(false);
  });

  it('rejects a malformed token', () => {
    expect(verifyOpsSessionToken('not-a-valid-token')).toBe(false);
  });
});
