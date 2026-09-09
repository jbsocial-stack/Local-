'use client';

import { useState } from 'react';
import type { LeadCategory, LeadStatus, MerchantTier } from '@/lib/supabase/types';

interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  town_slug: string;
  venues: MerchantTier;
  category: LeadCategory;
  notes: string | null;
  status: LeadStatus;
  created_at: string;
}

const STATUSES: LeadStatus[] = ['new', 'contacted', 'trial', 'live', 'lost'];

const STATUS_STYLE: Record<LeadStatus, string> = {
  new: 'bg-coral-soft text-coral',
  contacted: 'bg-line text-ink',
  trial: 'bg-ink text-cream',
  live: 'bg-coral text-cream',
  lost: 'bg-line text-ink-muted',
};

export function LeadsPanel({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);

  async function setStatus(id: string, status: LeadStatus) {
    const res = await fetch(`/api/ops/leads/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const body = await res.json();
      setLeads((ls) => ls.map((l) => (l.id === id ? body.lead : l)));
    }
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl bg-paper">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-ink-muted">
            <th className="px-4 py-2">Business</th>
            <th className="px-4 py-2">Contact</th>
            <th className="px-4 py-2">Town</th>
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2">Sites</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Received</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => (
            <tr key={lead.id} className={`align-top ${i % 2 === 1 ? 'bg-line/40' : ''}`}>
              <td className="px-4 py-2 font-medium text-ink">{lead.business_name}</td>
              <td className="px-4 py-2">
                <p className="text-ink">{lead.contact_name}</p>
                <p className="text-ink-muted">
                  <a href={`mailto:${lead.email}`} className="underline">
                    {lead.email}
                  </a>
                  {lead.phone ? ` · ${lead.phone}` : ''}
                </p>
                {lead.notes && <p className="mt-1 text-xs text-ink-muted">{lead.notes}</p>}
              </td>
              <td className="px-4 py-2 capitalize">{lead.town_slug}</td>
              <td className="px-4 py-2 capitalize">{lead.category}</td>
              <td className="px-4 py-2">{lead.venues}</td>
              <td className="px-4 py-2">
                <select
                  value={lead.status}
                  onChange={(e) => setStatus(lead.id, e.target.value as LeadStatus)}
                  className={`rounded-full border-none px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[lead.status]}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-2 text-ink-muted">{new Date(lead.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-ink-muted">
                No leads yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
