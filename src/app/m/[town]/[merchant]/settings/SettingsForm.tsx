'use client';

import { useEffect, useState } from 'react';
import type { Database } from '@/lib/supabase/types';

type Merchant = Database['public']['Tables']['merchants']['Row'];
type Boost = Database['public']['Tables']['merchant_boosts']['Row'];
type Staff = Pick<Database['public']['Tables']['merchant_users']['Row'], 'id' | 'name' | 'role' | 'email'>;
type Photo = Database['public']['Tables']['merchant_photos']['Row'];

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type DayHours = { open: string; close: string } | null;
type Hours = Partial<Record<(typeof DAYS)[number], DayHours>>;

export function SettingsForm({
  merchant,
  boosts,
  staff,
  photos,
  sumupConnected,
}: {
  merchant: Merchant;
  boosts: Boost[];
  staff: Staff[];
  photos: Photo[];
  sumupConnected: boolean;
}) {
  return (
    <div className="mt-6 space-y-8">
      <DetailsSection merchant={merchant} />
      <PhotoSection merchant={merchant} />
      <GallerySection merchantId={merchant.id} photos={photos} />
      <SocialLinksSection merchant={merchant} />
      <BoostsSection merchantId={merchant.id} boosts={boosts} />
      <StaffSection merchantId={merchant.id} staff={staff} />
      <PrintablesSection merchantId={merchant.id} />
      <SumUpSection merchantId={merchant.id} connected={sumupConnected} />
    </div>
  );
}

function SumUpSection({ merchantId, connected }: { merchantId: string; connected: boolean }) {
  const [justConnected, setJustConnected] = useState(false);
  const [justErrored, setJustErrored] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setJustConnected(params.get('sumup') === 'connected');
    setJustErrored(params.get('sumup') === 'error');
  }, []);

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="font-semibold">SumUp</h2>
      <p className="mt-1 text-sm text-ink/60">
        Connect your SumUp account so a card payment on your terminal can award points automatically — this is
        early: for now it only records what SumUp tells us, it doesn&apos;t award points yet.
      </p>
      {justConnected && <p className="mt-2 text-sm font-medium text-green-700">Connected.</p>}
      {justErrored && <p className="mt-2 text-sm font-medium text-red-600">Couldn&apos;t connect — try again.</p>}
      <p className="mt-3 text-sm">
        {connected ? (
          <span className="font-medium text-green-700">Connected</span>
        ) : (
          <a
            href={`/api/merchants/${merchantId}/sumup/connect`}
            className="rounded-full border border-ink/20 px-4 py-1.5 text-ink"
          >
            Connect SumUp
          </a>
        )}
      </p>
    </div>
  );
}

