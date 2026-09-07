// Decorative background for the marketing homepage — a repeating navy
// line-art pattern (public/icons/decor/pattern-navy.svg, tiling a scatter
// of the icon pack in public/icons/decor/) sitting behind every section.
// A CSS background-image (not individually positioned icons) so it covers
// the full page at every breakpoint, including mobile, without needing to
// know the page's actual height. Purely decorative: aria-hidden,
// pointer-events-none, and z-indexed behind SectionBand's stacking cards
// (which start at z-index 10) so it never competes with that effect.
export function DecorField() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 bg-[length:220px_220px] bg-repeat sm:bg-[length:260px_260px]"
      style={{ backgroundImage: "url('/icons/decor/pattern-navy.svg')" }}
    />
  );
}
