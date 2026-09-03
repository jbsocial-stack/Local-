'use client';

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

function currentUtm(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const value = params.get(key);
    if (value) out[key] = value;
  }
  return out;
}

/**
 * H7: "page view, CTA click, form start, form submit, wallet add, by town
 * and UTM." Pageviews are tracked automatically by Plausible's script; this
 * covers the custom events, with UTM params merged in from the current URL
 * on every call so call sites only need to pass what's specific to them
 * (mainly `town`).
 */
export function track(event: string, props: Record<string, string | number | boolean> = {}): void {
  if (typeof window === 'undefined') return;
  window.plausible?.(event, { props: { ...currentUtm(), ...props } });
}
