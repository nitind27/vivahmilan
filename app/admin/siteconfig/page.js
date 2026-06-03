'use client';
import { useEffect, useState } from 'react';
import { Lock, Unlock, DoorOpen, Phone } from 'lucide-react';
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

      {/* Welcome page gate */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.welcome_gate_enabled === '1' ? 'bg-amber-900/30' : 'bg-gray-700'}`}>
            <DoorOpen className={`w-5 h-5 ${config.welcome_gate_enabled === '1' ? 'text-amber-400' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="font-bold text-white">Welcome Page Gate</h3>
            <p className="text-xs text-gray-500">
              ON = visitors must log in on <code className="text-amber-300/90">/welcome.html</code> before using the site. OFF = website opens directly.
            </p>
          </div>
        </div>
        <div className={`flex items-center justify-between p-4 rounded-xl border ${config.welcome_gate_enabled === '1' ? 'bg-amber-900/10 border-amber-800/40' : 'bg-green-900/10 border-green-800/30'}`}>
          <div>
            <p className="text-sm font-semibold text-white">
              Welcome gate is{' '}
              <span className={config.welcome_gate_enabled === '1' ? 'text-amber-400' : 'text-green-400'}>
                {config.welcome_gate_enabled === '1' ? '🔒 ON' : '🟢 OFF'}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {config.welcome_gate_enabled === '1'
                ? 'New visitors see welcome page + preview login first'
                : 'Users go straight to homepage and all pages'}
            </p>
          </div>
          <Toggle
            value={config.welcome_gate_enabled === '1'}
            onChange={async (val) => {
              const newVal = val ? '1' : '0';
              setConfig(p => ({ ...p, welcome_gate_enabled: newVal }));
              const res = await fetch('/api/admin/siteconfig', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'welcome_gate_enabled', value: newVal }),
              });
              if (res.ok) toast.success(val ? 'Welcome gate enabled' : 'Welcome gate disabled — site is open');
              else {
                toast.error('Failed');
                setConfig(p => ({ ...p, welcome_gate_enabled: val ? '0' : '1' }));
              }
            }}
          />
        </div>
      </div>

      {/* User Portal Access — post-verification launch gate */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.user_portal_access === '1' ? 'bg-green-900/20' : 'bg-amber-900/30'}`}>
            {config.user_portal_access === '1'
              ? <Unlock className="w-5 h-5 text-green-400" />
              : <Lock className="w-5 h-5 text-amber-400" />}
          </div>
          <div>
            <h3 className="font-bold text-white">User Portal Access</h3>
            <p className="text-xs text-gray-500">
              OFF = verified users can log in but see the profile launch page. ON = full website access.
            </p>
          </div>
        </div>
        <div className={`flex items-center justify-between p-4 rounded-xl border ${config.user_portal_access === '1' ? 'bg-green-900/10 border-green-800/30' : 'bg-amber-900/10 border-amber-800/40'}`}>
          <div>
            <p className="text-sm font-semibold text-white">
              Portal is{' '}
              <span className={config.user_portal_access === '1' ? 'text-green-400' : 'text-amber-400'}>
                {config.user_portal_access === '1' ? '🟢 OPEN — Full Access' : '🔒 CLOSED — Launch Page'}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {config.user_portal_access === '1'
                ? 'Verified users can use dashboard, matches, and chat'
                : 'Verified users see the profile launch page — login still allowed'}
            </p>
          </div>
          <Toggle
            value={config.user_portal_access === '1'}
            onChange={async (val) => {
              const newVal = val ? '1' : '0';
              setConfig(p => ({ ...p, user_portal_access: newVal }));
              const res = await fetch('/api/admin/siteconfig', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'user_portal_access', value: newVal }),
              });
              if (res.ok) toast.success(val ? '🟢 Portal OPEN — users can access full site' : '🔒 Portal CLOSED — launch page shown after login');
              else {
                toast.error('Failed');
                setConfig(p => ({ ...p, user_portal_access: val ? '0' : '1' }));
              }
            }}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Developer Test Accounts</label>
          <p className="text-xs text-gray-600 mb-2">
            Har line: <code className="text-amber-300/90">email:password</code> (password min 6 chars).
            When the portal is closed, these accounts still get full access and can sign in at <strong className="text-gray-400">/login</strong> with email and password.
          </p>
          <textarea
            rows={4}
            value={config.developer_portal_emails || ''}
            onChange={e => setConfig(p => ({ ...p, developer_portal_emails: e.target.value }))}
            placeholder={'test@gmail.com:Test@123\nother@gmail.com:Pass@456'}
            className={`${inp} resize-y font-mono text-xs leading-relaxed`}
          />
          <button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                const res = await fetch('/api/admin/developer-access', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ accounts: config.developer_portal_emails || '' }),
                });
                const data = await res.json();
                if (!res.ok) {
                  toast.error(data.error || 'Failed');
                  return;
                }
                if (data.emails?.length) {
                  setConfig(p => ({ ...p, developer_portal_emails: data.emails.join(', ') }));
                }
                toast.success(data.message || 'Developer accounts saved');
                if (data.errors?.length) {
                  toast.error(`${data.errors.length} entry failed — check format email:password`);
                }
              } finally {
                setSaving(false);
              }
            }}
            className="mt-3 vd-gradient-gold text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save & Create Login Accounts'}
          </button>
        </div>
      </div>

      {/* Phone validation — Veriphone (default) vs optional SMS OTP */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-900/20">
            <Phone className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Mobile Number Validation</h3>
            <p className="text-xs text-gray-500">
              Default: <a href="https://veriphone.io" target="_blank" rel="noopener noreferrer" className="text-amber-300/90 underline">Veriphone</a> checks if the number is valid (no SMS OTP). Set <code className="text-amber-300/90">VERIPHONE_API_KEY</code> in .env.production.
            </p>
          </div>
        </div>
        <div className={`flex items-center justify-between p-4 rounded-xl border ${config.require_phone_validation !== '0' ? 'bg-green-900/10 border-green-800/30' : 'bg-gray-900/50 border-gray-700'}`}>
          <div>
            <p className="text-sm font-semibold text-white">
              Require Verify button (Veriphone){' '}
              <span className={config.require_phone_validation !== '0' ? 'text-green-400' : 'text-gray-400'}>
                {config.require_phone_validation !== '0' ? 'ON' : 'OFF'}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {config.require_phone_validation !== '0'
                ? 'Register: user must tap Verify before Next. Invalid numbers are rejected.'
                : 'Register: only enter mobile number — Next enabled without Verify (no Veriphone check).'}
            </p>
          </div>
          <Toggle
            value={config.require_phone_validation !== '0'}
            onChange={async (val) => {
              const newVal = val ? '1' : '0';
              setConfig((p) => ({ ...p, require_phone_validation: newVal }));
              const res = await fetch('/api/admin/siteconfig', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'require_phone_validation', value: newVal }),
              });
              if (res.ok) {
                toast.success(val ? 'Phone validation required (Verify button)' : 'Phone validation optional — no Verify needed');
              } else {
                toast.error('Failed');
                setConfig((p) => ({ ...p, require_phone_validation: val ? '0' : '1' }));
              }
            }}
          />
        </div>
        <div className={`flex items-center justify-between p-4 rounded-xl border ${config.phone_verification_required === '1' ? 'bg-amber-900/10 border-amber-800/40' : 'bg-gray-900/50 border-gray-700'}`}>
          <div>
            <p className="text-sm font-semibold text-white">
              Optional SMS OTP (MSG91){' '}
              <span className={config.phone_verification_required === '1' ? 'text-amber-400' : 'text-gray-400'}>
                {config.phone_verification_required === '1' ? 'ON — paid SMS' : 'OFF'}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {config.phone_verification_required === '1'
                ? 'Users must receive an SMS code (requires MSG91_AUTH_KEY + wallet balance).'
                : 'Leave OFF. Veriphone validation only — no text message sent to the user.'}
            </p>
          </div>
          <Toggle
            value={config.phone_verification_required === '1'}
            onChange={async (val) => {
              const newVal = val ? '1' : '0';
              setConfig((p) => ({ ...p, phone_verification_required: newVal }));
              const res = await fetch('/api/admin/siteconfig', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'phone_verification_required', value: newVal }),
              });
              if (res.ok) {
                toast.success(val ? 'SMS OTP enabled (MSG91 required)' : 'SMS OTP disabled — Veriphone only');
              } else {
                toast.error('Failed');
                setConfig((p) => ({ ...p, phone_verification_required: val ? '0' : '1' }));
              }
            }}
          />
        </div>
      </div>

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

      {/* Mobile App Links */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
        <h3 className="font-bold text-lg text-white">Mobile App (Navbar)</h3>
        <p className="text-xs text-gray-500">Navbar icon links to Play Store / App Store. If the URL is empty, the icon is hidden.</p>
        <div className="flex items-center justify-between p-4 rounded-xl border bg-gray-900/50 border-gray-700">
          <div>
            <p className="text-sm font-semibold text-white">Show app icon in navbar</p>
            <p className="text-xs text-gray-500 mt-0.5">Shortlist icon ki jagah mobile app icon</p>
          </div>
          <Toggle
            value={config.app_nav_enabled !== '0'}
            onChange={async (val) => {
              const newVal = val ? '1' : '0';
              setConfig(p => ({ ...p, app_nav_enabled: newVal }));
              const res = await fetch('/api/admin/siteconfig', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'app_nav_enabled', value: newVal }),
              });
              if (res.ok) toast.success(val ? 'App icon enabled' : 'App icon hidden');
              else {
                toast.error('Failed');
                setConfig(p => ({ ...p, app_nav_enabled: val ? '0' : '1' }));
              }
            }}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Google Play Store URL</label>
          <input
            value={config.play_store_url || ''}
            onChange={e => setConfig(p => ({ ...p, play_store_url: e.target.value }))}
            placeholder="https://play.google.com/store/apps/details?id=com.vivahdwar.app"
            className={inp}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Apple App Store URL (optional — iOS users)</label>
          <input
            value={config.app_store_url || ''}
            onChange={e => setConfig(p => ({ ...p, app_store_url: e.target.value }))}
            placeholder="https://apps.apple.com/app/id..."
            className={inp}
          />
        </div>
        <button
          disabled={saving}
          onClick={() => saveMultiple([
            ['play_store_url', config.play_store_url || ''],
            ['app_store_url', config.app_store_url || ''],
          ])}
          className="vd-gradient-gold text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save App Links'}
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

      {/* Wedding donations */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
        <h3 className="font-bold text-lg text-white">Wedding Donations (Shaadi Sahayata)</h3>
        <p className="text-xs text-gray-500">
          When OFF, /donate is hidden from users. Manage beneficiaries & fund usage in Admin → Donations.
        </p>
        <div className={`flex items-center justify-between p-4 rounded-xl border ${config.donation_enabled === '1' ? 'bg-green-900/10 border-green-800/30' : 'bg-gray-900/50 border-gray-700'}`}>
          <p className="text-sm font-semibold text-white">
            Donations {config.donation_enabled === '1' ? <span className="text-green-400">ON</span> : <span className="text-gray-500">OFF</span>}
          </p>
          <Toggle
            value={config.donation_enabled === '1'}
            onChange={async (val) => {
              const newVal = val ? '1' : '0';
              setConfig((p) => ({ ...p, donation_enabled: newVal }));
              const res = await fetch('/api/admin/siteconfig', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'donation_enabled', value: newVal }),
              });
              if (res.ok) toast.success(val ? 'Donations enabled' : 'Donations disabled');
              else toast.error('Failed');
            }}
          />
        </div>
        <a href="/admin/donations" className="text-sm text-pink-400 hover:underline">Open Donations admin panel →</a>
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
