'use client';
import { useEffect, useState } from 'react';
import { Edit2, Plus, Users, Gift, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_PERMISSIONS = {
  canChat: false,
  interestLimit: 5,
  canSeeContact: false,
  canBoostProfile: false,
  canSeeWhoViewed: false,
  unlimitedInterests: false,
  aiMatchScore: false
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
  
  const [earlyBird, setEarlyBird] = useState({ enabled: false, limit: 50, claimed: 0, planId: 'FREE', durationDays: 365 });
  const [loadingEarlyBird, setLoadingEarlyBird] = useState(true);

  useEffect(() => {
    fetch('/api/admin/plans').then(r => r.json()).then(d => setPlans(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/admin/siteconfig').then(r => r.json()).then(d => {
      if (d.early_bird_settings) {
        try {
          setEarlyBird(JSON.parse(d.early_bird_settings));
        } catch(e) {}
      }
      setLoadingEarlyBird(false);
    });
  }, []);

  const savePlan = async () => {
    if (!editPlan || !editPlan.plan) { toast.error('Plan key is required'); return; }
    const res = await fetch('/api/admin/plans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editPlan, permissions: editPlan.permissions }),
    });
    if (res.ok) {
      toast.success('Plan saved'); setEditPlan(null);
      fetch('/api/admin/plans').then(r => r.json()).then(d => setPlans(Array.isArray(d) ? d : []));
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
    const res = await fetch('/api/admin/siteconfig', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'early_bird_settings', value: JSON.stringify(earlyBird) })
    });
    if (res.ok) toast.success('Early Bird settings saved');
    else toast.error('Failed to save Early Bird settings');
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
      
      {/* Early Bird Settings */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-500 flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Early Bird Offer (Free Tier)</h3>
            <p className="text-xs text-gray-400">Automatically assign a plan for free to the first X users.</p>
          </div>
          <div className="ml-auto">
            <Toggle value={earlyBird.enabled} onChange={v => setEarlyBird(prev => ({...prev, enabled: v}))} />
          </div>
        </div>

        {earlyBird.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 bg-gray-950/30 p-4 rounded-xl border border-gray-800">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Plan to Assign</label>
              <select value={earlyBird.planId} onChange={e => setEarlyBird(p => ({...p, planId: e.target.value}))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-pink-500">
                {plans.map(p => <option key={p.plan} value={p.plan}>{p.displayName} ({p.plan})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">User Limit (Max Free)</label>
              <input type="number" value={earlyBird.limit} onChange={e => setEarlyBird(p => ({...p, limit: parseInt(e.target.value)}))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-pink-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Duration (Days)</label>
              <input type="number" value={earlyBird.durationDays} onChange={e => setEarlyBird(p => ({...p, durationDays: parseInt(e.target.value)}))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-pink-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Total Claimed</label>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-pink-400">{earlyBird.claimed}</span>
                <button onClick={() => setEarlyBird(p => ({...p, claimed: 0}))} className="text-xs text-gray-500 hover:text-white border border-gray-700 px-2 py-1 rounded">Reset</button>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end mt-4">
          <button onClick={saveEarlyBird} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl text-sm transition-colors text-white">
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Subscription Plans</h2>
        <button onClick={openNewPlan} className="flex items-center gap-2 px-4 py-2 vd-gradient-gold text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add New Plan
        </button>
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
          <div className="col-span-full text-center py-12 text-gray-500 border border-dashed border-gray-700 rounded-2xl">
            No plans found. Create one to get started.
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
                  {[{ key: 'canChat', label: 'Can Chat' }, { key: 'canSeeContact', label: 'See Contact Details' }, { key: 'canBoostProfile', label: 'Profile Boost' }, { key: 'canSeeWhoViewed', label: 'See Who Viewed' }, { key: 'unlimitedInterests', label: 'Unlimited Interests' }, { key: 'aiMatchScore', label: 'AI Match Score' }].map(p => (
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
