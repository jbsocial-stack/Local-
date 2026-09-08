import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Email templates live as plain .html files under public/emails/ — not
 * because they're meant to be browsed (nothing links to them), but because
 * public/ is the one place guaranteed to exist on disk at runtime in a
 * deployed serverless function (same reasoning as the Windsor Pro font
 * file), so a template can be handed to a designer, pasted into Resend's
 * dashboard, or wired into a completely different sender later without
 * this loader changing. `{{token}}` placeholders are replaced verbatim —
 * no HTML-escaping, so callers must not pass unsanitised user input as a
 * variable (every current caller passes only server-controlled strings:
 * town names, referral links it built itself).
 */
export async function renderEmailTemplate(filename: string, vars: Record<string, string>): Promise<string> {
  const raw = await readFile(path.join(process.cwd(), 'public/emails', filename), 'utf8');
  return raw.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => vars[key] ?? match);
}
