'use client';
import { useEffect, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${value ? 'bg-vd-primary' : 'bg-gray-600'}`}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </div>
  );
}

export default function SiteConfigPage() {
  const [config, setConfig] = useState({ freeTrialDays: '1' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/siteconfig').then(r => r.json()).then(setConfig).catch(() => {});
  }, []);

  const save = async (key, value) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/siteconfig', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) });
      if (res.ok) toast.success('Saved'); else toast.error('Failed');
    } finally { setSaving(false); }
  };

  const saveMultiple = async (pairs) => {
    setSaving(true);
    try {
      await Promise.all(pairs.map(([k, v]) => fetch('/api/admin/siteconfig', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: k, value: v }) })));
      toast.success('Saved');
    } finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white";

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-gray-400 text-sm">Configure global site settings. Changes take effect immediately.</p>

      {/* Maintenance Mode */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.maintenance_mode !== '1' ? 'bg-red-900/30' : 'bg-green-900/20'}`}>
            {config.maintenance_mode !== '1' ? <Lock className="w-5 h-5 text-red-400" /> : <Unlock className="w-5 h-5 text-green-400" />}
          </div>
          <div>
            <h3 className="font-bold text-white">Maintenance Mode</h3>
            <p className="text-xs text-gray-500">1 = Site Live. 0 = Maintenance page shown.</p>
          </div>
        </div>
        <div className={`flex items-center justify-between p-4 rounded-xl border ${config.maintenance_mode !== '1' ? 'bg-red-900/10 border-red-800/40' : 'bg-green-900/10 border-green-800/30'}`}>
          <div>
            <p className="text-sm font-semibold text-white">Site is <span className={config.maintenance_mode !== '1' ? 'text-red-400' : 'text-green-400'}>{config.maintenance_mode !== '1' ? '🔴 Under Maintenance' : '🟢 Live'}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{config.maintenance_mode !== '1' ? 'Users see maintenance page' : 'Site accessible to all users'}</p>
          </div>
          <Toggle value={config.maintenance_mode === '1'} onChange={async (val) => {
            const newVal = val ? '1' : '0';
            setConfig(p => ({ ...p, maintenance_mode: newVal }));
            const res = await fetch('/api/admin/siteconfig', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'maintenance_mode', value: newVal }) });
            if (res.ok) toast.success(val ? '🟢 Site is now Live' : '🔴 Maintenance mode ON');
            else { toast.error('Failed'); setConfig(p => ({ ...p, maintenance_mode: val ? '0' : '1' })); }
          }} />
        </div>
      </div>

      {/* Free Trial */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
        <h3 className="font-bold text-lg text-white">Free Trial Settings</h3>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Free Trial Duration (days) — 0 to disable</label>
          <div className="flex gap-3 items-center">
            <input type="number" min="0" max="365" value={config.freeTrialDays ?? '1'} onChange={e => setConfig(p => ({ ...p, freeTrialDays: e.target.value }))} className="w-32 px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" />
            <span className="text-gray-400 text-sm">days</span>
          </div>
        </div>
        <button disabled={saving} onClick={() => save('freeTrialDays', config.freeTrialDays)} className="vd-gradient-gold text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {/* Site Identity */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
        <h3 className="font-bold text-lg text-white">Site Identity</h3>
        <div><label className="text-xs text-gray-400 mb-1 block">Site Name</label><input value={config.site_name || ''} onChange={e => setConfig(p => ({ ...p, site_name: e.target.value }))} placeholder="e.g. Vivah Dwar" className={inp} /></div>
        <div><label className="text-xs text-gray-400 mb-1 block">Footer Tagline</label><input value={config.footer_tagline || ''} onChange={e => setConfig(p => ({ ...p, footer_tagline: e.target.value }))} placeholder="Find your perfect life partner…" className={inp} /></div>
        <button disabled={saving} onClick={() => saveMultiple([['site_name', config.site_name || ''], ['footer_tagline', config.footer_tagline || '']])}
          className="vd-gradient-gold text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
      </div>

      {/* CTA */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
        <h3 className="font-bold text-lg text-white">CTA Section</h3>
        <div><label className="text-xs text-gray-400 mb-1 block">Heading</label><input value={config.cta_heading || ''} onChange={e => setConfig(p => ({ ...p, cta_heading: e.target.value }))} placeholder="Ready to Find Your Soulmate?" className={inp} /></div>
        <div><label className="text-xs text-gray-400 mb-1 block">Subtext</label><input value={config.cta_subtext || ''} onChange={e => setConfig(p => ({ ...p, cta_subtext: e.target.value }))} placeholder="Join millions of happy couples…" className={inp} /></div>
        <button disabled={saving} onClick={() => saveMultiple([['cta_heading', config.cta_heading || ''], ['cta_subtext', config.cta_subtext || '']])}
          className="vd-gradient-gold text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );
}
