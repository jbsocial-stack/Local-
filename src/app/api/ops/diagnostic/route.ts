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
    // Controls: other server-only env vars that are known to already work
    // in production (used by rotating-token signing, ops/staff sessions,
    // and Supabase admin queries). If these are ALSO missing, the problem
    // isn't specific to OPS_PASSWORD -- this deployment isn't getting any
    // of the project's env vars, which points at a wrong-project mismatch
    // rather than a mistake in how OPS_PASSWORD itself was entered.
    controlVarsConfigured: {
      PASS_TOKEN_SECRET: Boolean(process.env.PASS_TOKEN_SECRET),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    deploymentUrl: process.env.VERCEL_URL ?? null,
  });
}
