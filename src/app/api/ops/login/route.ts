import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createOpsSessionToken, OPS_SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/lib/auth/ops-session';

const bodySchema = z.object({ password: z.string().min(1) });

// Hashing both sides to a fixed-length digest before comparing avoids
// leaking the real password's length through a variable-length
// timingSafeEqual call.
function passwordMatches(submitted: string, expected: string): boolean {
  const a = createHash('sha256').update(submitted).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const expected = process.env.OPS_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  if (!passwordMatches(parsed.data.password, expected)) {
    return NextResponse.json({ error: 'invalid_password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPS_SESSION_COOKIE, createOpsSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });
  return res;
}
