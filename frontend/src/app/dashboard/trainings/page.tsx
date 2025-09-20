'use client';

import { useEffect, useMemo, useState } from 'react';

type Training = {
  training_course: string;
  data_source?: string;
  upload_method?: string;
};

export default function Trainings() {
  const [data, setData] = useState<Training[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/data/trainings.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load trainings: ${res.status}`);
        const json: Training[] = await res.json();
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load trainings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter(t =>
      (t.training_course || '').toLowerCase().includes(term) ||
      (t.data_source || '').toLowerCase().includes(term) ||
      (t.upload_method || '').toLowerCase().includes(term)
    );
  }, [q, data]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Trainings</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search trainings, source, upload method..."
          className="w-full sm:w-80 rounded-xl border px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </header>

      {loading && <div className="text-sm text-gray-600">Loading trainings…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-2xl border shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Training Course</th>
                <th className="px-4 py-3 font-medium">Data Source</th>
                <th className="px-4 py-3 font-medium">Upload Method</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={`${t.training_course}-${i}`} className={i % 2 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3 font-medium">{t.training_course}</td>
                  <td className="px-4 py-3"><Badge>{t.data_source || '—'}</Badge></td>
                  <td className="px-4 py-3">{t.upload_method || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={3}>No trainings match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
      {children}
    </span>
  );
}