function DetailsSection({ merchant }: { merchant: Merchant }) {
  const [name, setName] = useState(merchant.name);
  const [category, setCategory] = useState(merchant.category);
  const [address, setAddress] = useState(merchant.address);
  const [description, setDescription] = useState(merchant.description ?? '');
  const [baseMultiplier, setBaseMultiplier] = useState(merchant.base_multiplier);
  const [hours, setHours] = useState<Hours>((merchant.hours as Hours) ?? {});
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  function setDay(day: (typeof DAYS)[number], value: DayHours) {
    setHours((h) => ({ ...h, [day]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setError(null);
    const res = await fetch(`/api/merchants/${merchant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, address, description, baseMultiplier, hours }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message ?? 'Could not save changes');
      setStatus('error');
      return;
    }
    setStatus('saved');
  }

  return (
    <form onSubmit={save} className="rounded-xl bg-white p-6 shadow space-y-4">
      <h2 className="font-semibold">Details</h2>
      <label className="block text-sm">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Category
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Address
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Base multiplier
        <select
          value={baseMultiplier}
          onChange={(e) => setBaseMultiplier(Number(e.target.value))}
          className="mt-1 w-full rounded border px-3 py-2"
        >
          {[1, 2, 3, 4, 5].map((m) => (
            <option key={m} value={m}>
              {m}x
            </option>
          ))}
        </select>
      </label>

      <div>
        <p className="text-sm font-medium">Opening hours</p>
        <div className="mt-2 space-y-2">
          {DAYS.map((day) => {
            const value = hours[day] ?? null;
            return (
              <div key={day} className="flex items-center gap-2 text-sm">
                <span className="w-10 uppercase text-ink/50">{day}</span>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={value === null}
                    onChange={(e) => setDay(day, e.target.checked ? null : { open: '09:00', close: '17:00' })}
                  />
                  Closed
                </label>
                {value && (
                  <>
                    <input
                      type="time"
                      value={value.open}
                      onChange={(e) => setDay(day, { ...value, open: e.target.value })}
                      className="rounded border px-2 py-1"
                    />
                    <span>–</span>
                    <input
                      type="time"
                      value={value.close}
                      onChange={(e) => setDay(day, { ...value, close: e.target.value })}
                      className="rounded border px-2 py-1"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button type="submit" disabled={status === 'saving'} className="rounded-full bg-coral text-white px-6 py-2">
        {status === 'saving' ? 'Saving…' : 'Save details'}
      </button>
      {status === 'saved' && <p className="text-sm text-green-700">Saved.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

function PhotoSection({ merchant }: { merchant: Merchant }) {
  const [photoUrl, setPhotoUrl] = useState(merchant.photo_url);
  const [uploading, setUploading] = useState(false);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.set('photo', file);
    const res = await fetch(`/api/merchants/${merchant.id}/photo`, { method: 'POST', body: form });
    if (res.ok) {
      const body = await res.json();
      setPhotoUrl(body.photoUrl);
    }
    setUploading(false);
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="font-semibold">Photo</h2>
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={merchant.name} className="mt-3 h-32 w-32 rounded-lg object-cover" />
      )}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} className="mt-3" disabled={uploading} />
    </div>
  );
}

function GallerySection({ merchantId, photos: initialPhotos }: { merchantId: string; photos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.set('photo', file);
    const res = await fetch(`/api/merchants/${merchantId}/photos`, { method: 'POST', body: form });
    if (res.ok) {
      const body = await res.json();
      setPhotos((p) => [...p, body.photo]);
    }
    setUploading(false);
  }

  async function remove(photoId: string) {
    await fetch(`/api/merchants/${merchantId}/photos/${photoId}`, { method: 'DELETE' });
    setPhotos((p) => p.filter((x) => x.id !== photoId));
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="font-semibold">Gallery</h2>
      <p className="mt-1 text-sm text-ink/60">Shown on your Discover page — the more, the better.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {photos.map((p) => (
          <div key={p.id} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="h-20 w-20 rounded-lg object-cover" />
            <button
              onClick={() => remove(p.id)}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-white"
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={upload}
        className="mt-3"
        disabled={uploading}
      />
    </div>
  );
}

function SocialLinksSection({ merchant }: { merchant: Merchant }) {
  const initial = (merchant.social_links as Record<string, string>) ?? {};
  const [instagram, setInstagram] = useState(initial.instagram ?? '');
  const [facebook, setFacebook] = useState(initial.facebook ?? '');
  const [twitter, setTwitter] = useState(initial.twitter ?? '');
  const [website, setWebsite] = useState(initial.website ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    const socialLinks: Record<string, string> = {};
    if (instagram) socialLinks.instagram = instagram;
    if (facebook) socialLinks.facebook = facebook;
    if (twitter) socialLinks.twitter = twitter;
    if (website) socialLinks.website = website;
    const res = await fetch(`/api/merchants/${merchant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ socialLinks }),
    });
    setStatus(res.ok ? 'saved' : 'error');
  }

  return (
    <form onSubmit={save} className="rounded-xl bg-white p-6 shadow space-y-3">
      <h2 className="font-semibold">Social links</h2>
      <p className="text-sm text-ink/60">Shown on your Discover page — leave any blank you don&apos;t use.</p>
      {[
        { label: 'Instagram', value: instagram, set: setInstagram },
        { label: 'Facebook', value: facebook, set: setFacebook },
        { label: 'Twitter / X', value: twitter, set: setTwitter },
        { label: 'Website', value: website, set: setWebsite },
      ].map(({ label, value, set }) => (
        <label key={label} className="block text-sm">
          {label}
          <input
            type="url"
            placeholder="https://…"
            value={value}
            onChange={(e) => set(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
      ))}
      <button type="submit" disabled={status === 'saving'} className="rounded-full bg-coral text-white px-6 py-2">
        {status === 'saving' ? 'Saving…' : 'Save links'}
      </button>
      {status === 'saved' && <span className="ml-3 text-sm text-green-700">Saved.</span>}
      {status === 'error' && <span className="ml-3 text-sm text-red-600">Could not save — check the URLs.</span>}
    </form>
  );
}

function BoostsSection({ merchantId, boosts: initialBoosts }: { merchantId: string; boosts: Boost[] }) {
  const [boosts, setBoosts] = useState(initialBoosts);
  const [multiplier, setMultiplier] = useState(2);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function addBoost(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/merchants/${merchantId}/boosts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        multiplier,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        label: label || null,
      }),
    });
    if (!res.ok) {
      setError('Could not create boost — check the dates.');
      return;
    }
    const body = await res.json();
    setBoosts((b) => [...b, body.boost]);
    setLabel('');
  }

  async function removeBoost(id: string) {
    await fetch(`/api/merchants/${merchantId}/boosts/${id}`, { method: 'DELETE' });
    setBoosts((b) => b.filter((x) => x.id !== id));
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="font-semibold">Scheduled boosts</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {boosts.map((b) => (
          <li key={b.id} className="flex items-center justify-between rounded border px-3 py-2">
            <span>
              {b.multiplier}x — {new Date(b.starts_at).toLocaleString()} to{' '}
              {new Date(b.ends_at).toLocaleString()} {b.label && `(${b.label})`}
            </span>
            <button onClick={() => removeBoost(b.id)} className="text-red-600">
              Remove
            </button>
          </li>
        ))}
        {boosts.length === 0 && <li className="text-ink/50">No boosts scheduled.</li>}
      </ul>

      <form onSubmit={addBoost} className="mt-4 space-y-2 text-sm">
        <div className="flex gap-2">
          <select value={multiplier} onChange={(e) => setMultiplier(Number(e.target.value))} className="rounded border px-2 py-1">
            {[1, 2, 3, 4, 5].map((m) => (
              <option key={m} value={m}>
                {m}x
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="rounded border px-2 py-1"
          />
          <input
            type="datetime-local"
            required
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="rounded border px-2 py-1"
          />
        </div>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="w-full rounded border px-2 py-1"
        />
        <button type="submit" className="rounded-full bg-coral text-white px-4 py-1.5">
          Add boost
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </div>
  );
}

function StaffSection({ merchantId, staff: initialStaff }: { merchantId: string; staff: Staff[] }) {
  const [staff, setStaff] = useState(initialStaff);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/merchants/${merchantId}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, pin }),
    });
    if (!res.ok) {
      setError('Could not add staff — PIN must be 4 digits.');
      return;
    }
    const body = await res.json();
    setStaff((s) => [...s, body.staff]);
    setName('');
    setPin('');
  }

  async function removeStaff(id: string) {
    await fetch(`/api/merchants/${merchantId}/staff/${id}`, { method: 'DELETE' });
    setStaff((s) => s.filter((x) => x.id !== id));
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="font-semibold">Staff</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {staff.map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded border px-3 py-2">
            <span>
              {s.name} — {s.role}
            </span>
            {s.role === 'staff' && (
              <button onClick={() => removeStaff(s.id)} className="text-red-600">
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={addStaff} className="mt-4 flex gap-2 text-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Staff name"
          required
          className="flex-1 rounded border px-2 py-1"
        />
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="4-digit PIN"
          inputMode="numeric"
          pattern="\d{4}"
          required
          className="w-28 rounded border px-2 py-1"
        />
        <button type="submit" className="rounded-full bg-coral text-white px-4 py-1.5">
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function PrintablesSection({ merchantId }: { merchantId: string }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="font-semibold">Printables</h2>
      <p className="mt-1 text-sm text-ink/60">Put these in your window so customers ask about the scheme.</p>
      <div className="mt-3 flex gap-3 text-sm">
        <a href={`/api/merchants/${merchantId}/printables?kind=poster`} className="rounded-full border border-ink/20 px-4 py-1.5 text-ink">
          A4 poster
        </a>
        <a href={`/api/merchants/${merchantId}/printables?kind=sticker`} className="rounded-full border border-ink/20 px-4 py-1.5 text-ink">
          Window sticker
        </a>
      </div>
    </div>
  );
}
