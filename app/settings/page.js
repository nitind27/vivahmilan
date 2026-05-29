'use client';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';
import { Settings, Bell, Shield, Lock, UserX, Save, Gift, Heart, Users, Crown, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { SiteLoaderInline } from '@/components/SiteLoader';

function Toggle({ value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className={`w-11 h-6 rounded-full transition-all relative ${value ? 'bg-vd-primary' : 'bg-gray-600'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [privacy, setPrivacy] = useState({});
  const [notifications, setNotifications] = useState({});
  const [autoRenew, setAutoRenew] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyForm, setFamilyForm] = useState({ memberName: '', email: '', password: '', relationship: 'Parent' });
  const [addingFamily, setAddingFamily] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setPrivacy(d.privacy || {});
        setNotifications(d.notifications || {});
        setAutoRenew(!!d.subscription?.autoRenew);
      })
      .finally(() => setLoading(false));
    fetch('/api/family-access')
      .then(r => r.ok ? r.json() : { members: [] })
      .then(d => setFamilyMembers(d.members || []))
      .catch(() => {});
  }, [status]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacy, notifications, subscription: { autoRenew } }),
      });
      if (res.ok) toast.success('Settings saved');
      else toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addFamilyMember = async (e) => {
    e.preventDefault();
    setAddingFamily(true);
    try {
      const res = await fetch('/api/family-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(familyForm),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || 'Failed'); return; }
      toast.success('Family login created');
      setFamilyForm({ memberName: '', email: '', password: '', relationship: 'Parent' });
      const list = await fetch('/api/family-access').then(r => r.json());
      setFamilyMembers(list.members || []);
    } finally {
      setAddingFamily(false);
    }
  };

  const removeFamilyMember = async (id) => {
    if (!confirm('Remove this family login?')) return;
    const res = await fetch(`/api/family-access?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setFamilyMembers(m => m.filter(x => x.id !== id));
      toast.success('Removed');
    }
  };

  const deactivate = async () => {
    if (!confirm('Deactivate your account? You will not be able to login until admin reactivates.')) return;
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deactivate: true }),
    });
    if (res.ok) {
      toast.success('Account deactivated');
      signOut({ callbackUrl: '/login' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vd-bg dark:bg-gray-950">
        <Navbar />
        <SiteLoaderInline message="Loading settings…" className="pt-32" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vd-bg dark:bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-12 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-vd-text dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-vd-primary" /> Settings
          </h1>
          <button type="button" onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-vd-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="bg-vd-bg-section dark:bg-gray-800 rounded-2xl border border-vd-border dark:border-gray-700 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Account</p>
          <p className="text-sm text-vd-text dark:text-white">{data?.user?.name}</p>
          <p className="text-xs text-gray-500">{data?.user?.email}</p>
          {data?.user?.phone && <p className="text-xs text-gray-500 mt-1">{data?.user?.phone} {data?.user?.phoneVerified ? '✓ Verified' : ''}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/settings/password" className="text-xs px-3 py-1.5 bg-gray-700/50 rounded-lg text-gray-300 hover:text-white flex items-center gap-1">
              <Lock className="w-3 h-3" /> Change Password
            </Link>
            <Link href="/refer" className="text-xs px-3 py-1.5 bg-gray-700/50 rounded-lg text-gray-300 hover:text-white flex items-center gap-1">
              <Gift className="w-3 h-3" /> Refer & Earn
            </Link>
            <Link href="/share-story" className="text-xs px-3 py-1.5 bg-gray-700/50 rounded-lg text-gray-300 hover:text-white flex items-center gap-1">
              <Heart className="w-3 h-3" /> Share Story
            </Link>
          </div>
          {data?.profileComplete < 100 && (
            <div className="mt-4 p-3 bg-orange-900/20 border border-orange-700/30 rounded-xl">
              <p className="text-sm text-orange-300">Profile {data.profileComplete}% complete</p>
              <Link href="/profile/edit" className="text-xs text-orange-400 underline mt-1 inline-block">Complete profile for better matches</Link>
            </div>
          )}
        </div>

        {data?.user?.isPremium && (
          <div className="bg-vd-bg-section dark:bg-gray-800 rounded-2xl border border-vd-border dark:border-gray-700 p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1"><Crown className="w-3.5 h-3.5" /> Subscription</p>
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-sm text-vd-text dark:text-gray-300">Email renewal reminders</span>
                <p className="text-xs text-gray-500 mt-0.5">Reminders at 7, 3 & 1 days before premium expires</p>
              </div>
              <Toggle value={autoRenew} onChange={setAutoRenew} />
            </div>
            <Link href="/premium" className="text-xs text-vd-primary underline">Manage premium plan →</Link>
          </div>
        )}

        <div className="bg-vd-bg-section dark:bg-gray-800 rounded-2xl border border-vd-border dark:border-gray-700 p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Family Login</p>
          <p className="text-xs text-gray-500">Let parents browse profiles on your behalf (read-only, max 3).</p>
          {familyMembers.map(m => (
            <div key={m.id} className="flex items-center justify-between gap-2 p-3 bg-vd-bg-alt rounded-xl border border-vd-border">
              <div>
                <p className="text-sm font-medium text-vd-text dark:text-white">{m.memberName}</p>
                <p className="text-xs text-gray-500">{m.email} · {m.relationship}</p>
              </div>
              <button type="button" onClick={() => removeFamilyMember(m.id)} className="text-red-400 hover:text-red-300 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {familyMembers.length < 3 && (
            <form onSubmit={addFamilyMember} className="space-y-2 pt-2 border-t border-vd-border">
              <input className="w-full px-3 py-2 rounded-xl border border-vd-border bg-vd-bg text-sm" placeholder="Name (e.g. Father)" value={familyForm.memberName} onChange={e => setFamilyForm(f => ({ ...f, memberName: e.target.value }))} required />
              <input type="email" className="w-full px-3 py-2 rounded-xl border border-vd-border bg-vd-bg text-sm" placeholder="Login email" value={familyForm.email} onChange={e => setFamilyForm(f => ({ ...f, email: e.target.value }))} required />
              <input type="password" className="w-full px-3 py-2 rounded-xl border border-vd-border bg-vd-bg text-sm" placeholder="Password (min 6 chars)" value={familyForm.password} onChange={e => setFamilyForm(f => ({ ...f, password: e.target.value }))} minLength={6} required />
              <select className="w-full px-3 py-2 rounded-xl border border-vd-border bg-vd-bg text-sm" value={familyForm.relationship} onChange={e => setFamilyForm(f => ({ ...f, relationship: e.target.value }))}>
                {['Parent', 'Sibling', 'Guardian', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button type="submit" disabled={addingFamily} className="flex items-center gap-2 px-4 py-2 bg-vd-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                <Plus className="w-4 h-4" /> {addingFamily ? 'Adding…' : 'Add Family Login'}
              </button>
            </form>
          )}
        </div>

        <div className="bg-vd-bg-section dark:bg-gray-800 rounded-2xl border border-vd-border dark:border-gray-700 p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Privacy</p>
          {[
            { key: 'hidePhone', label: 'Hide phone number on profile' },
            { key: 'hidePhoto', label: 'Hide photos until interest accepted' },
            { key: 'profileVisible', label: 'Show my profile in search & matches' },
            { key: 'showOnlineStatus', label: 'Show online status in chat' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-vd-text dark:text-gray-300">{item.label}</span>
              <Toggle value={!!privacy[item.key]} onChange={v => setPrivacy(p => ({ ...p, [item.key]: v }))} />
            </div>
          ))}
        </div>

        <div className="bg-vd-bg-section dark:bg-gray-800 rounded-2xl border border-vd-border dark:border-gray-700 p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> Notifications</p>
          {[
            { key: 'notifyInterest', label: 'Interest received / accepted' },
            { key: 'notifyMessage', label: 'New messages' },
            { key: 'notifyProfileView', label: 'Profile views' },
            { key: 'notifyMarketing', label: 'Offers & updates' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-vd-text dark:text-gray-300">{item.label}</span>
              <Toggle value={!!notifications[item.key]} onChange={v => setNotifications(n => ({ ...n, [item.key]: v }))} />
            </div>
          ))}
        </div>

        <div className="bg-red-900/10 border border-red-800/30 rounded-2xl p-5">
          <p className="text-sm font-semibold text-red-400 flex items-center gap-2"><UserX className="w-4 h-4" /> Danger Zone</p>
          <p className="text-xs text-gray-500 mt-1 mb-3">Temporarily deactivate your account. Contact support to reactivate.</p>
          <button type="button" onClick={deactivate} className="px-4 py-2 bg-red-900/30 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-900/50">
            Deactivate Account
          </button>
        </div>
      </div>
    </div>
  );
}
