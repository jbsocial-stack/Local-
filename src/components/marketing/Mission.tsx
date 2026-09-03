import { Eyebrow } from './Eyebrow';

export function Mission() {
  return (
    <div className="text-center">
      <Eyebrow tone="cream">Our mission</Eyebrow>
      <p className="mt-4 font-display text-3xl leading-tight md:text-5xl">
        Bring <span className="text-accent-yellow">life</span> back to our high streets by rewarding
        customers and unlocking collective loyalty marketing for independent businesses.
      </p>
    </div>
  );
}
