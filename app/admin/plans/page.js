'use client';
import { useEffect, useState } from 'react';
import { Edit2, Plus, Users, Gift, Save, LayoutGrid, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_PERMISSIONS = {
  canChat: false,
  interestLimit: 5,
  canSeeContact: false,
  canBoostProfile: false,
  canSeeWhoViewed: false,
  unlimitedInterests: false,
  aiMatchScore: false,
  kundaliMatchPdf: false,
};

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${value ? 'bg-vd-primary' : 'bg-gray-600'}`}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </div>
  );
}

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [editPlan, setEditPlan] = useState(null);
  
  const [earlyBirdReal, setEarlyBirdReal] = useState({ claimedCount: 0, limit: 1000, slotsLeft: 1000 });
  const [earlyBird, setEarlyBird] = useState({
    enabled: true,
    guestPopupEnabled: true,
    limit: 1000,
    claimed: 0,
    displayLimit: 1000,
    displayClaimed: 0,
    planId: 'GOLD',
    durationUnit: 'years',
    durationValue: 1,
    autoAssignOnSignup: false,
    title: 'Early Bird Offer — Free Full Access',
    subtitle: 'First registered members get premium features free. Limited slots!',
  });
  const [showPricingSection, setShowPricingSection] = useState(true);
  const [savingDisplay, setSavingDisplay] = useState(false);
  const [slotsLeft, setSlotsLeft] = useState(1000);
  const [durationLabel, setDurationLabel] = useState('1 Year');
  const [savingEb, setSavingEb] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadPlans = () => {
    fetch('/api/admin/plans').then(r => r.json()).then(d => setPlans(Array.isArray(d) ? d : [])).catch(() => {});
  };

  const restoreDefaultPlans = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/plans/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Plans restored');
        loadPlans();
        if (data.earlyBird) setEarlyBird(prev => ({ ...prev, ...data.earlyBird }));
      } else toast.error(data.error || 'Restore failed');
    } finally {
      setSeeding(false);
    }
  };

  const loadEarlyBird = () => {
    fetch('/api/admin/early-bird')
      .then(r => r.json())
      .then(d => {
        if (d.settings) setEarlyBird(d.settings);
        if (d.real) setEarlyBirdReal(d.real);
        if (d.display) {
          setSlotsLeft(d.display.slotsLeft);
        } else if (d.slotsLeft != null) setSlotsLeft(d.slotsLeft);
        if (d.durationLabel) setDurationLabel(d.durationLabel);
      })
      .catch(() => {});
  };

  const loadDisplaySettings = () => {
    fetch('/api/site/display-settings')
      .then((r) => r.json())
      .then((d) => setShowPricingSection(d.showPricingSection !== false))
      .catch(() => {});
  };

  const saveDisplaySettings = async () => {
    setSavingDisplay(true);
    try {
      const res = await fetch('/api/admin/siteconfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'show_pricing_section', value: showPricingSection ? '1' : '0' }),
      });
      if (res.ok) toast.success(showPricingSection ? 'Pricing section visible on site' : 'Pricing section hidden on site');
      else toast.error('Failed to save display setting');
    } finally {
      setSavingDisplay(false);
    }
  };

  useEffect(() => {
    loadPlans();
    loadEarlyBird();
    loadDisplaySettings();
  }, []);

  const savePlan = async () => {
    if (!editPlan || !editPlan.plan) { toast.error('Plan key is required'); return; }
    const res = await fetch('/api/admin/plans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editPlan, permissions: editPlan.permissions }),
    });
    if (res.ok) {
      toast.success('Plan saved'); setEditPlan(null);
      loadPlans();
    } else toast.error('Failed to save plan');
  };

  const deletePlan = async (planKey) => {
    if (!confirm(`Are you sure you want to delete ${planKey}?`)) return;
    const res = await fetch(`/api/admin/plans?plan=${planKey}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Plan deleted');
      setPlans(plans.filter(p => p.plan !== planKey));
    } else toast.error('Failed to delete plan');
  };

  const saveEarlyBird = async () => {
    setSavingEb(true);
    try {
      const res = await fetch('/api/admin/early-bird', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(earlyBird),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Early Bird settings saved');
        if (data.settings) setEarlyBird(data.settings);
        if (data.real) setEarlyBirdReal(data.real);
        if (data.display) setSlotsLeft(data.display.slotsLeft);
        else if (data.slotsLeft != null) setSlotsLeft(data.slotsLeft);
        if (data.durationLabel) setDurationLabel(data.durationLabel);
      } else toast.error(data.error || 'Failed to save');
    } finally {
      setSavingEb(false);
    }
  };

  const resetEarlyBirdCount = () => {
    loadEarlyBird();
    toast.success('Actual count refreshed from database');
  };

  const openNewPlan = () => {
    setEditPlan({
      isNew: true,
      plan: '',
      displayName: 'New Plan',
      price: 0,
      currency: 'INR',
      durationDays: 30,
      description: '',
      isActive: true,
      permissions: { ...DEFAULT_PERMISSIONS }
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm">Configure subscription plans, pricing, permissions, and early bird offers.</p>

      {/* Homepage pricing visibility */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vd-primary/20 text-vd-primary flex items-center justify-center">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-white">Show pricing on website</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Controls the homepage section <strong className="text-gray-300">&quot;Find Love with the Right Plan&quot;</strong> and paid plan cards on Premium page.
              When OFF, no subscription plans are shown to visitors.
            </p>
          </div>
          <Toggle value={showPricingSection} onChange={setShowPricingSection} />
        </div>
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={saveDisplaySettings}
            disabled={savingDisplay}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-xl text-sm text-white disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {savingDisplay ? 'Saving…' : 'Save visibility'}
          </button>
        </div>
      </div>
      
      {/* Early Bird Settings */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-500 flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Early Bird Offer (Free Tier)</h3>
            <p className="text-xs text-gray-400">
              First {earlyBird.limit} users get free premium access. Users see a login popup to claim until they activate it.
            </p>
          </div>
          <div className="ml-auto">
            <Toggle value={earlyBird.enabled} onChange={v => setEarlyBird(prev => ({...prev, enabled: v}))} />
          </div>
        </div>

        {earlyBird.enabled && (
          <div className="mt-4 space-y-4 bg-gray-950/30 p-4 rounded-xl border border-gray-800">
            <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 text-sm text-pink-200">
              Users see: <strong>{earlyBird.displayClaimed ?? 0} / {earlyBird.displayLimit ?? earlyBird.limit}</strong> claimed ·{' '}
              <strong>{slotsLeft}</strong> slots left · Plan <strong>{earlyBird.planId}</strong> · {durationLabel}
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-900/80 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <Megaphone className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white text-sm">Guest popup (no login)</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Attractive popup for visitors who are not logged in. Shown once per browser session (refresh won&apos;t repeat; new browser session shows again).
                  </p>
                </div>
              </div>
              <Toggle
                value={earlyBird.guestPopupEnabled !== false}
                onChange={(v) => setEarlyBird((p) => ({ ...p, guestPopupEnabled: v }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Actual max users (real limit)</label>
                <input type="number" min={1} value={earlyBird.limit}
                  onChange={e => setEarlyBird(p => ({ ...p, limit: parseInt(e.target.value, 10) || 1 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-pink-500" />
                <p className="text-[10px] text-gray-600 mt-1">Stops new claims when this many real subscriptions exist</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Free Access Duration</label>
                <select value={earlyBird.durationUnit || 'years'}
                  onChange={e => setEarlyBird(p => ({ ...p, durationUnit: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-pink-500">
                  <option value="years">Years</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {earlyBird.durationUnit === 'days' ? 'Number of Days' : 'Number of Years'}
                </label>
                <input type="number" min={1} value={earlyBird.durationValue ?? 1}
                  onChange={e => setEarlyBird(p => ({ ...p, durationValue: parseInt(e.target.value, 10) || 1 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-pink-500" />
                <p className="text-[10px] text-gray-600 mt-1">Example: 1 year = 365 days free</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Premium Plan to Grant</label>
                <select value={earlyBird.planId} onChange={e => setEarlyBird(p => ({ ...p, planId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-pink-500">
                  {plans.length === 0 && <option value="GOLD">GOLD</option>}
                  {plans.map(p => <option key={p.plan} value={p.plan}>{p.displayName} ({p.plan})</option>)}
                </select>
              </div>
              <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-900/60 border border-gray-700">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Actual — Claimed / Limit (database)</label>
                  <p className="text-2xl font-bold text-emerald-400">
                    {earlyBirdReal.claimedCount ?? earlyBird.claimed} / {earlyBirdReal.limit ?? earlyBird.limit}
                  </p>
                  <p className="text-xs text-gray-500">{earlyBirdReal.slotsLeft ?? 0} real slots left</p>
                  <button type="button" onClick={resetEarlyBirdCount}
                    className="mt-2 text-xs text-gray-500 hover:text-white border border-gray-700 px-2 py-1 rounded">
                    Refresh from database
                  </button>
                </div>
                <div>
                  <label className="text-xs text-amber-400/90 mb-1 block">Shown to users — Claimed / Limit</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={0}
                      value={earlyBird.displayClaimed ?? 0}
                      onChange={e => setEarlyBird(p => ({ ...p, displayClaimed: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                      className="w-24 px-3 py-2 bg-gray-800 border border-amber-700/50 rounded-lg text-sm text-amber-200 focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-gray-500">/</span>
                    <input
                      type="number"
                      min={1}
                      value={earlyBird.displayLimit ?? earlyBird.limit}
                      onChange={e => setEarlyBird(p => ({ ...p, displayLimit: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                      className="w-24 px-3 py-2 bg-gray-800 border border-amber-700/50 rounded-lg text-sm text-amber-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <p className="text-xs text-amber-400/80 mt-1">{slotsLeft} slots left (on site)</p>
                  <p className="text-[10px] text-gray-600 mt-1">Edit these numbers for visitors. Each new claim adds +1 to shown claimed automatically.</p>
                </div>
              </div>
              <div className="flex items-end md:col-span-2">
                <label className="flex items-start gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={earlyBird.autoAssignOnSignup === true}
                    onChange={e => setEarlyBird(p => ({ ...p, autoAssignOnSignup: e.target.checked }))}
                    className="rounded mt-0.5"
                  />
                  <span>
                    <span className="font-medium text-white block">Auto-assign on registration</span>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      Off (recommended): user must claim via login popup. On: free access without popup.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Popup &amp; Premium Page Title</label>
              <input value={earlyBird.title || ''} onChange={e => setEarlyBird(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-pink-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Popup &amp; Premium Page Subtitle</label>
              <textarea rows={2} value={earlyBird.subtitle || ''} onChange={e => setEarlyBird(p => ({ ...p, subtitle: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-pink-500 resize-none" />
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button onClick={saveEarlyBird} disabled={savingEb}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl text-sm transition-colors text-white disabled:opacity-60">
            <Save className="w-4 h-4" /> {savingEb ? 'Saving…' : 'Save Early Bird Settings'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Subscription Plans</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={seeding}
            onClick={restoreDefaultPlans}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
          >
            {seeding ? 'Restoring…' : 'Restore Default Plans'}
          </button>
          <button onClick={openNewPlan} className="flex items-center gap-2 px-4 py-2 vd-gradient-gold text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add New Plan
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(existing => {
          const planKey = existing.plan;
          const perms = JSON.parse(existing.permissions || '{}');
          return (
            <div key={planKey} className="bg-gray-800 rounded-2xl p-5 border border-gray-700 shadow-sm relative overflow-hidden">
              {!existing.isActive && <div className="absolute top-3 right-3 text-[10px] font-bold bg-red-900/40 text-red-400 px-2 py-1 rounded-md">INACTIVE</div>}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{existing.displayName}</h3>
                <button onClick={() => setEditPlan({ plan: planKey, displayName: existing.displayName, price: existing.price, currency: existing.currency || 'INR', durationDays: existing.durationDays || 30, description: existing.description || '', isActive: existing.isActive ?? true, permissions: perms, isNew: false })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white rounded-xl text-xs transition-colors">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Plan Code</span><span className="text-xs bg-gray-900 px-2 py-0.5 rounded text-gray-300 font-mono">{planKey}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Price</span><span className="text-white font-semibold">₹{Number(existing.price || 0).toLocaleString()} / {existing.durationDays}d</span></div>
                <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
                  {Object.entries(perms).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                      <span className={typeof v === 'boolean' ? (v ? 'text-green-400' : 'text-red-400') : 'text-yellow-400'}>{typeof v === 'boolean' ? (v ? '✓' : '✗') : v === -1 ? 'Unlimited' : v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {plans.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 border border-dashed border-gray-700 rounded-2xl space-y-4">
            <p>No plans found. Restore defaults (FREE, SILVER, GOLD, PLATINUM, EARLY_BIRD).</p>
            <button
              type="button"
              disabled={seeding}
              onClick={restoreDefaultPlans}
              className="px-6 py-2.5 vd-gradient-gold text-white rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {seeding ? 'Restoring…' : 'Restore Default Plans'}
            </button>
          </div>
        )}
      </div>

      {editPlan && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditPlan(null)}>
          <div className="bg-gray-800 rounded-3xl p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-xl">{editPlan.isNew ? 'Create New Plan' : `Edit ${editPlan.plan} Plan`}</h3>
              {!editPlan.isNew && (
                <button onClick={() => { setEditPlan(null); deletePlan(editPlan.plan); }} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-900/20 rounded">
                  Delete Plan
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {editPlan.isNew && (
                <div><label className="text-xs text-gray-400 mb-1 block">Plan Code (Unique ID, e.g. GOLD, VIP)</label><input value={editPlan.plan} onChange={e => setEditPlan(p => ({ ...p, plan: e.target.value.toUpperCase().replace(/\s+/g, '_') }))} placeholder="VIP_PLAN" className="w-full px-3 py-2.5 bg-gray-900 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 font-mono" /></div>
              )}
              
              <div><label className="text-xs text-gray-400 mb-1 block">Display Name</label><input value={editPlan.displayName} onChange={e => setEditPlan(p => ({ ...p, displayName: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" /></div>
              
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Price (₹)</label><input type="number" value={editPlan.price} onChange={e => setEditPlan(p => ({ ...p, price: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Duration (Days)</label>
                  <input type="number" value={editPlan.durationDays} onChange={e => setEditPlan(p => ({ ...p, durationDays: parseInt(e.target.value) }))} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" />
                </div>
              </div>
              <div><label className="text-xs text-gray-400 mb-1 block">Description</label><textarea value={editPlan.description} onChange={e => setEditPlan(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 resize-none" /></div>
              
              <div className="border-t border-gray-700 pt-4">
                <p className="text-sm font-semibold mb-3 text-gray-300">Permissions</p>
                <div className="space-y-3">
                  {[{ key: 'canChat', label: 'Can Chat' }, { key: 'canSeeContact', label: 'See Contact Details' }, { key: 'canBoostProfile', label: 'Profile Boost' }, { key: 'canSeeWhoViewed', label: 'See Who Viewed' }, { key: 'unlimitedInterests', label: 'Unlimited Interests' }, { key: 'aiMatchScore', label: 'AI Match Score' }, { key: 'kundaliMatchPdf', label: 'Kundali PDF Report' }].map(p => (
                    <div key={p.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{p.label}</span>
                      <Toggle value={editPlan.permissions[p.key]} onChange={v => setEditPlan(prev => ({ ...prev, permissions: { ...prev.permissions, [p.key]: v } }))} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Interest Limit (-1 = unlimited)</span>
                    <input type="number" value={editPlan.permissions.interestLimit} onChange={e => setEditPlan(prev => ({ ...prev, permissions: { ...prev.permissions, interestLimit: parseInt(e.target.value) } }))} className="w-24 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-right focus:outline-none focus:border-pink-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Plan Active</span>
                    <Toggle value={editPlan.isActive} onChange={v => setEditPlan(p => ({ ...p, isActive: v }))} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={savePlan} className="flex-1 vd-gradient-gold text-white py-2.5 rounded-xl font-semibold text-sm hover:opacity-90">Save Plan</button>
                <button onClick={() => setEditPlan(null)} className="flex-1 border border-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-700 text-white">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
