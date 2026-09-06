// SumUp OAuth 2.0 (authorization-code grant) — lets a merchant connect
// their own SumUp account so we can later trigger card-present checkouts
// on their terminal via the Cloud API and get notified via webhook (see
// ../wallet/google.ts's OAuth-adjacent JWT-bearer flow for the general
// shape this codebase already uses for a third-party API; this one is a
// standard three-legged OAuth2 dance instead, since SumUp's own docs
// recommend it for "any app that connects to multiple merchants").
//
// Confirmed against developer.sumup.com (Sept 2026): the two OAuth
// endpoints are api.sumup.com/authorize and api.sumup.com/token, and valid
// scopes include payments, transactions.history, user.profile_readonly,
// among others. NOT yet verified against a live sandbox account (no
// SumUp developer/partner account exists for this project yet) — treat
// the token response shape below as "standard OAuth2", not SumUp-confirmed
// field-for-field, until a real connection has been tested.

export class SumUpCredentialsMissingError extends Error {
  constructor(missing: string[]) {
    super(`SumUp is not configured (missing: ${missing.join(', ')}).`);
    this.name = 'SumUpCredentialsMissingError';
  }
}

interface SumUpConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const AUTHORIZE_URL = 'https://api.sumup.com/authorize';
const TOKEN_URL = 'https://api.sumup.com/token';

// Shared between the connect and callback routes — a route.ts file can
// only export HTTP method handlers and a small set of Next.js config
// fields, so this can't live there.
export const SUMUP_STATE_COOKIE = 'sumup_oauth_state';

// payments: create/trigger checkouts. transactions.history +
// user.profile_readonly: confirm a checkout's result and identify which
// SumUp account we're talking to. Override via env if your SumUp partner
// agreement needs a different set.
const DEFAULT_SCOPES = 'payments transactions.history user.profile_readonly';

function loadConfig(): SumUpConfig {
  const vars = {
    clientId: process.env.SUMUP_CLIENT_ID,
    clientSecret: process.env.SUMUP_CLIENT_SECRET,
    redirectUri: process.env.SUMUP_REDIRECT_URI,
  };
  const missing = Object.entries(vars)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) throw new SumUpCredentialsMissingError(missing);
  return vars as SumUpConfig;
}

/** Where to send a merchant to approve the connection. `state` should be a
    random value you can verify on the callback (CSRF protection) — the
    connect route stores it in a short-lived cookie. */
export function buildAuthorizeUrl(state: string): string {
  const config = loadConfig();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: process.env.SUMUP_OAUTH_SCOPES || DEFAULT_SCOPES,
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export interface SumUpTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

async function requestToken(body: URLSearchParams): Promise<SumUpTokens> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`SumUp token request failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/** Exchanges the `code` a merchant's approval redirect carried for tokens. */
export async function exchangeCodeForToken(code: string): Promise<SumUpTokens> {
  const config = loadConfig();
  return requestToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }),
  );
}

/** Access tokens expire; call this ahead of a Cloud API request once
    `expiresAt` is close (the connect/callback routes store the new pair). */
export async function refreshAccessToken(refreshToken: string): Promise<SumUpTokens> {
  const config = loadConfig();
  return requestToken(
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  );
}

/** Best-effort: identifies which SumUp account we just connected, so the
    settings page can show something more useful than a bare "connected".
    /v0.1/me is SumUp's account-profile endpoint in every version of their
    REST API this codebase's author has seen — not yet confirmed against a
    live token, so this tolerates an unexpected response shape rather than
    failing the whole connection over a cosmetic detail. */
export async function fetchSumUpMerchantCode(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.sumup.com/v0.1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { merchant_profile?: { merchant_code?: string } };
    return data.merchant_profile?.merchant_code ?? null;
  } catch {
    return null;
  }
}
