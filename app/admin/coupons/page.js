'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Ban, CheckCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPct: 10, maxUses: 100, expiresAt: '' });

  const load = () => fetch('/api/admin/coupons').then(r => r.json()).then(d => setCoupons(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setNewCoupon(p => ({ ...p, code }));
  };

  const create = async () => {
    if (!newCoupon.code.trim()) { toast.error('Enter a coupon code'); return; }
    const res = await fetch('/api/admin/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newCoupon, code: newCoupon.code.toUpperCase() }) });
    if (res.ok) { toast.success('Coupon created'); setNewCoupon({ code: '', discountPct: 10, maxUses: 100, expiresAt: '' }); load(); }
    else { const d = await res.json(); toast.error(d.error || 'Failed'); }
  };

  const toggle = async (id, isActive) => {
    await fetch('/api/admin/coupons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isActive: !isActive }) });
    load();
  };

  const del = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    await fetch('/api/admin/coupons', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast.success('Deleted'); load();
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm">Generate coupon codes with percentage discounts.</p>
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
        <h3 className="font-bold text-lg mb-4">Create New Coupon</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Coupon Code</label>
            <div className="flex gap-2">
              <input value={newCoupon.code} onChange={e => setNewCoupon(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE20" maxLength={20}
                className="flex-1 px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 tracking-widest font-mono" />
              <button onClick={generateCode} className="px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-xs text-gray-300 hover:bg-gray-600 whitespace-nowrap">Generate</button>
            </div>
          </div>
          <div><label className="text-xs text-gray-400 mb-1 block">Discount %</label><input type="number" min={1} max={100} value={newCoupon.discountPct} onChange={e => setNewCoupon(p => ({ ...p, discountPct: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Max Uses</label><input type="number" min={1} value={newCoupon.maxUses} onChange={e => setNewCoupon(p => ({ ...p, maxUses: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Expiry Date (optional)</label><input type="date" value={newCoupon.expiresAt} onChange={e => setNewCoupon(p => ({ ...p, expiresAt: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" /></div>
        </div>
        <button onClick={create} className="mt-4 px-6 py-2.5 vd-gradient-gold text-white rounded-xl font-semibold text-sm hover:opacity-90">Create Coupon</button>
      </div>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        {coupons.length === 0 ? <div className="text-center py-12 text-gray-500">No coupons yet.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700/50"><tr>{['Code','Discount','Used / Max','Expires','Status','Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-700/50">
                {coupons.map(c => (
                  <tr key={c.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono font-bold text-white tracking-widest">{c.code}</td>
                    <td className="px-4 py-3 text-green-400 font-semibold">{c.discountPct}% off</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={c.usedCount >= c.maxUses ? 'text-red-400' : 'text-white'}>{c.usedCount}</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-400">{c.maxUses}</span>
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-vd-primary rounded-full" style={{ width: `${Math.min(100, (c.usedCount / c.maxUses) * 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{c.expiresAt ? format(new Date(c.expiresAt), 'dd MMM yyyy') : '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive && c.usedCount < c.maxUses ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{!c.isActive ? 'Disabled' : c.usedCount >= c.maxUses ? 'Exhausted' : 'Active'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => toggle(c.id, c.isActive)} className={`p-1.5 rounded-lg text-xs ${c.isActive ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'}`}>
                          {c.isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => del(c.id)} className="p-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
