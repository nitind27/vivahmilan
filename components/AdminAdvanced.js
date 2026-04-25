'use client';
import { useState, useEffect } from 'react';
import {
  Search, Save, Plus, User, Mail, Phone, MapPin, Briefcase,
  GraduationCap, Heart, Send, Bell, Activity, Crown,
  RefreshCw, CheckCircle, XCircle, Calendar, TrendingUp,
  MessageSquare, UserPlus, Zap, Gift, Clock, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const inp = "w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary placeholder:text-gray-500";
const lbl = "block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide";

// ── Admin Create / Edit Profile Tab ──────────────────────────────────────────
export function AdminCreateProfileTab() {
  const [searchVal, setSearchVal] = useState('');
  const [searchType, setSearchType] = useState('phone');
  const [mode, setMode] = useState('search'); // search | edit | create
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);

  const BLANK = {
    name:'', email:'', phone:'', password:'',
    gender:'', dob:'', height:'', weight:'', religion:'', caste:'', motherTongue:'',
    education:'', profession:'', income:'', city:'', state:'', country:'',
    maritalStatus:'NEVER_MARRIED', aboutMe:'', familyType:'', familyStatus:'',
    fatherOccupation:'', motherOccupation:'', smoking:'NO', drinking:'NO', diet:'',
    manglik:'No', horoscopeSign:'', nakshatra:'',
  };
  const [form, setForm] = useState(BLANK);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const lookup = async () => {
    if (!searchVal.trim()) return;
    setLoading(true);
    try {
      const param = searchType === 'phone' ? `phone=${encodeURIComponent(searchVal)}` : searchType === 'email' ? `email=${encodeURIComponent(searchVal)}` : `userId=${searchVal}`;
      const res = await fetch(`/api/admin/create-profile?${param}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setUserData(data);
      setForm({
        ...BLANK,
        name: data.user.name || '', email: data.user.email || '', phone: data.user.phone || '',
        gender: data.profile?.gender || '', dob: data.profile?.dob ? data.profile.dob.split('T')[0] : '',
        height: data.profile?.height || '', weight: data.profile?.weight || '',
        religion: data.profile?.religion || '', caste: data.profile?.caste || '',
        motherTongue: data.profile?.motherTongue || '', education: data.profile?.education || '',
        profession: data.profile?.profession || '', income: data.profile?.income || '',
        city: data.profile?.city || '', state: data.profile?.state || '', country: data.profile?.country || '',
        maritalStatus: data.profile?.maritalStatus || 'NEVER_MARRIED',
        aboutMe: data.profile?.aboutMe || '', familyType: data.profile?.familyType || '',
        familyStatus: data.profile?.familyStatus || '', fatherOccupation: data.profile?.fatherOccupation || '',
        motherOccupation: data.profile?.motherOccupation || '', smoking: data.profile?.smoking || 'NO',
        drinking: data.profile?.drinking || 'NO', diet: data.profile?.diet || '',
        manglik: data.profile?.manglik || 'No', horoscopeSign: data.profile?.horoscopeSign || '',
        nakshatra: data.profile?.nakshatra || '',
      });
      setMode('edit');
    } finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      if (mode === 'create') {
        const res = await fetch('/api/admin/create-profile', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error); return; }
        toast.success(`Profile created! Default password: Vivah@1234`);
        setMode('search'); setForm(BLANK); setUserData(null);
      } else {
        const res = await fetch('/api/admin/create-profile', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userData.user.id, ...form }),
        });
        if (!res.ok) { toast.error('Save failed'); return; }
        toast.success('Profile updated!');
      }
    } finally { setSaving(false); }
  };

  const F = ({ label, k, type = 'text', placeholder = '' }) => (
    <div><label className={lbl}>{label}</label>
      <input type={type} value={form[k] || ''} onChange={e => set(k, e.target.value)} placeholder={placeholder} className={inp} />
    </div>
  );
  const S = ({ label, k, options }) => (
    <div><label className={lbl}>{label}</label>
      <select value={form[k] || ''} onChange={e => set(k, e.target.value)} className={inp}>
        <option value="">Select…</option>
        {options.map(o => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Mode switcher */}
      <div className="flex gap-2">
        <button onClick={() => { setMode('search'); setUserData(null); setForm(BLANK); }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'search' || mode === 'edit' ? 'bg-vd-primary text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
          🔍 Find & Edit User
        </button>
        <button onClick={() => { setMode('create'); setUserData(null); setForm(BLANK); }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'create' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
          <Plus className="w-4 h-4 inline mr-1" />Create New Profile
        </button>
      </div>

      {/* Search bar */}
      {(mode === 'search' || mode === 'edit') && (
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <p className="text-sm font-semibold text-gray-300 mb-3">Find existing user</p>
          <div className="flex gap-2">
            <select value={searchType} onChange={e => setSearchType(e.target.value)} className="px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white focus:outline-none">
              <option value="phone">📞 Phone</option>
              <option value="email">📧 Email</option>
              <option value="userId">🆔 User ID</option>
            </select>
            <input value={searchVal} onChange={e => setSearchVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()}
              placeholder={searchType === 'phone' ? '+91 98765 43210' : searchType === 'email' ? 'user@email.com' : 'User ID'}
              className="flex-1 px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary" />
            <button onClick={lookup} disabled={loading} className="px-5 py-2.5 bg-vd-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />} Find
            </button>
          </div>
          {userData && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-green-900/20 border border-green-700/40 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">{userData.user.name}</p>
                <p className="text-xs text-gray-400">{userData.user.email} · {userData.user.phone}</p>
              </div>
              <span className="ml-auto text-xs text-green-400">Found — editing below</span>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      {(mode === 'edit' || mode === 'create') && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              {mode === 'create' ? <><UserPlus className="w-5 h-5 text-green-400" /> Create New Profile</> : <><User className="w-5 h-5 text-vd-primary" /> Edit Profile — {userData?.user?.name}</>}
            </h3>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-vd-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {mode === 'create' ? 'Create Profile' : 'Save Changes'}
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* Account */}
            <div>
              <p className="text-xs font-bold text-vd-primary uppercase tracking-widest mb-3">👤 Account Info</p>
              <div className="grid grid-cols-2 gap-3">
                <F label="Full Name *" k="name" placeholder="Rahul Sharma" />
                <F label="Email *" k="email" type="email" placeholder="rahul@email.com" />
                <F label="Phone" k="phone" placeholder="+91 9876543210" />
                {mode === 'create' && <F label="Password (default: Vivah@1234)" k="password" type="password" placeholder="Leave blank for default" />}
              </div>
            </div>

            {/* Personal */}
            <div>
              <p className="text-xs font-bold text-vd-primary uppercase tracking-widest mb-3">🧬 Personal Details</p>
              <div className="grid grid-cols-2 gap-3">
                <S label="Gender" k="gender" options={[{v:'MALE',l:'Male'},{v:'FEMALE',l:'Female'},{v:'OTHER',l:'Other'}]} />
                <F label="Date of Birth" k="dob" type="date" />
                <F label="Height (cm)" k="height" type="number" placeholder="165" />
                <F label="Weight (kg)" k="weight" type="number" placeholder="60" />
                <S label="Marital Status" k="maritalStatus" options={[{v:'NEVER_MARRIED',l:'Never Married'},{v:'DIVORCED',l:'Divorced'},{v:'WIDOWED',l:'Widowed'}]} />
                <S label="Diet" k="diet" options={['Vegetarian','Non-Vegetarian','Eggetarian','Vegan']} />
                <S label="Smoking" k="smoking" options={[{v:'NO',l:'No'},{v:'OCCASIONALLY',l:'Occasionally'},{v:'YES',l:'Yes'}]} />
                <S label="Drinking" k="drinking" options={[{v:'NO',l:'No'},{v:'OCCASIONALLY',l:'Occasionally'},{v:'YES',l:'Yes'}]} />
              </div>
            </div>

            {/* Religion */}
            <div>
              <p className="text-xs font-bold text-vd-primary uppercase tracking-widest mb-3">🙏 Religion & Community</p>
              <div className="grid grid-cols-2 gap-3">
                <F label="Religion" k="religion" placeholder="Hindu" />
                <F label="Caste" k="caste" placeholder="Brahmin" />
                <F label="Mother Tongue" k="motherTongue" placeholder="Hindi" />
                <S label="Manglik" k="manglik" options={['Yes','No',"Don't Know"]} />
                <F label="Horoscope Sign" k="horoscopeSign" placeholder="Aries" />
                <F label="Nakshatra" k="nakshatra" placeholder="Ashwini" />
              </div>
            </div>

            {/* Location */}
            <div>
              <p className="text-xs font-bold text-vd-primary uppercase tracking-widest mb-3">📍 Location</p>
              <div className="grid grid-cols-3 gap-3">
                <F label="City" k="city" placeholder="Mumbai" />
                <F label="State" k="state" placeholder="Maharashtra" />
                <F label="Country" k="country" placeholder="India" />
              </div>
            </div>

            {/* Career */}
            <div>
              <p className="text-xs font-bold text-vd-primary uppercase tracking-widest mb-3">💼 Career</p>
              <div className="grid grid-cols-2 gap-3">
                <F label="Education" k="education" placeholder="B.Tech" />
                <F label="Profession" k="profession" placeholder="Software Engineer" />
                <div className="col-span-2"><F label="Annual Income" k="income" placeholder="₹10-20 Lakh" /></div>
              </div>
            </div>

            {/* Family */}
            <div>
              <p className="text-xs font-bold text-vd-primary uppercase tracking-widest mb-3">👨‍👩‍👧 Family</p>
              <div className="grid grid-cols-2 gap-3">
                <S label="Family Type" k="familyType" options={['Nuclear','Joint','Extended']} />
                <S label="Family Status" k="familyStatus" options={['Middle Class','Upper Middle Class','Rich / Affluent']} />
                <F label="Father's Occupation" k="fatherOccupation" placeholder="Business" />
                <F label="Mother's Occupation" k="motherOccupation" placeholder="Homemaker" />
              </div>
            </div>

            {/* About */}
            <div>
              <label className={lbl}>About Me</label>
              <textarea value={form.aboutMe || ''} onChange={e => set('aboutMe', e.target.value)} rows={3}
                placeholder="Write something about this person…"
                className={inp + ' resize-none'} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Broadcast Message Tab ─────────────────────────────────────────────────────
export function BroadcastTab() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [filter, setFilter] = useState('all');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch('/api/admin/broadcast').then(r => r.json()).then(d => setHistory(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const send = async () => {
    if (!title.trim() || !message.trim()) { toast.error('Title and message required'); return; }
    if (!confirm(`Send to all ${filter} users?`)) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, link, filter }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(`✅ Sent to ${data.sent} users!`);
      setTitle(''); setMessage(''); setLink('');
      fetch('/api/admin/broadcast').then(r => r.json()).then(d => setHistory(Array.isArray(d) ? d : [])).catch(() => {});
    } finally { setSending(false); }
  };

  const FILTERS = [
    { v: 'all',        l: '🌐 All Users',        desc: 'Every active user' },
    { v: 'premium',    l: '⭐ Premium Users',     desc: 'Only paid members' },
    { v: 'free',       l: '🆓 Free Users',        desc: 'Non-premium members' },
    { v: 'verified',   l: '✅ Verified Users',    desc: 'Admin-approved profiles' },
    { v: 'unverified', l: '⏳ Unverified Users',  desc: 'Pending approval' },
    { v: 'male',       l: '👨 Male Users',        desc: 'All male profiles' },
    { v: 'female',     l: '👩 Female Users',      desc: 'All female profiles' },
  ];

  const TEMPLATES = [
    { label: '🎉 New Feature', title: '🎉 New Feature Available!', msg: 'We have added exciting new features to help you find your perfect match. Check them out now!' },
    { label: '💕 Reminder', title: '💕 Your Perfect Match is Waiting!', msg: 'Complete your profile to get better matches. Add your photo and details to stand out!' },
    { label: '⭐ Upgrade', title: '⭐ Upgrade to Premium Today!', msg: 'Unlock unlimited chat, view contact details, and get priority in search results. Special offer available!' },
    { label: '🎁 Offer', title: '🎁 Special Offer Just for You!', msg: 'Get 20% off on Premium plans this week. Use code VIVAH20 at checkout. Limited time offer!' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Compose */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-vd-primary" /> Compose Broadcast</h3>

            {/* Templates */}
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Quick Templates</p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map(t => (
                  <button key={t.label} onClick={() => { setTitle(t.title); setMessage(t.msg); }}
                    className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">{t.label}</button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className={lbl}>Notification Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New Feature Available!"
                  className={inp} maxLength={80} />
                <p className="text-xs text-gray-600 mt-1">{title.length}/80</p>
              </div>
              <div>
                <label className={lbl}>Message *</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Write your message here…"
                  className={inp + ' resize-none'} maxLength={300} />
                <p className="text-xs text-gray-600 mt-1">{message.length}/300</p>
              </div>
              <div>
                <label className={lbl}>Link (optional)</label>
                <input value={link} onChange={e => setLink(e.target.value)} placeholder="/dashboard or /premium"
                  className={inp} />
              </div>
            </div>
          </div>

          <button onClick={send} disabled={sending || !title || !message}
            className="w-full py-3.5 bg-gradient-to-r from-vd-primary to-pink-600 text-white rounded-2xl font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {sending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
            {sending ? 'Sending…' : `Send to ${FILTERS.find(f => f.v === filter)?.l}`}
          </button>
        </div>

        {/* Target filter */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 h-fit">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" /> Target Audience</h3>
          <div className="space-y-2">
            {FILTERS.map(f => (
              <button key={f.v} onClick={() => setFilter(f.v)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${filter === f.v ? 'bg-vd-primary/20 border border-vd-primary/40 text-white' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${filter === f.v ? 'border-vd-primary bg-vd-primary' : 'border-gray-500'}`} />
                <div>
                  <p className="font-medium">{f.l}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-gray-400" /> Recent Broadcasts</h3>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-xl">
                <Bell className="w-4 h-4 text-vd-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{h.title}</p>
                  <p className="text-xs text-gray-400 truncate">{h.message}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">{h.recipients} sent</p>
                  <p className="text-xs text-gray-600">{h.createdAt ? format(new Date(h.createdAt), 'dd MMM') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Activity Log Tab ──────────────────────────────────────────────────────────
export function ActivityTab() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('registrations');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/activity?type=all');
    const d = await res.json();
    setData(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const calcAge = (dob) => dob ? Math.floor((Date.now() - new Date(dob)) / 31557600000) : null;

  const SECTIONS = [
    { id: 'registrations', label: '🆕 New Registrations', icon: UserPlus },
    { id: 'interests',     label: '💕 Interests',         icon: Heart },
    { id: 'messages',      label: '💬 Messages',          icon: MessageSquare },
    { id: 'logins',        label: '🔐 Recent Logins',     icon: Activity },
    { id: 'premiumActivity', label: '⭐ Premium Activity', icon: Crown },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">Live activity feed — last 20 events per category</p>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-xl text-sm hover:bg-gray-700 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${activeSection === s.id ? 'bg-vd-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>
            <s.icon className="w-3.5 h-3.5" />{s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          {/* Registrations */}
          {activeSection === 'registrations' && (
            <div className="divide-y divide-gray-700">
              {(data.registrations || []).map(u => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
                    {u.photo ? <img src={u.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500">{u.name?.[0]}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email} {u.phone ? `· ${u.phone}` : ''}</p>
                    <div className="flex gap-2 mt-0.5">
                      {u.gender && <span className="text-xs text-gray-500">{u.gender === 'MALE' ? '👨' : '👩'}</span>}
                      {u.city && <span className="text-xs text-gray-500">📍{u.city}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{u.createdAt ? format(new Date(u.createdAt), 'dd MMM') : ''}</p>
                    <p className="text-xs text-gray-600">{u.createdAt ? format(new Date(u.createdAt), 'h:mm a') : ''}</p>
                  </div>
                </div>
              ))}
              {!data.registrations?.length && <p className="text-center py-10 text-gray-600 text-sm">No recent registrations</p>}
            </div>
          )}

          {/* Interests */}
          {activeSection === 'interests' && (
            <div className="divide-y divide-gray-700">
              {(data.interests || []).map(i => (
                <div key={i.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/30">
                  <Heart className={`w-5 h-5 flex-shrink-0 ${i.status === 'ACCEPTED' ? 'text-green-400' : i.status === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white"><span className="font-semibold">{i.senderName}</span> → <span className="font-semibold">{i.receiverName}</span></p>
                    <p className="text-xs text-gray-500">{i.senderEmail}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${i.status === 'ACCEPTED' ? 'bg-green-900/30 text-green-400' : i.status === 'REJECTED' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{i.status}</span>
                    <p className="text-xs text-gray-600 mt-1">{i.createdAt ? format(new Date(i.createdAt), 'dd MMM h:mm a') : ''}</p>
                  </div>
                </div>
              ))}
              {!data.interests?.length && <p className="text-center py-10 text-gray-600 text-sm">No recent interests</p>}
            </div>
          )}

          {/* Messages */}
          {activeSection === 'messages' && (
            <div className="divide-y divide-gray-700">
              {(data.messages || []).map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/30">
                  <MessageSquare className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white"><span className="font-semibold">{m.senderName}</span> → <span className="font-semibold">{m.receiverName}</span></p>
                    <p className="text-xs text-gray-400 truncate">{m.type === 'TEXT' ? m.content : `[${m.type}]`}</p>
                  </div>
                  <p className="text-xs text-gray-600 flex-shrink-0">{m.createdAt ? format(new Date(m.createdAt), 'dd MMM h:mm a') : ''}</p>
                </div>
              ))}
              {!data.messages?.length && <p className="text-center py-10 text-gray-600 text-sm">No recent messages</p>}
            </div>
          )}

          {/* Logins */}
          {activeSection === 'logins' && (
            <div className="divide-y divide-gray-700">
              {(data.logins || []).map(u => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/30">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-gray-400">{u.name?.[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email} {u.city ? `· 📍${u.city}` : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{u.lastLoginAt ? format(new Date(u.lastLoginAt), 'dd MMM') : '—'}</p>
                    <p className="text-xs text-gray-600">{u.lastLoginAt ? format(new Date(u.lastLoginAt), 'h:mm a') : ''}</p>
                  </div>
                </div>
              ))}
              {!data.logins?.length && <p className="text-center py-10 text-gray-600 text-sm">No login data</p>}
            </div>
          )}

          {/* Premium */}
          {activeSection === 'premiumActivity' && (
            <div className="divide-y divide-gray-700">
              {(data.premiumActivity || []).map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/30">
                  <Crown className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>{s.plan}</span>
                    <p className="text-xs text-gray-500 mt-1">₹{s.amount}</p>
                    <p className="text-xs text-gray-600">{s.startDate ? format(new Date(s.startDate), 'dd MMM') : ''}</p>
                  </div>
                </div>
              ))}
              {!data.premiumActivity?.length && <p className="text-center py-10 text-gray-600 text-sm">No premium activity</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Premium Manager Tab ───────────────────────────────────────────────────────
export function PremiumManagerTab() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);

  const searchUsers = async () => {
    if (!search.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&limit=20`);
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  const grantPremium = async (userId, plan, days) => {
    setSaving(userId);
    const expiry = new Date(Date.now() + days * 86400000);
    const res = await fetch('/api/admin/create-profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isPremium: true, premiumPlan: plan, premiumExpiry: expiry.toISOString() }),
    });
    if (res.ok) {
      toast.success(`✅ ${plan} granted for ${days} days`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isPremium: true, premiumPlan: plan, premiumExpiry: expiry } : u));
    } else toast.error('Failed');
    setSaving(null);
  };

  const revokePremium = async (userId) => {
    if (!confirm('Revoke premium access?')) return;
    setSaving(userId);
    const res = await fetch('/api/admin/create-profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isPremium: false, premiumPlan: null, premiumExpiry: null }),
    });
    if (res.ok) {
      toast.success('Premium revoked');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isPremium: false } : u));
    }
    setSaving(null);
  };

  const PLANS = [
    { plan: 'SILVER',   days: 30,  label: '🥈 Silver 30d',  color: 'bg-gray-500' },
    { plan: 'GOLD',     days: 30,  label: '🥇 Gold 30d',    color: 'bg-yellow-600' },
    { plan: 'PLATINUM', days: 30,  label: '💎 Platinum 30d', color: 'bg-blue-600' },
    { plan: 'GOLD',     days: 90,  label: '🥇 Gold 90d',    color: 'bg-yellow-700' },
    { plan: 'PLATINUM', days: 365, label: '💎 Platinum 1yr', color: 'bg-blue-700' },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400" /> Search User to Manage Premium</h3>
        <div className="flex gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchUsers()}
            placeholder="Search by name, email or phone…" className={inp + ' flex-1'} />
          <button onClick={searchUsers} disabled={loading} className="px-5 py-2.5 bg-vd-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />} Search
          </button>
        </div>
      </div>

      {users.length > 0 && (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
                  {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-500">{u.name?.[0]}</div>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{u.name}</p>
                    {u.isPremium && <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full">⭐ {u.premiumPlan || 'Premium'}</span>}
                    {!u.isPremium && <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Free</span>}
                  </div>
                  <p className="text-xs text-gray-400">{u.email}</p>
                  {u.isPremium && u.premiumExpiry && (
                    <p className="text-xs text-yellow-600">Expires: {format(new Date(u.premiumExpiry), 'dd MMM yyyy')}</p>
                  )}
                </div>
                {u.isPremium && (
                  <button onClick={() => revokePremium(u.id)} disabled={saving === u.id}
                    className="px-3 py-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-xl text-xs transition-colors disabled:opacity-50">
                    Revoke
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {PLANS.map(p => (
                  <button key={`${p.plan}-${p.days}`} onClick={() => grantPremium(u.id, p.plan, p.days)}
                    disabled={saving === u.id}
                    className={`${p.color} text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity`}>
                    {saving === u.id ? '…' : p.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
