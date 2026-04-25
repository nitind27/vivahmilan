'use client';
import { useEffect, useState } from 'react';
import { Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PLAN_PERMISSIONS = {
  FREE:     { canChat: false, interestLimit: 5,  canSeeContact: false, canBoostProfile: false, canSeeWhoViewed: false, unlimitedInterests: false, aiMatchScore: false },
  SILVER:   { canChat: false, interestLimit: 50, canSeeContact: true,  canBoostProfile: false, canSeeWhoViewed: true,  unlimitedInterests: false, aiMatchScore: false },
  GOLD:     { canChat: true,  interestLimit: -1, canSeeContact: true,  canBoostProfile: true,  canSeeWhoViewed: true,  unlimitedInterests: true,  aiMatchScore: false },
  PLATINUM: { canChat: true,  interestLimit: -1, canSeeContact: true,  canBoostProfile: true,  canSeeWhoViewed: true,  unlimitedInterests: true,  aiMatchScore: true  },
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

  useEffect(() => {
    fetch('/api/admin/plans').then(r => r.json()).then(d => setPlans(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const savePlan = async () => {
    if (!editPlan) return;
    const res = await fetch('/api/admin/plans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editPlan, permissions: editPlan.permissions }),
    });
    if (res.ok) {
      toast.success('Plan saved'); setEditPlan(null);
      fetch('/api/admin/plans').then(r => r.json()).then(d => setPlans(Array.isArray(d) ? d : []));
    } else toast.error('Failed');
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm">Configure subscription plans, pricing, and permissions.</p>
      <div className="grid md:grid-cols-2 gap-4">
        {['FREE','SILVER','GOLD','PLATINUM'].map(planKey => {
          const existing = plans.find(p => p.plan === planKey);
          const perms = existing ? JSON.parse(existing.permissions || '{}') : PLAN_PERMISSIONS[planKey];
          return (
            <div key={planKey} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{existing?.displayName || planKey}</h3>
                <button onClick={() => setEditPlan({ plan: planKey, displayName: existing?.displayName || planKey, price: existing?.price || 0, currency: 'INR', durationDays: existing?.durationDays || 30, description: existing?.description || '', isActive: existing?.isActive ?? true, permissions: perms })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-900/30 text-pink-400 hover:bg-pink-900/50 rounded-xl text-xs">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Price</span><span className="text-white font-semibold">₹{Number(existing?.price || 0).toLocaleString()} / {existing?.durationDays === 365 ? '12 months' : existing?.durationDays === 180 ? '6 months' : existing?.durationDays === 90 ? '3 months' : `${existing?.durationDays || 30} days`}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Status</span><span className={existing?.isActive !== false ? 'text-green-400' : 'text-red-400'}>{existing?.isActive !== false ? 'Active' : 'Inactive'}</span></div>
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
      </div>

      {editPlan && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditPlan(null)}>
          <div className="bg-gray-800 rounded-3xl p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-xl mb-5">Edit {editPlan.plan} Plan</h3>
            <div className="space-y-4">
              <div><label className="text-xs text-gray-400 mb-1 block">Display Name</label><input value={editPlan.displayName} onChange={e => setEditPlan(p => ({ ...p, displayName: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Price (₹)</label><input type="number" value={editPlan.price} onChange={e => setEditPlan(p => ({ ...p, price: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Duration</label>
                  <select value={editPlan.durationDays} onChange={e => setEditPlan(p => ({ ...p, durationDays: parseInt(e.target.value) }))} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500">
                    <option value={30}>1 Month</option><option value={90}>3 Months</option><option value={180}>6 Months</option><option value={365}>12 Months</option>
                  </select>
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
                <button onClick={() => setEditPlan(null)} className="flex-1 border border-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-700">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
