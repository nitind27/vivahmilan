'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Heart, IndianRupee, Plus, Trash2, RefreshCw, ToggleLeft, ToggleRight,
  TrendingUp, Wallet, Receipt, Users, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0);
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full relative transition-all ${value ? 'bg-vd-primary' : 'bg-gray-600'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
}

export default function AdminDonationsPage() {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [campForm, setCampForm] = useState({ title: '', story: '', beneficiaryNote: '', goalAmount: '' });
  const [expForm, setExpForm] = useState({
    title: '', description: '', amount: '', category: 'WEDDING', campaignId: '', expenditureDate: '', receiptNote: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [donRes, cfgRes] = await Promise.all([
        fetch('/api/admin/donations'),
        fetch('/api/admin/siteconfig'),
      ]);
      const don = await donRes.json();
      const cfg = await cfgRes.json();
      if (!donRes.ok) throw new Error(don.error);
      setData(don);
      setConfig(cfg);
    } catch (e) {
      toast.error(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveConfig = async (key, value) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/siteconfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error('Save failed');
      setConfig((p) => ({ ...p, [key]: value }));
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addCampaign = async () => {
    if (!campForm.title.trim()) return toast.error('Title required');
    const res = await fetch('/api/admin/donations/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...campForm,
        goalAmount: campForm.goalAmount ? Number(campForm.goalAmount) : null,
      }),
    });
    if (!res.ok) return toast.error((await res.json()).error || 'Failed');
    toast.success('Campaign added');
    setCampForm({ title: '', story: '', beneficiaryNote: '', goalAmount: '' });
    load();
  };

  const addExpenditure = async () => {
    const res = await fetch('/api/admin/donations/expenditures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...expForm,
        amount: Number(expForm.amount),
        campaignId: expForm.campaignId || null,
      }),
    });
    const j = await res.json();
    if (!res.ok) return toast.error(j.error || 'Failed');
    toast.success('Expense published — visible to all donors');
    setExpForm({ title: '', description: '', amount: '', category: 'WEDDING', campaignId: '', expenditureDate: '', receiptNote: '' });
    load();
  };

  const deleteExp = async (id) => {
    if (!confirm('Remove this expense entry from public transparency?')) return;
    await fetch(`/api/admin/donations/expenditures/${id}`, { method: 'DELETE' });
    toast.success('Removed');
    load();
  };

  const deactivateCampaign = async (id) => {
    await fetch(`/api/admin/donations/campaigns/${id}`, { method: 'DELETE' });
    toast.success('Campaign hidden');
    load();
  };

  const enabled = config.donation_enabled === '1';
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'payments', label: 'Donations' },
    { id: 'campaigns', label: 'Beneficiaries' },
    { id: 'expenses', label: 'Fund usage' },
    { id: 'settings', label: 'Settings' },
  ];

  if (loading && !data) {
    return <div className="text-center py-20 text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  const stats = data?.stats || {};

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-7 h-7 text-pink-400" /> Wedding Donations
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Live payments, public transparency, full admin control. Toggle off to hide from users.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
          <span className="text-sm text-gray-300">User-facing page</span>
          <Toggle
            value={enabled}
            onChange={(v) => saveConfig('donation_enabled', v ? '1' : '0')}
          />
          <span className={`text-xs font-bold ${enabled ? 'text-green-400' : 'text-gray-500'}`}>
            {enabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-vd-primary text-white' : 'text-gray-400 hover:bg-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button type="button" onClick={load} className="ml-auto p-2 text-gray-400 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {tab === 'overview' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Received', value: formatINR(stats.totalReceived), icon: TrendingUp },
            { label: 'Spent (published)', value: formatINR(stats.totalSpent), icon: Receipt },
            { label: 'Balance', value: formatINR(stats.balance), icon: Wallet },
            { label: 'Donors', value: stats.donorCount, icon: Users },
          ].map((s) => (
            <div key={s.label} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <s.icon className="w-5 h-5 text-vd-primary mb-2" />
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'payments' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-700">
                <th className="px-4 py-3 text-left">Donor</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Campaign</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.payments || []).map((p) => (
                <tr key={p.id} className="border-b border-gray-800 text-gray-300">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{p.isAnonymous ? 'Anonymous' : p.donorName}</p>
                    <p className="text-xs text-gray-500">{p.donorEmail}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-green-400">{formatINR(p.amount)}</td>
                  <td className="px-4 py-3">{p.campaignTitle || 'General fund'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === 'PAID' ? 'bg-green-900/40 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {p.paidAt ? format(new Date(p.paidAt), 'dd MMM yyyy HH:mm') : format(new Date(p.createdAt), 'dd MMM yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 space-y-3">
            <h3 className="font-bold text-white">Add beneficiary / case</h3>
            <input
              placeholder="Title (e.g. Support for Priya's wedding)"
              value={campForm.title}
              onChange={(e) => setCampForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white"
            />
            <input
              placeholder="Short note (e.g. Orphan, no parental support)"
              value={campForm.beneficiaryNote}
              onChange={(e) => setCampForm((f) => ({ ...f, beneficiaryNote: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white"
            />
            <textarea
              placeholder="Full story (shown on donate page)"
              rows={3}
              value={campForm.story}
              onChange={(e) => setCampForm((f) => ({ ...f, story: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white resize-none"
            />
            <input
              type="number"
              placeholder="Goal amount ₹ (optional)"
              value={campForm.goalAmount}
              onChange={(e) => setCampForm((f) => ({ ...f, goalAmount: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white"
            />
            <button type="button" onClick={addCampaign} className="w-full py-2.5 vd-gradient-gold text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="space-y-3">
            {(data?.campaigns || []).map((c) => (
              <div key={c.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{c.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{c.beneficiaryNote}</p>
                  <p className="text-sm text-green-400 mt-2">Raised {formatINR(c.raisedAmount)}</p>
                  {!c.isActive && <span className="text-xs text-red-400">Hidden</span>}
                </div>
                {c.isActive ? (
                  <button type="button" onClick={() => deactivateCampaign(c.id)} className="text-red-400 hover:text-red-300 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 space-y-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-amber-400" /> Publish fund usage
            </h3>
            <p className="text-xs text-gray-500">Donors see this on /donate — builds trust.</p>
            <input
              placeholder="Title *"
              value={expForm.title}
              onChange={(e) => setExpForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white"
            />
            <textarea
              placeholder="Description — what was paid, for whom *"
              rows={3}
              value={expForm.description}
              onChange={(e) => setExpForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white resize-none"
            />
            <input
              type="number"
              placeholder="Amount ₹ *"
              value={expForm.amount}
              onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white"
            />
            <select
              value={expForm.category}
              onChange={(e) => setExpForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white"
            >
              {(data?.categories || []).map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <select
              value={expForm.campaignId}
              onChange={(e) => setExpForm((f) => ({ ...f, campaignId: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white"
            >
              <option value="">General fund</option>
              {(data?.campaigns || []).filter((c) => c.isActive).map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <input
              type="date"
              value={expForm.expenditureDate}
              onChange={(e) => setExpForm((f) => ({ ...f, expenditureDate: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white"
            />
            <input
              placeholder="Receipt / reference note"
              value={expForm.receiptNote}
              onChange={(e) => setExpForm((f) => ({ ...f, receiptNote: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white"
            />
            <button type="button" onClick={addExpenditure} disabled={saving} className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold">
              Publish expense
            </button>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {(data?.expenditures || []).map((e) => (
              <div key={e.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                <div className="flex justify-between gap-2">
                  <p className="font-semibold text-white">{e.title}</p>
                  <p className="font-bold text-amber-400">{formatINR(e.amount)}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">{e.expenditureDate} · {e.category}</p>
                <p className="text-sm text-gray-400 mt-2">{e.description}</p>
                <button type="button" onClick={() => deleteExp(e.id)} className="text-xs text-red-400 mt-2 hover:underline">Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4 max-w-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-white">Enable donation feature</p>
              <p className="text-xs text-gray-500">OFF = /donate hidden from users & navbar</p>
            </div>
            <button type="button" onClick={() => saveConfig('donation_enabled', enabled ? '0' : '1')} className="flex items-center gap-2 text-sm">
              {enabled ? <ToggleRight className="w-8 h-8 text-green-400" /> : <ToggleLeft className="w-8 h-8 text-gray-500" />}
            </button>
          </div>
          {['donation_page_title', 'donation_page_subtitle', 'donation_transparency_note'].map((key) => (
            <div key={key}>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">{key.replace(/donation_/g, '').replace(/_/g, ' ')}</label>
              <textarea
                rows={key.includes('note') || key.includes('subtitle') ? 3 : 1}
                value={config[key] || ''}
                onChange={(e) => setConfig((p) => ({ ...p, [key]: e.target.value }))}
                onBlur={(e) => saveConfig(key, e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white resize-none"
              />
            </div>
          ))}
          <a href="/donate" target="_blank" rel="noopener noreferrer" className="text-sm text-vd-primary hover:underline">
            Preview user page →
          </a>
        </div>
      )}
    </div>
  );
}
