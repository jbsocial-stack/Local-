import type { Metadata } from 'next';

// "Add to Home Screen" from any page under a specific merchant should
// reopen straight back into that merchant's till, not the generic /m
// landing page the app-wide manifest (src/app/layout.tsx) points at.
// Overriding `manifest` here for the whole [town]/[merchant] segment means
// it doesn't matter which page (login, scan, settings...) someone actually
// adds — they all resolve to the same per-merchant manifest and so the
// same start_url.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ town: string; merchant: string }>;
}): Promise<Metadata> {
  const { town, merchant } = await params;
  return {
    manifest: `/m/${town}/${merchant}/manifest.webmanifest`,
  };
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
