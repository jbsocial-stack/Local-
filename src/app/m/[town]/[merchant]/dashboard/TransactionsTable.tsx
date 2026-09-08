'use client';

import { useState } from 'react';

interface Row {
  id: string;
  type: string;
  points: number;
  gbp_value_pence: number;
  pass_id: string;
  staff_id: string | null;
  created_at: string;
}

export function TransactionsTable({ merchantId, rows }: { merchantId: string; rows: Row[] }) {
  const [voidedIds, setVoidedIds] = useState<Set<string>>(new Set());

  async function voidTransaction(id: string) {
    const res = await fetch(`/api/merchants/${merchantId}/ledger/${id}/void`, { method: 'POST' });
    if (res.ok) {
      setVoidedIds((s) => new Set(s).add(id));
    }
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-ink/50">
            <th className="px-4 py-2">When</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Points</th>
            <th className="px-4 py-2">Value</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              <td className="px-4 py-2">{new Date(row.created_at).toLocaleString()}</td>
              <td className="px-4 py-2 capitalize">{row.type}</td>
              <td className="px-4 py-2">{row.points}</td>
              <td className="px-4 py-2">£{(row.gbp_value_pence / 100).toFixed(2)}</td>
              <td className="px-4 py-2 text-right">
                {row.type === 'earn' || row.type === 'redeem' ? (
                  voidedIds.has(row.id) ? (
                    <span className="text-ink/40">Voided</span>
                  ) : (
                    <button onClick={() => voidTransaction(row.id)} className="text-red-600">
                      Void
                    </button>
                  )
                ) : null}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-ink/50">
                No transactions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
