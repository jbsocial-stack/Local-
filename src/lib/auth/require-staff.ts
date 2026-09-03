import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { STAFF_SESSION_COOKIE, verifyStaffSessionToken, type StaffSessionPayload } from './staff-session';

export async function requireStaffSession(): Promise<
  { session: StaffSessionPayload } | { error: NextResponse }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_SESSION_COOKIE)?.value;
  const session = token ? verifyStaffSessionToken(token) : null;
  if (!session) {
    return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  }
  return { session };
}

/** R7: dashboard/settings routes require the owner's full-scope session. */
export function requireFullScope(session: StaffSessionPayload): NextResponse | null {
  if (session.scope !== 'full') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  return null;
}
