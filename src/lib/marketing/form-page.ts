import { NextRequest, NextResponse } from 'next/server';

/** Shared no-JS fallback helpers for /api/signup and /api/lead. */
export function isFormPost(req: NextRequest): boolean {
  const contentType = req.headers.get('content-type') ?? '';
  return contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');
}

export function formPage(title: string, body: string, status = 200): NextResponse {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>` +
      `<meta name="viewport" content="width=device-width, initial-scale=1"></head>` +
      `<body style="font-family:system-ui;max-width:32rem;margin:4rem auto;padding:0 1.5rem;color:#1B263B">` +
      `${body}<p><a href="/">&larr; Back to Regulars</a></p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
