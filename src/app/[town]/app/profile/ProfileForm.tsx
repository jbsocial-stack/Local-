'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

interface ProfileData {
  displayName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
}

export function ProfileForm({ town, initial }: { town: string; initial: ProfileData }) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [phone, setPhone] = useState(initial.phone);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, phone }),
    });
    setStatus(res.ok ? 'saved' : 'error');
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.set('avatar', file);
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: form });
    if (res.ok) {
      const body = await res.json();
      setAvatarUrl(body.avatarUrl);
    }
    setUploading(false);
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-coral text-xl font-semibold text-cream">
            {(displayName || initial.email || '?')[0]?.toUpperCase()}
          </div>
        )}
        <label className="text-sm font-medium text-coral">
          {uploading ? 'Uploading…' : 'Change photo'}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} className="hidden" />
        </label>
      </div>

      <form onSubmit={save} className="space-y-4 rounded-2xl border border-ink/10 bg-white/60 p-4">
        <label className="block text-sm font-medium">
          Name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-full border border-ink/15 bg-white px-4 py-2.5"
          />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input value={initial.email} disabled className="mt-1 w-full rounded-full border border-ink/10 bg-ink/5 px-4 py-2.5 text-ink/50" />
        </label>
        <label className="block text-sm font-medium">
          Phone
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-full border border-ink/15 bg-white px-4 py-2.5"
          />
        </label>
        <button type="submit" disabled={status === 'saving'} className="rounded-full bg-ink px-6 py-2.5 text-cream">
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {status === 'saved' && <span className="ml-3 text-sm text-green-700">Saved.</span>}
        {status === 'error' && <span className="ml-3 text-sm text-red-600">Could not save.</span>}
      </form>

      <ChangePassword />

      <DeleteAccount town={town} />
    </div>
  );
}

function ChangePassword() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    const { error } = await createBrowserSupabaseClient().auth.updateUser({ password });
    if (error) {
      setStatus('error');
      return;
    }
    setPassword('');
    setStatus('saved');
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-ink/10 bg-white/60 p-4">
      <h2 className="font-semibold">Password</h2>
      <p className="text-sm text-ink/60">
        Set a password so you can sign in without waiting on an email link next time.
      </p>
      <input
        type="password"
        required
        minLength={8}
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-full border border-ink/15 bg-white px-4 py-2.5"
      />
      <button type="submit" disabled={status === 'saving'} className="rounded-full bg-ink px-6 py-2.5 text-cream disabled:opacity-50">
        {status === 'saving' ? 'Saving…' : 'Set password'}
      </button>
      {status === 'saved' && <span className="ml-3 text-sm text-green-700">Saved.</span>}
      {status === 'error' && <span className="ml-3 text-sm text-red-600">Could not save.</span>}
    </form>
  );
}

function DeleteAccount({ town }: { town: string }) {
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<'idle' | 'deleting' | 'error'>('idle');

  async function deleteAccount() {
    setStatus('deleting');
    const res = await fetch('/api/profile/delete', { method: 'POST' });
    if (!res.ok) {
      setStatus('error');
      return;
    }
    await createBrowserSupabaseClient().auth.signOut();
    window.location.href = `/${town}`;
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <h2 className="font-semibold text-red-700">Delete account</h2>
      <p className="mt-1 text-sm text-red-700/80">
        Your passes will be revoked and your personal details removed. This can&apos;t be undone.
      </p>
      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="mt-3 rounded-full border border-red-400 px-4 py-1.5 text-sm text-red-700">
          Delete my account
        </button>
      ) : (
        <div className="mt-3 flex gap-2">
          <button onClick={() => setConfirming(false)} className="rounded-full border border-ink/20 px-4 py-1.5 text-sm">
            Cancel
          </button>
          <button
            onClick={deleteAccount}
            disabled={status === 'deleting'}
            className="rounded-full bg-red-600 px-4 py-1.5 text-sm text-white"
          >
            {status === 'deleting' ? 'Deleting…' : 'Yes, delete everything'}
          </button>
        </div>
      )}
      {status === 'error' && <p className="mt-2 text-sm text-red-700">Something went wrong — try again.</p>}
    </div>
  );
}
