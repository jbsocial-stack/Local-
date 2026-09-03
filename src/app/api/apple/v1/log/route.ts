import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Apple PassKit Web Service: devices POST an array of error strings here.
// No auth on this endpoint per Apple's spec.
const bodySchema = z.object({ logs: z.array(z.string()) });

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (parsed.success) {
    for (const line of parsed.data.logs) {
      console.warn('[apple-passkit-device-log]', line);
    }
  }
  return new NextResponse(null, { status: 200 });
}
