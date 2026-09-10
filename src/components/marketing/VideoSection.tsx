'use client';

import { useEffect, useRef } from 'react';
import { Eyebrow } from './Eyebrow';

// Story-format brand video, full portrait aspect — design system §06:
// "Full-bleed or inside a 28px frame — never circles." Autoplay-on-scroll:
// muted + playsInline (the only way browsers allow autoplay without a user
// gesture), native controls left on so a viewer can unmute/pause/seek.
// Paused again once scrolled out of view, and skipped entirely under
// prefers-reduced-motion — the spec's "everything becomes instant" rule
// applied to a video means "don't autoplay it".
export function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          video.play().catch(() => {
            // Autoplay can still be blocked (e.g. low-power mode) — the
            // video just sits on its poster frame, controls still work.
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="text-center">
      <Eyebrow>Watch</Eyebrow>
      <h2 className="mt-2 font-display text-3xl">We&apos;re regulars. Are you?</h2>
      <div
        className="mx-auto mt-6 max-w-md overflow-hidden rounded-[28px] bg-ink sm:max-w-lg"
        style={{ boxShadow: '0 8px 24px rgba(28,43,68,.18)' }}
      >
        <video
          ref={videoRef}
          muted
          loop
          controls
          playsInline
          preload="metadata"
          className="aspect-[9/16] w-full object-cover"
          src="/videos/were-regulars-are-you.mp4"
        >
          Sorry, your browser doesn&apos;t support embedded video.
        </video>
      </div>
    </div>
  );
}
