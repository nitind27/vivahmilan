'use client';
import { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, Zap, ToggleLeft, ToggleRight, XCircle, Layout } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MarketingPopupsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [popup, setPopup] = useState({
    enabled: false,
    title: 'Special Diwali Offer! 🎉',
    description: 'Upgrade to premium today and get 50% off. Use code DIWALI50.',
    imageUrl: '',
    buttonText: 'Claim Offer',
    buttonLink: '/premium',
    target: 'ALL', // ALL | FREE | PREMIUM
  });

  useEffect(() => {
    fetch('/api/admin/marketing')
      .then(r => r.json())
      .then(d => {
        if (d?.marketing_popup) {
          setPopup(JSON.parse(d.marketing_popup));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'marketing_popup', value: JSON.stringify(popup) }),
    });
    if (res.ok) toast.success('Marketing popup saved & published!');
    else toast.error('Failed to save popup');
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* ── Configuration ── */}
      <div className="space-y-5">
        <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-white flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" /> Popup Settings</h3>
            <button onClick={() => setPopup(p => ({ ...p, enabled: !p.enabled }))} className="flex items-center gap-2 text-sm font-semibold transition-colors">
              {popup.enabled ? <><ToggleRight className="w-8 h-8 text-green-500" /> <span className="text-green-400">Live</span></> : <><ToggleLeft className="w-8 h-8 text-gray-500" /> <span className="text-gray-400">Disabled</span></>}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Target Audience</label>
              <select value={popup.target} onChange={e => setPopup(p => ({ ...p, target: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary">
                <option value="ALL">All Users</option>
                <option value="FREE">Free Users Only (Great for upsells!)</option>
                <option value="PREMIUM">Premium Users Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Headline</label>
              <input value={popup.title} onChange={e => setPopup(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. 50% Off Today!"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Main Message</label>
              <textarea value={popup.description} onChange={e => setPopup(p => ({ ...p, description: e.target.value }))} rows={3}
                placeholder="Write your exciting offer or announcement here..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary resize-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Hero Image URL (Optional)</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input value={popup.imageUrl} onChange={e => setPopup(p => ({ ...p, imageUrl: e.target.value }))}
                  placeholder="https://your-image.jpg"
                  className="w-full pl-9 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Button Text</label>
                <input value={popup.buttonText} onChange={e => setPopup(p => ({ ...p, buttonText: e.target.value }))}
                  placeholder="e.g. Upgrade Now"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Button Link</label>
                <input value={popup.buttonLink} onChange={e => setPopup(p => ({ ...p, buttonLink: e.target.value }))}
                  placeholder="e.g. /premium"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary" />
              </div>
            </div>
          </div>

          <button onClick={save} disabled={saving}
            className="w-full mt-6 py-4 bg-gradient-to-r from-vd-primary to-pink-600 hover:opacity-90 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-pink-900/20 flex items-center justify-center gap-2">
            {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            Save & Publish Popup
          </button>
        </div>
      </div>

      {/* ── Live Preview ── */}
      <div>
        <div className="sticky top-24">
          <h3 className="font-bold text-gray-400 mb-4 flex items-center gap-2"><Layout className="w-4 h-4" /> Live Preview on User Screen</h3>
          <div className="relative w-full max-w-sm mx-auto h-[650px] bg-gray-950 border-[8px] border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex items-center justify-center p-4">
            {/* Fake App Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center" />
            
            {/* The actual popup preview */}
            {popup.enabled ? (
              <div className="relative w-full bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 animate-in zoom-in-95 duration-300">
                {popup.imageUrl && (
                  <div className="w-full h-40 bg-gray-800 relative">
                    <img src={popup.imageUrl} alt="Popup Hero" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                  </div>
                )}
                <div className="p-6 text-center relative">
                  <button className="absolute top-3 right-3 text-gray-500 hover:text-white bg-gray-800 rounded-full p-1"><XCircle className="w-5 h-5" /></button>
                  <h2 className="text-xl font-bold text-white mb-2 leading-tight">{popup.title || 'Your Headline Here'}</h2>
                  <p className="text-sm text-gray-400 mb-6 leading-relaxed">{popup.description || 'Your amazing offer description will appear here...'}</p>
                  <button className="w-full py-3.5 bg-gradient-to-r from-vd-primary to-pink-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-pink-900/20">
                    {popup.buttonText || 'Click Here'}
                  </button>
                  <p className="text-[10px] text-gray-600 mt-4">Showing to: {popup.target} users</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 font-medium">Popup is currently disabled.<br/>Enable it to see preview.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
