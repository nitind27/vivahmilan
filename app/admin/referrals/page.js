'use client';
import { useEffect, useState } from 'react';
import { RefreshCw, Gift, Users, UserPlus } from 'lucide-react';

export default function ReferralsAdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('referrers');

  const load = () => {
    setLoading(true);
    fetch('/api/admin/referrals')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const s = data?.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Referral Program</h1>
          <p className="text-sm text-gray-400">Track refer codes and sign-ups</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <Gift className="w-8 h-8 text-vd-primary mb-2" />
          <p className="text-2xl font-bold text-white">{s.totalReferrals ?? '—'}</p>
          <p className="text-sm text-gray-400">Total Referrals</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <Users className="w-8 h-8 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-white">{s.activeReferrers ?? '—'}</p>
          <p className="text-sm text-gray-400">Active Referrers</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <UserPlus className="w-8 h-8 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{s.totalCodes ?? '—'}</p>
          <p className="text-sm text-gray-400">Referral Codes</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('referrers')} className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab === 'referrers' ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
          Top Referrers
        </button>
        <button onClick={() => setTab('referred')} className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab === 'referred' ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
          Referred Sign-ups
        </button>
      </div>

      {tab === 'referrers' ? (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left border-b border-gray-700">
                <th className="p-3">Member</th>
                <th className="p-3">Code</th>
                <th className="p-3">Referrals</th>
                <th className="p-3">Premium</th>
              </tr>
            </thead>
            <tbody>
              {(data?.referrers || []).map(r => (
                <tr key={r.id} className="border-b border-gray-700/50">
                  <td className="p-3 text-white">{r.name}<div className="text-xs text-gray-500">{r.email}</div></td>
                  <td className="p-3 font-mono text-vd-primary">{r.referralCode}</td>
                  <td className="p-3 text-white font-bold">{r.totalReferrals}</td>
                  <td className="p-3 text-gray-400">{r.isPremium ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left border-b border-gray-700">
                <th className="p-3">New Member</th>
                <th className="p-3">Referred By</th>
                <th className="p-3">Code Used</th>
                <th className="p-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(data?.referredUsers || []).map(r => (
                <tr key={r.referredUserId} className="border-b border-gray-700/50">
                  <td className="p-3 text-white">{r.referredName}</td>
                  <td className="p-3 text-gray-300">{r.referrerName}</td>
                  <td className="p-3 font-mono text-vd-primary text-xs">{r.referralCode}</td>
                  <td className="p-3 text-gray-400 text-xs">{new Date(r.joinedAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data?.referredUsers || []).length === 0 && (
            <p className="text-center text-gray-500 py-10 text-sm">No referred sign-ups yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
