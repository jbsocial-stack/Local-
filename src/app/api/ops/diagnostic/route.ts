import { NextResponse } from 'next/server';

// TEMPORARY — debugging why OPS_PASSWORD isn't reaching the deployed
// function despite being set in Vercel. Reports presence/length only,
// never the value itself. Delete this route once diagnosed.
export async function GET() {
  const password = process.env.OPS_PASSWORD;
  return NextResponse.json({
    opsPasswordConfigured: Boolean(password),
    opsPasswordLength: password ? password.length : null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    deploymentUrl: process.env.VERCEL_URL ?? null,
  });
}
