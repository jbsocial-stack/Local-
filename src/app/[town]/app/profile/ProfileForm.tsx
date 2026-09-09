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

      <form onSubmit={save} className="space-y-4 rounded-[28px] bg-paper p-4">
        <label className="block text-sm font-medium">
          Name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 h-11 w-full rounded-2xl border border-line bg-cream px-4 focus:border-2 focus:border-ink focus:outline-none"
          />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input
            value={initial.email}
            disabled
            className="mt-1 h-11 w-full rounded-2xl border border-line bg-line px-4 text-ink-muted"
          />
        </label>
        <label className="block text-sm font-medium">
          Phone
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 h-11 w-full rounded-2xl border border-line bg-cream px-4 focus:border-2 focus:border-ink focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={status === 'saving'}
          className="flex h-11 items-center rounded-full bg-ink px-6 text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-2 disabled:opacity-40"
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {status === 'saved' && <span className="ml-3 text-sm text-success">Saved.</span>}
        {status === 'error' && <span className="ml-3 text-sm text-error">Could not save.</span>}
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
    <form onSubmit={submit} className="space-y-3 rounded-[28px] bg-paper p-4">
      <h2 className="font-h3 text-lg">Password</h2>
      <p className="text-sm text-ink-muted">
        Set a password so you can sign in without waiting on an email link next time.
      </p>
      <input
        type="password"
        required
        minLength={8}
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="h-11 w-full rounded-2xl border border-line bg-cream px-4 placeholder:text-ink-muted focus:border-2 focus:border-ink focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === 'saving'}
        className="flex h-11 items-center rounded-full bg-ink px-6 text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-2 disabled:opacity-40"
      >
        {status === 'saving' ? 'Saving…' : 'Set password'}
      </button>
      {status === 'saved' && <span className="ml-3 text-sm text-success">Saved.</span>}
      {status === 'error' && <span className="ml-3 text-sm text-error">Could not save.</span>}
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
    <div className="rounded-[28px] bg-error/10 p-4">
      <h2 className="font-h3 text-lg text-error">Delete account</h2>
      <p className="mt-1 text-sm text-error/80">
        Your passes will be revoked and your personal details removed. This can&apos;t be undone.
      </p>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="mt-3 flex h-9 items-center rounded-full border-[1.5px] border-error px-4 text-sm text-error transition-colors duration-150 hover:bg-error/10"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            className="flex h-9 items-center rounded-full border-[1.5px] border-ink px-4 text-sm text-ink transition-colors duration-150 hover:bg-ink/5"
          >
            Cancel
          </button>
          <button
            onClick={deleteAccount}
            disabled={status === 'deleting'}
            className="flex h-9 items-center rounded-full bg-error px-4 text-sm text-cream transition duration-150 ease-out hover:brightness-95 disabled:opacity-40"
          >
            {status === 'deleting' ? 'Deleting…' : 'Yes, delete everything'}
          </button>
        </div>
      )}
      {status === 'error' && <p className="mt-2 text-sm text-error">Something went wrong — try again.</p>}
    </div>
  );
}
