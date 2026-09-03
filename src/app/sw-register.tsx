'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Scoped to /m (the merchant PWA) to match manifest.webmanifest's own
    // scope — the marketing site under (marketing) must never be served
    // stale content from this cache after a deploy.
    if ('serviceWorker' in navigator && window.location.pathname.startsWith('/m')) {
      navigator.serviceWorker.register('/sw.js', { scope: '/m' }).catch(() => {
        // Installability is best-effort; scanning/earning works without it.
      });
    }
  }, []);
  return null;
}
