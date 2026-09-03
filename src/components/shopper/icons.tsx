// Minimal inline icon set for the bottom nav — consistent with the rest of
// the app's hand-rolled SVGs rather than pulling in an icon library for four
// glyphs.
export function WalletIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CompassIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-2 6-4 1.5L10.5 10 15 9z" />
    </svg>
  );
}

export function TagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M20.5 12.5 12.5 20.5a1 1 0 0 1-1.4 0l-7.6-7.6a1 1 0 0 1 0-1.4L11.5 3.5a1 1 0 0 1 .7-.3H19a1.5 1.5 0 0 1 1.5 1.5v6.8a1 1 0 0 1-.3.7z" />
      <circle cx="16.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

export function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M12 20.5s-7.5-4.7-9.8-9.4C.6 7.6 2.2 4 6 4c2.2 0 3.6 1.2 6 3.4C14.4 5.2 15.8 4 18 4c3.8 0 5.4 3.6 3.8 7.1C19.5 15.8 12 20.5 12 20.5z" />
    </svg>
  );
}
