'use client';

import { useEffect, useState } from 'react';
import { Cookie, Shield, BarChart3, Settings2 } from 'lucide-react';

export default function CookieConsentAdmin({ days, label }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/cookie-consent?days=${days}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  const periodText = label || (days === 1 ? 'Today' : `last ${days}d`);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 animate-pulse h-40" />
    );
  }

  if (!data?.total) {
    return (
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
        <h3 className="text-white font-bold flex items-center gap-2 mb-2">
          <Cookie className="w-5 h-5 text-amber-400" /> Cookie consent ({periodText})
        </h3>
        <p className="text-gray-400 text-sm">No consent events logged yet. Choices appear when visitors use the cookie banner.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-4">
      <h3 className="text-white font-bold flex items-center gap-2">
        <Cookie className="w-5 h-5 text-amber-400" /> Cookie consent ({periodText})
      </h3>
      <p className="text-gray-400 text-xs">
        Each save is one anonymous log (no name/email). Same visitor may appear more than once if they change settings.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total choices', value: data.total, sub: `${data.today} today` },
          { label: 'Accept all', value: `${data.acceptAllPct}%`, sub: `${data.acceptAll} times` },
          { label: 'Essential only', value: `${data.essentialPct}%`, sub: `${data.essentialOnly} times` },
          { label: 'Custom mix', value: data.custom, sub: 'Saved toggles' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900/80 rounded-xl p-3 border border-gray-700">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-300">
          <Settings2 className="w-4 h-4 text-vd-primary" />
          Functional enabled: <strong className="text-white">{data.functionalEnabled}</strong>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <BarChart3 className="w-4 h-4 text-green-400" />
          Analytics enabled: <strong className="text-white">{data.analyticsEnabled}</strong>
        </div>
      </div>

      <p className="text-xs text-gray-500 flex items-center gap-1">
        <Shield className="w-3 h-3" /> Page visit analytics only run when visitors allow Analytics cookies.
      </p>
    </div>
  );
}
