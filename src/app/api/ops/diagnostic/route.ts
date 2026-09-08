import { NextResponse } from 'next/server';

// TEMPORARY — debugging why OPS_PASSWORD isn't reaching the deployed
// function despite being set in Vercel. Reports presence/length only,
// never the value itself. Delete this route once diagnosed.
export async function GET() {
  const password = process.env.OPS_PASSWORD;
  // Key NAMES only (never values) that loosely match, so a typo'd or
  // whitespace-padded key (e.g. "OPS_PASSWORD " or "ops_password") shows
  // up even though process.env.OPS_PASSWORD itself is undefined.
  const nearMatchKeys = Object.keys(process.env)
    .filter((key) => /ops|password/i.test(key))
    .map((key) => JSON.stringify(key));
  return NextResponse.json({
    opsPasswordConfigured: Boolean(password),
    opsPasswordLength: password ? password.length : null,
    nearMatchKeys,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    deploymentUrl: process.env.VERCEL_URL ?? null,
  });
}
