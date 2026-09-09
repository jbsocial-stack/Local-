import { Eyebrow } from './Eyebrow';

// Story-format brand video, full portrait aspect — design system §06:
// "Full-bleed or inside a 28px frame — never circles." No autoplay: this
// has a voiceover, so it's controls-first rather than muted-loop.
export function VideoSection() {
  return (
    <div className="text-center">
      <Eyebrow>Watch</Eyebrow>
      <h2 className="mt-2 font-display text-3xl">We&apos;re regulars. Are you?</h2>
      <div
        className="mx-auto mt-6 max-w-md overflow-hidden rounded-[28px] bg-ink sm:max-w-lg"
        style={{ boxShadow: '0 8px 24px rgba(28,43,68,.18)' }}
      >
        <video
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
