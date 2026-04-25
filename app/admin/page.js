'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users, Star, Shield, Flag, MessageCircle, TrendingUp,
  UserCheck, AlertTriangle, Settings, Bell, Search,
  CheckCircle, XCircle, Ban, Eye, Edit2, Trash2,
  DollarSign, BarChart2, Heart, LogOut, ChevronDown,
  RefreshCw, Mail, Phone, Calendar, MapPin, Lock, Unlock, FileText,
  Sparkles
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import AdminSupportChat from '@/components/AdminSupportChat';
import { AllMembersTab, MatchMakerTab } from '@/components/AdminMatchMaker';

const TABS = [
  { id: 'overview',      label: 'Overview',        icon: BarChart2 },
  { id: 'pending',       label: 'Pending Approval', icon: UserCheck, badge: 'pendingAdminVerify' },
  { id: 'members',       label: 'All Members',      icon: Users },
  { id: 'matchmaker',    label: 'Match Maker',      icon: Sparkles },
  { id: 'users',         label: 'All Users',        icon: Users },
  { id: 'verifications', label: 'ID Verifications', icon: Shield, badge: 'pendingVerifications' },
  { id: 'reports',       label: 'Reports',          icon: Flag, badge: 'pendingReports' },
  { id: 'subscriptions', label: 'Subscriptions',    icon: Star },
  { id: 'plans',         label: 'Plan Config',      icon: Settings },
  { id: 'coupons',       label: 'Coupon Codes',     icon: Star },
  { id: 'stories',       label: 'Success Stories',  icon: Heart },
  { id: 'homepage',      label: 'Homepage Content', icon: FileText },
  { id: 'options',       label: 'Profile Options',  icon: Edit2 },
  { id: 'siteconfig',    label: 'Site Settings',    icon: Lock },
  { id: 'support',       label: 'Support Chat',     icon: MessageCircle },
];

const DEFAULT_PERMISSIONS = {
  canChat: false,
  interestLimit: 5,
  canSeeContact: false,
  canBoostProfile: false,
  canSeeWhoViewed: false,
  unlimitedInterests: false,
  aiMatchScore: false,
};

const PLAN_PERMISSIONS = {
  FREE:     { canChat: false, interestLimit: 5,  canSeeContact: false, canBoostProfile: false, canSeeWhoViewed: false, unlimitedInterests: false, aiMatchScore: false },
  SILVER:   { canChat: false, interestLimit: 50, canSeeContact: true,  canBoostProfile: false, canSeeWhoViewed: true,  unlimitedInterests: false, aiMatchScore: false },
  GOLD:     { canChat: true,  interestLimit: -1, canSeeContact: true,  canBoostProfile: true,  canSeeWhoViewed: true,  unlimitedInterests: true,  aiMatchScore: false },
  PLATINUM: { canChat: true,  interestLimit: -1, canSeeContact: true,  canBoostProfile: true,  canSeeWhoViewed: true,  unlimitedInterests: true,  aiMatchScore: true  },
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, bg, sub }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-gray-400 text-sm mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-all relative ${value ? 'bg-vd-primary' : 'bg-gray-600'}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
      </div>
      {label && <span className="text-sm text-gray-300">{label}</span>}
    </label>
  );
}

// ── User Row (reusable) ───────────────────────────────────────────────────────
function UserRow({ u, onView, onApprove, onReject, showActions, statusBadge }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-14 h-14 rounded-2xl overflow-hidden vd-gradient-gold flex items-center justify-center flex-shrink-0">
        {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xl">{u.name?.[0]}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-white">{u.name}</p>
          {statusBadge === 'approved' && <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">✅ Approved</span>}
          {statusBadge === 'rejected' && <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full">❌ Rejected</span>}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5">
          <span>{u.email}</span>
          {u.phone && <span>{u.phone}</span>}
          {u.profile?.city && <span>📍 {u.profile.city}, {u.profile.country}</span>}
          <span>📅 {format(new Date(u.createdAt), 'dd MMM yyyy')}</span>
        </div>
        <div className="flex gap-2 mt-1.5 flex-wrap">
          {u.documents?.length > 0 && <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full">{u.documents.length} doc(s)</span>}
          {u.profile?.religion && <span className="text-xs bg-vd-accent-soft text-vd-primary px-2 py-0.5 rounded-full">{u.profile.religion}</span>}
          {u.profile?.gender && <span className="text-xs bg-vd-accent-soft text-vd-primary px-2 py-0.5 rounded-full">{u.profile.gender}</span>}
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0 flex-wrap">
        <button onClick={onView} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs transition-colors flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" /> View
        </button>
        {showActions && (
          <>
            <button onClick={onApprove} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </button>
            <button onClick={onReject} className="px-3 py-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-xl text-xs transition-colors flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Pending Approval Tab ──────────────────────────────────────────────────────
function PendingApprovalTab({ pendingUsers, allUsers, onApprove, onReject }) {
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  // Approved = adminVerified=true, active; Rejected = isActive=false
  const approvedUsers = (allUsers || []).filter(u => u.adminVerified && u.isActive && u.role === 'USER');
  const rejectedUsers = (allUsers || []).filter(u => !u.isActive && u.role === 'USER');

  const p = selected?.profile || {};
  const age = p.dob ? Math.floor((Date.now() - new Date(p.dob)) / 31557600000) : null;

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'pending' ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>
          Pending
          {pendingUsers.length > 0 && (
            <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-yellow-500 text-white'}`}>
              {pendingUsers.length}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('reviewed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'reviewed' ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>
          Approved & Rejected
          <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${activeTab === 'reviewed' ? 'bg-white/20 text-white' : 'bg-gray-600 text-gray-300'}`}>
            {approvedUsers.length + rejectedUsers.length}
          </span>
        </button>
      </div>

      {/* Pending tab */}
      {activeTab === 'pending' && (
        pendingUsers.length === 0 ? (
          <div className="text-center py-16 text-gray-500"><UserCheck className="w-12 h-12 mx-auto mb-3 text-gray-700" /><p>No pending approvals</p></div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map(u => (
              <UserRow key={u.id} u={u} onView={() => setSelected(u)} onApprove={() => onApprove(u.id)} onReject={() => onReject(u.id)} showActions={true} />
            ))}
          </div>
        )
      )}

      {/* Reviewed tab */}
      {activeTab === 'reviewed' && (
        <div className="space-y-6">
          {/* Approved */}
          <div>
            <h3 className="font-bold text-green-400 mb-3 flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4" /> Approved ({approvedUsers.length})
            </h3>
            {approvedUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700 text-sm">No approved users yet</div>
            ) : (
              <div className="space-y-3">
                {approvedUsers.map(u => <UserRow key={u.id} u={u} onView={() => setSelected(u)} showActions={false} statusBadge="approved" />)}
              </div>
            )}
          </div>
          {/* Rejected */}
          <div>
            <h3 className="font-bold text-red-400 mb-3 flex items-center gap-2 text-sm">
              <XCircle className="w-4 h-4" /> Rejected / Blocked ({rejectedUsers.length})
            </h3>
            {rejectedUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700 text-sm">No rejected users</div>
            ) : (
              <div className="space-y-3">
                {rejectedUsers.map(u => <UserRow key={u.id} u={u} onView={() => setSelected(u)} showActions={false} statusBadge="rejected" />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── User Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="vd-gradient-gold p-5 rounded-t-3xl flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
                {selected.image ? <img src={selected.image} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold text-2xl">{selected.name?.[0]}</span>}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                <p className="text-white/70 text-sm">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="p-5 space-y-5">
              {/* Basic Info */}
              <Section title="Basic Information">
                <Grid items={[
                  { label: 'Phone', value: selected.phone || '—' },
                  { label: 'Gender', value: p.gender || '—' },
                  { label: 'Age', value: age ? `${age} years` : '—' },
                  { label: 'DOB', value: p.dob ? format(new Date(p.dob), 'dd MMM yyyy') : '—' },
                  { label: 'Height', value: p.height ? `${p.height} cm` : '—' },
                  { label: 'Marital Status', value: p.maritalStatus?.replace(/_/g, ' ') || '—' },
                  { label: 'Registered', value: format(new Date(selected.createdAt), 'dd MMM yyyy, h:mm a') },
                ]} />
              </Section>

              {/* Religion */}
              <Section title="Religion & Community">
                <Grid items={[
                  { label: 'Religion', value: p.religion || '—' },
                  { label: 'Caste', value: p.caste || '—' },
                  { label: 'Sub-Caste', value: p.subCaste || '—' },
                  { label: 'Gotra', value: p.gotra || '—' },
                  { label: 'Mother Tongue', value: p.motherTongue || '—' },
                  { label: 'Manglik', value: p.manglik || '—' },
                ]} />
              </Section>

              {/* Location */}
              <Section title="Location">
                <Grid items={[
                  { label: 'Country', value: p.country || '—' },
                  { label: 'State', value: p.state || '—' },
                  { label: 'City', value: p.city || '—' },
                ]} />
              </Section>

              {/* Career */}
              <Section title="Education & Career">
                <Grid items={[
                  { label: 'Education', value: p.education || '—' },
                  { label: 'Profession', value: p.profession || '—' },
                  { label: 'Income', value: p.income || '—' },
                ]} />
              </Section>

              {/* About */}
              {p.aboutMe && (
                <Section title="About Me">
                  <p className="text-sm text-gray-300 leading-relaxed">{p.aboutMe}</p>
                </Section>
              )}

              {/* Photos */}
              {(selected.photos?.length > 0 || selected.image) && (
                <Section title="Profile Photos">
                  <div className="flex gap-2 flex-wrap">
                    {/* Main image */}
                    {selected.image && (
                      <div className="relative">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-700">
                          <img src={selected.image} alt="Main" className="w-full h-full object-cover" />
                        </div>
                    <span className="absolute -top-1 -right-1 bg-vd-primary text-white text-xs px-1.5 py-0.5 rounded-full">Main</span>
                      </div>
                    )}
                    {/* Other photos */}
                    {selected.photos?.filter(ph => !ph.isMain).map((ph, i) => (
                      <div key={i} className="w-24 h-24 rounded-xl overflow-hidden bg-gray-700">
                        <img src={ph.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Documents */}
              <Section title="Uploaded Documents">
                {selected.documents?.length > 0 ? (
                  <div className="space-y-4">
                    {selected.documents.map(doc => (
                      <div key={doc.id} className="bg-gray-750 rounded-xl border border-gray-600 overflow-hidden">
                        {/* Doc header */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-700">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-semibold text-white">{doc.type}</span>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            doc.status === 'APPROVED' ? 'bg-green-900/50 text-green-300' :
                            doc.status === 'REJECTED' ? 'bg-red-900/50 text-red-300' :
                            'bg-yellow-900/50 text-yellow-300'
                          }`}>
                            {doc.status === 'PENDING' ? '⏳ Pending Review' : doc.status === 'APPROVED' ? '✅ Approved' : '❌ Rejected'}
                          </span>
                        </div>
                        {/* Doc preview */}
                        {doc.url ? (
                          doc.url.startsWith('data:image') ? (
                            <div className="p-3 bg-gray-800">
                              <img
                                src={doc.url}
                                alt={doc.type}
                                className="w-full max-h-64 object-contain rounded-lg bg-gray-900"
                                style={{ imageRendering: 'auto' }}
                              />
                              <a href={doc.url} download={`${doc.type.replace(/ /g, '_')}.jpg`}
                        className="mt-2 flex items-center gap-1.5 text-xs text-vd-primary hover:text-vd-primary-dark transition-colors">
                                ⬇ Download Image
                              </a>
                            </div>
                          ) : doc.url.startsWith('data:application/pdf') ? (
                            <div className="p-3 bg-gray-800 text-center">
                              <div className="bg-gray-700 rounded-xl p-6 mb-2">
                                <FileText className="w-12 h-12 text-red-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-300">PDF Document</p>
                              </div>
                              <a href={doc.url} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs bg-red-900/30 text-red-400 hover:bg-red-900/50 px-3 py-1.5 rounded-lg transition-colors">
                                📄 Open PDF in new tab
                              </a>
                            </div>
                          ) : (
                            <div className="p-3 bg-gray-800">
                              <a href={doc.url} target="_blank" rel="noreferrer" className="text-vd-primary text-xs hover:underline">View Document ↗</a>
                            </div>
                          )
                        ) : (
                          <div className="p-4 bg-gray-800 text-center text-gray-500 text-sm">No preview available</div>
                        )}
                        {doc.adminNote && (
                          <div className="px-4 py-2 bg-gray-700 text-xs text-gray-400">Note: {doc.adminNote}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FileText className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No documents uploaded yet</p>
                  </div>
                )}
              </Section>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-gray-700">
                <button onClick={() => { onApprove(selected.id); setSelected(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold transition-colors">
                  <CheckCircle className="w-5 h-5" /> Approve & Send Email
                </button>
                <button onClick={() => { onReject(selected.id); setSelected(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-2xl font-semibold transition-colors">
                  <XCircle className="w-5 h-5" /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">{children}</div>
    </div>
  );
}

function Grid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(item => (
        <div key={item.label}>
          <p className="text-xs text-gray-500">{item.label}</p>
          <p className="text-sm text-white font-medium mt-0.5">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Profile Options Tab ───────────────────────────────────────────────────────
const OPTION_CATEGORIES = [
  { key: 'religion',      label: 'Religion' },
  { key: 'caste_Hindu',   label: 'Caste - Hindu' },
  { key: 'caste_Muslim',  label: 'Caste - Muslim' },
  { key: 'caste_Christian', label: 'Caste - Christian' },
  { key: 'caste_Sikh',    label: 'Caste - Sikh' },
  { key: 'caste_Jain',    label: 'Caste - Jain' },
  { key: 'gotra',         label: 'Gotra' },
  { key: 'motherTongue',  label: 'Mother Tongue' },
  { key: 'education',     label: 'Education' },
  { key: 'profession',    label: 'Profession' },
  { key: 'income',        label: 'Income' },
  { key: 'diet',          label: 'Diet' },
  { key: 'bodyType',      label: 'Body Type' },
  { key: 'complexion',    label: 'Complexion' },
  { key: 'familyType',    label: 'Family Type' },
  { key: 'familyStatus',  label: 'Family Status' },
  { key: 'horoscopeSign', label: 'Horoscope Sign (Rashi)' },
  { key: 'nakshatra',     label: 'Nakshatra' },
];

function ProfileOptionsTab({ options, category, setCategory, newOpt, setNewOpt, onAdd, onToggle, onDelete }) {
  const filtered = options.filter(o => o.category === category);
  const groups = [...new Set(filtered.map(o => o.group).filter(Boolean))];
  const ungrouped = filtered.filter(o => !o.group);
  const catLabel = OPTION_CATEGORIES.find(c => c.key === category)?.label || category;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Profile Options Manager</h2>
          <p className="text-gray-400 text-sm mt-0.5">Add, edit, or disable options that appear in user profile forms</p>
        </div>
        <span className="text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full">{filtered.length} options in {catLabel}</span>
      </div>

      {/* Category selector */}
      <div className="flex flex-wrap gap-2">
        {OPTION_CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${category === c.key ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>
            {c.label}
            <span className="ml-1.5 opacity-60">{options.filter(o => o.category === c.key).length}</span>
          </button>
        ))}
      </div>

      {/* Add new option */}
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
        <h3 className="font-semibold mb-4 text-sm text-gray-300">Add New Option to "{catLabel}"</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Value (stored in DB)</label>
            <input value={newOpt.value} onChange={e => setNewOpt(p => ({ ...p, value: e.target.value, label: p.label || e.target.value }))}
              placeholder="e.g. Sharma" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-vd-primary" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Display Label</label>
            <input value={newOpt.label} onChange={e => setNewOpt(p => ({ ...p, label: e.target.value }))}
              placeholder="e.g. Sharma" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-vd-primary" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Group (optional)</label>
            <input value={newOpt.group} onChange={e => setNewOpt(p => ({ ...p, group: e.target.value }))}
              placeholder="e.g. Brahmin - UP" list={`groups-${category}`}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-vd-primary" />
            <datalist id={`groups-${category}`}>{groups.map(g => <option key={g} value={g} />)}</datalist>
          </div>
        </div>
        <button onClick={onAdd} className="mt-3 vd-gradient-gold text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          + Add Option
        </button>
      </div>

      {/* Options list */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-700/50 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-300">{catLabel} Options</p>
          <p className="text-xs text-gray-500">{filtered.filter(o => o.isActive).length} active / {filtered.length} total</p>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 500 }}>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              No options yet. Add some above or run: <code className="bg-gray-700 px-2 py-0.5 rounded text-xs">npm run seed-options</code>
            </div>
          ) : (
            <>
              {/* Grouped */}
              {groups.map(group => (
                <div key={group}>
                  <div className="px-4 py-2 bg-gray-700/30 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0">{group}</div>
                  {filtered.filter(o => o.group === group).map(opt => (
                    <OptionRow key={opt.id} opt={opt} onToggle={onToggle} onDelete={onDelete} />
                  ))}
                </div>
              ))}
              {/* Ungrouped */}
              {ungrouped.length > 0 && (
                <>
                  {groups.length > 0 && <div className="px-4 py-2 bg-gray-700/30 text-xs font-bold text-gray-400 uppercase tracking-wider">Other</div>}
                  {ungrouped.map(opt => <OptionRow key={opt.id} opt={opt} onToggle={onToggle} onDelete={onDelete} />)}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OptionRow({ opt, onToggle, onDelete }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${!opt.isActive ? 'opacity-40' : ''}`}>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-white">{opt.label}</span>
        {opt.value !== opt.label && <span className="text-xs text-gray-500 ml-2">({opt.value})</span>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onToggle(opt.id, opt.isActive)}
          className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${opt.isActive ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
          {opt.isActive ? 'Active' : 'Disabled'}
        </button>
        <button onClick={() => onDelete(opt.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Verifications Tab ─────────────────────────────────────────────────────────
function VerificationsTab({ verifications, onVerify }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [kycLoading, setKycLoading] = useState(null);

  const pending  = verifications.filter(d => d.status === 'PENDING');
  const reviewed = verifications.filter(d => d.status !== 'PENDING');

  const startKyc = async (userId) => {
    setKycLoading(userId);
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.sessionId) {
        toast.success('KYC invite sent to user\'s email');
        window.open(`/admin/kyc/${data.sessionId}`, '_blank');
      } else {
        toast.error(data.error || 'Failed to start KYC');
      }
    } catch {
      toast.error('Failed to start KYC');
    } finally {
      setKycLoading(null);
    }
  };

  const DocCard = ({ doc, showActions }) => (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
      <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-white">{doc.user?.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              doc.status === 'APPROVED' ? 'bg-green-900/30 text-green-400' :
              doc.status === 'REJECTED' ? 'bg-red-900/30 text-red-400' :
              'bg-yellow-900/30 text-yellow-400'
            }`}>{doc.status}</span>
          </div>
          <p className="text-gray-400 text-sm">{doc.user?.email}</p>
          <p className="text-gray-500 text-xs mt-1">Document: {doc.type}</p>
          <p className="text-gray-500 text-xs">Submitted: {format(new Date(doc.createdAt), 'dd MMM yyyy, h:mm a')}</p>
          {doc.url && <a href={doc.url} target="_blank" rel="noreferrer" className="text-vd-primary text-xs hover:underline mt-1 inline-block">View Document ↗</a>}
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          {/* Video KYC button — always visible for approved docs */}
          <button
            onClick={() => startKyc(doc.user?.id || doc.userId)}
            disabled={kycLoading === (doc.user?.id || doc.userId)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {kycLoading === (doc.user?.id || doc.userId) ? (
              <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>🎥</span>
            )}
            Video KYC
          </button>
          {showActions && (
            <>
              <button onClick={() => onVerify(doc.id, 'APPROVED')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors">Approve</button>
              <button onClick={() => onVerify(doc.id, 'REJECTED')} className="px-4 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-xl text-sm transition-colors">Reject</button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'pending' ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>
          Pending
          {pending.length > 0 && (
            <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-yellow-500 text-white'}`}>
              {pending.length}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('reviewed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'reviewed' ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>
          Approved & Rejected
          {reviewed.length > 0 && (
            <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${activeTab === 'reviewed' ? 'bg-white/20 text-white' : 'bg-gray-600 text-gray-300'}`}>
              {reviewed.length}
            </span>
          )}
        </button>
      </div>

      {/* Pending tab */}
      {activeTab === 'pending' && (
        pending.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700">
            <Shield className="w-12 h-12 mx-auto mb-3 text-gray-700" />
            <p>No pending verifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(doc => <DocCard key={doc.id} doc={doc} showActions={true} />)}
          </div>
        )
      )}

      {/* Reviewed tab */}
      {activeTab === 'reviewed' && (
        reviewed.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-700" />
            <p>No reviewed verifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewed.map(doc => <DocCard key={doc.id} doc={doc} showActions={false} />)}
          </div>
        )
      )}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPct: 10, maxUses: 100, expiresAt: '' });
  const [stories, setStories] = useState([]);
  const [editStory, setEditStory] = useState(null);
  const [newStory, setNewStory] = useState({ coupleName: '', location: '', story: '', imageUrl: '', sortOrder: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState(null);
  const [userFilter, setUserFilter] = useState('all');
  const [profileOptions, setProfileOptions] = useState([]);
  const [optCategory, setOptCategory] = useState('religion');
  const [newOpt, setNewOpt] = useState({ value: '', label: '', group: '' });
  const [siteConfig, setSiteConfig] = useState({ freeTrialDays: '1' });
  const [savingConfig, setSavingConfig] = useState(false);

  // Homepage content state
  const [hpSlides, setHpSlides] = useState([]);
  const [hpStats, setHpStats] = useState([]);
  const [hpFeatures, setHpFeatures] = useState([]);
  const [hpTab, setHpTab] = useState('slides');
  const [hpSaving, setHpSaving] = useState(false);
  const [hpEditSlide, setHpEditSlide] = useState(null);
  const [hpEditStat, setHpEditStat] = useState(null);
  const [hpEditFeature, setHpEditFeature] = useState(null);
  const BLANK_SLIDE = { tag: '', headline: '', highlight: '', sub: '', sortOrder: 0 };
  const BLANK_STAT = { icon: 'Heart', value: 0, suffix: '', label: '', sortOrder: 0 };
  const BLANK_FEATURE = { icon: 'Heart', title: '', desc: '', sortOrder: 0 };
  const [newSlide, setNewSlide] = useState(BLANK_SLIDE);
  const [newStat, setNewStat] = useState(BLANK_STAT);
  const [newFeature, setNewFeature] = useState(BLANK_FEATURE);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/dashboard');
  }, [status, session, router]);

  const loadAll = async () => {
    setLoading(true);
    const [s, u, r, v, sub, pl, couponsData, storiesData, slidesData, statsData, featuresData] = await Promise.all([
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/admin/users?limit=100').then(r => r.json()),
      fetch('/api/admin/reports').then(r => r.json()),
      fetch('/api/admin/verifications').then(r => r.json()),
      fetch('/api/admin/subscriptions').then(r => r.json()).catch(() => []),
      fetch('/api/admin/plans').then(r => r.json()).catch(() => []),
      fetch('/api/admin/coupons').then(r => r.json()).catch(() => []),
      fetch('/api/admin/stories').then(r => r.json()).catch(() => []),
      fetch('/api/admin/homepage/slides').then(r => r.json()).catch(() => []),
      fetch('/api/admin/homepage/stats').then(r => r.json()).catch(() => []),
      fetch('/api/admin/homepage/features').then(r => r.json()).catch(() => []),
    ]);
    setStats(s);
    setUsers(u.users || []);
    setPendingUsers((u.users || []).filter(u => !u.adminVerified && u.role === 'USER'));
    setReports(r);
    setVerifications(v);
    setSubscriptions(sub);
    setPlans(pl);
    setCoupons(Array.isArray(couponsData) ? couponsData : []);
    setStories(Array.isArray(storiesData) ? storiesData : []);
    setHpSlides(Array.isArray(slidesData) ? slidesData : []);
    setHpStats(Array.isArray(statsData) ? statsData : []);
    setHpFeatures(Array.isArray(featuresData) ? featuresData : []);
    // Load profile options
    fetch('/api/profile-options').then(r => r.json()).then(setProfileOptions).catch(() => {});
    // Load site config
    fetch('/api/admin/siteconfig').then(r => r.json()).then(setSiteConfig).catch(() => {});
    setLoading(false);
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') loadAll();
  }, [status]); // Only trigger on auth status change, not on every session object update

  const updateUser = async (id, data) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (res.ok) { toast.success('Updated'); loadAll(); } else toast.error('Failed');
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    toast.success('User deleted'); loadAll();
  };

  const handleVerification = async (docId, status) => {
    await fetch('/api/admin/verifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docId, status }),
    });
    toast.success(status === 'APPROVED' ? '✅ Approved' : '❌ Rejected');
    // Update locally — move from pending to approved/rejected without full reload
    setVerifications(prev => prev.map(d => d.id === docId ? { ...d, status } : d));
  };

  const handleReport = async (reportId, status) => {
    await fetch('/api/admin/reports', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId, status }),
    });
    toast.success('Report updated'); loadAll();
  };

  const savePlan = async () => {
    if (!editPlan) return;
    const res = await fetch('/api/admin/plans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editPlan, permissions: editPlan.permissions }),
    });
    if (res.ok) { toast.success('Plan saved'); setEditPlan(null); loadAll(); } else toast.error('Failed');
  };

  const createCoupon = async () => {
    if (!newCoupon.code.trim()) { toast.error('Enter a coupon code'); return; }
    const res = await fetch('/api/admin/coupons', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newCoupon, code: newCoupon.code.toUpperCase() }),
    });
    if (res.ok) {
      toast.success('Coupon created');
      setNewCoupon({ code: '', discountPct: 10, maxUses: 100, expiresAt: '' });
      loadAll();
    } else { const d = await res.json(); toast.error(d.error || 'Failed'); }
  };

  const toggleCoupon = async (id, isActive) => {
    await fetch('/api/admin/coupons', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    loadAll();
  };

  const deleteCoupon = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    await fetch('/api/admin/coupons', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    toast.success('Deleted'); loadAll();
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setNewCoupon(p => ({ ...p, code }));
  };

  const saveStory = async (data) => {
    const res = await fetch('/api/admin/stories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) { toast.success(data.id ? 'Story updated' : 'Story added'); setEditStory(null); setNewStory({ coupleName: '', location: '', story: '', imageUrl: '', sortOrder: 0 }); loadAll(); }
    else toast.error('Failed');
  };

  const deleteStory = async (id) => {
    if (!confirm('Delete this story?')) return;
    await fetch('/api/admin/stories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast.success('Deleted'); loadAll();
  };

  // ── Homepage content helpers ──────────────────────────────────────────────
  const saveHpItem = async (endpoint, data, onSuccess) => {
    setHpSaving(true);
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { toast.success('Saved'); onSuccess(); loadAll(); }
      else toast.error('Failed to save');
    } finally { setHpSaving(false); }
  };

  const deleteHpItem = async (endpoint, id) => {
    if (!confirm('Delete this item?')) return;
    await fetch(endpoint, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast.success('Deleted'); loadAll();
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
    const matchFilter =
      userFilter === 'all' ? true :
      userFilter === 'premium' ? u.isPremium :
      userFilter === 'pending' ? !u.adminVerified :
      userFilter === 'blocked' ? !u.isActive :
      userFilter === 'verified' ? u.verificationBadge : true;
    return matchSearch && matchFilter;
  });

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-vd-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400">Loading admin panel…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 vd-gradient-gold rounded-full flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="font-bold">Milan Admin</span>
        </div>
        <button onClick={() => setMobileMenuOpen(o => !o)} className="p-2 text-gray-400 hover:text-white">
          {mobileMenuOpen ? <XCircle className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile menu overlay ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/60" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-gray-900 border-r border-gray-800 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800">
              <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {TABS.map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'vd-gradient-gold text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  <t.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{t.label}</span>
                  {t.badge && stats?.[t.badge] > 0 && (
                    <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{stats[t.badge]}</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-gray-800 space-y-1">
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
                <Eye className="w-4 h-4" /> View Site
              </Link>
              <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-all">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-64 bg-gray-900 border-r border-gray-800 flex-col fixed h-full z-20">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 vd-gradient-gold rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-lg">Milan Admin</span>
          </div>
          <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'vd-gradient-gold text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <t.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{t.label}</span>
              {t.badge && stats?.[t.badge] > 0 && (
                <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{stats[t.badge]}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
            <Eye className="w-4 h-4" /> View Site
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 md:ml-64 p-4 md:p-6 overflow-y-auto pt-16 md:pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold capitalize">{TABS.find(t => t.id === tab)?.label}</h1>
            <p className="text-gray-500 text-xs md:text-sm mt-0.5 hidden sm:block">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <button onClick={loadAll} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-xl text-sm hover:bg-gray-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="text-blue-400" bg="bg-blue-900/20" sub={`+${stats?.newUsersToday} today`} />
              <StatCard icon={Star} label="Premium Users" value={stats?.premiumUsers} color="text-yellow-400" bg="bg-yellow-900/20" sub={`${stats?.activeSubscriptions} active subs`} />
              <StatCard icon={UserCheck} label="Pending Approval" value={stats?.pendingAdminVerify} color="text-orange-400" bg="bg-orange-900/20" sub="Awaiting admin verify" />
              <StatCard icon={Flag} label="Pending Reports" value={stats?.pendingReports} color="text-red-400" bg="bg-red-900/20" />
              <StatCard icon={MessageCircle} label="Total Messages" value={stats?.totalMessages} color="text-vd-primary" bg="bg-vd-accent-soft dark:bg-vd-accent/20" />
              <StatCard icon={Heart} label="Total Interests" value={stats?.totalInterests} color="text-vd-primary" bg="bg-vd-accent-soft dark:bg-vd-accent/20" />
              <StatCard icon={TrendingUp} label="New This Month" value={stats?.newUsersMonth} color="text-green-400" bg="bg-green-900/20" />
              <StatCard icon={Shield} label="ID Verifications" value={stats?.pendingVerifications} color="text-cyan-400" bg="bg-cyan-900/20" sub="Pending review" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="font-semibold mb-4 text-gray-300">Gender Distribution</h3>
                <div className="space-y-3">
                  {[{ label: 'Male', val: stats?.maleUsers, color: 'bg-blue-500' }, { label: 'Female', val: stats?.femaleUsers, color: 'bg-vd-primary' }].map(g => (
                    <div key={g.label}>
                      <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">{g.label}</span><span className="text-white font-medium">{g.val}</span></div>
                      <div className="h-2 bg-gray-700 rounded-full"><div className={`h-2 ${g.color} rounded-full`} style={{ width: `${stats?.totalUsers ? (g.val / stats.totalUsers * 100) : 0}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="font-semibold mb-4 text-gray-300">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: `Approve ${stats?.pendingAdminVerify} pending users`, action: () => setTab('pending'), color: 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/50' },
                    { label: `Review ${stats?.pendingReports} reports`, action: () => setTab('reports'), color: 'bg-red-900/30 text-red-400 hover:bg-red-900/50' },
                    { label: `Verify ${stats?.pendingVerifications} documents`, action: () => setTab('verifications'), color: 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' },
                    { label: 'Configure subscription plans', action: () => setTab('plans'), color: 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50' },
                  ].map(a => (
                    <button key={a.label} onClick={a.action} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${a.color}`}>{a.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PENDING APPROVAL ── */}
        {tab === 'pending' && (
          <PendingApprovalTab
            pendingUsers={pendingUsers}
            allUsers={users}
            onApprove={(id) => updateUser(id, { adminVerified: true })}
            onReject={(id) => updateUser(id, { isActive: false })}
          />
        )}

        {/* ── ALL USERS ── */}
        {tab === 'users' && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email…"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-pink-500" />
              </div>
              <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-pink-500">
                <option value="all">All Users ({users.length})</option>
                <option value="pending">Pending Approval</option>
                <option value="premium">Premium</option>
                <option value="verified">ID Verified</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700/50">
                    <tr>{['Name','Email','Status','Plan','Joined','Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.name?.[0]}</div>
                            <div>
                              <p className="font-medium text-white">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.profile?.city || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${u.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{u.isActive ? 'Active' : 'Blocked'}</span>
                            {!u.adminVerified && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/30 text-orange-400 w-fit">Pending</span>}
                            {u.verificationBadge && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 w-fit">Verified</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {u.isPremium ? <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full">{u.premiumPlan || 'Premium'}</span> : <span className="text-xs text-gray-500">Free</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(u.createdAt), 'dd MMM yy')}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {!u.adminVerified && <button onClick={() => updateUser(u.id, { adminVerified: true })} title="Approve" className="p-1.5 bg-green-900/30 text-green-400 rounded-lg hover:bg-green-900/50 transition-colors"><CheckCircle className="w-3.5 h-3.5" /></button>}
                            <button onClick={() => updateUser(u.id, { isActive: !u.isActive })} title={u.isActive ? 'Block' : 'Unblock'} className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'}`}>
                              {u.isActive ? <Ban className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => updateUser(u.id, { isPremium: !u.isPremium })} title="Toggle Premium" className="p-1.5 bg-yellow-900/30 text-yellow-400 rounded-lg hover:bg-yellow-900/50 transition-colors"><Star className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteUser(u.id, u.name)} title="Delete" className="p-1.5 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && <div className="text-center py-10 text-gray-500">No users found</div>}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filteredUsers.length === 0 && <div className="text-center py-10 text-gray-500">No users found</div>}
              {filteredUsers.map(u => (
                <div key={u.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">{u.name?.[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{u.isActive ? 'Active' : 'Blocked'}</span>
                      {u.isPremium && <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full">{u.premiumPlan || 'Premium'}</span>}
                      {u.verificationBadge && <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full">Verified</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{u.profile?.city || '—'} · {format(new Date(u.createdAt), 'dd MMM yy')}</p>
                    <div className="flex gap-1.5">
                      {!u.adminVerified && <button onClick={() => updateUser(u.id, { adminVerified: true })} className="p-1.5 bg-green-900/30 text-green-400 rounded-lg"><CheckCircle className="w-3.5 h-3.5" /></button>}
                      <button onClick={() => updateUser(u.id, { isActive: !u.isActive })} className={`p-1.5 rounded-lg ${u.isActive ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                        {u.isActive ? <Ban className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => updateUser(u.id, { isPremium: !u.isPremium })} className="p-1.5 bg-yellow-900/30 text-yellow-400 rounded-lg"><Star className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteUser(u.id, u.name)} className="p-1.5 bg-red-900/30 text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ALL MEMBERS ── */}
        {tab === 'members' && <AllMembersTab session={session} />}

        {/* ── MATCH MAKER ── */}
        {tab === 'matchmaker' && <MatchMakerTab session={session} />}

        {/* ── ID VERIFICATIONS ── */}
        {tab === 'verifications' && (
          <VerificationsTab
            verifications={verifications}
            onVerify={handleVerification}
          />
        )}

        {/* ── REPORTS ── */}
        {tab === 'reports' && (
          <div>
            {reports.length === 0 ? (
              <div className="text-center py-16 text-gray-500"><Flag className="w-12 h-12 mx-auto mb-3 text-gray-700" /><p>No reports</p></div>
            ) : (
              <div className="space-y-4">
                {reports.map(r => (
                  <div key={r.id} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                    <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400' : r.status === 'RESOLVED' ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>{r.status}</span>
                        </div>
                        <p className="text-sm"><span className="text-gray-400">Reporter:</span> <span className="text-white">{r.reporter?.name}</span> ({r.reporter?.email})</p>
                        <p className="text-sm"><span className="text-gray-400">Target:</span> <span className="text-white">{r.target?.name}</span> ({r.target?.email})</p>
                        <p className="text-sm mt-2"><span className="text-gray-400">Reason:</span> {r.reason}</p>
                        {r.details && <p className="text-xs text-gray-500 mt-1">{r.details}</p>}
                        <p className="text-xs text-gray-600 mt-1">{format(new Date(r.createdAt), 'dd MMM yyyy')}</p>
                      </div>
                      {r.status === 'PENDING' && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button onClick={() => handleReport(r.id, 'RESOLVED')} className="px-3 py-1.5 bg-green-900/30 text-green-400 hover:bg-green-900/50 rounded-xl text-xs transition-colors">Resolve</button>
                          <button onClick={() => updateUser(r.target?.id, { isActive: false })} className="px-3 py-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-xl text-xs transition-colors">Block User</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SUBSCRIPTIONS ── */}
        {tab === 'subscriptions' && (
          <div>
            {/* Desktop table */}
            <div className="hidden md:block bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700/50">
                    <tr>{['User','Plan','Amount','Status','Start','End'].map(h => <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {subscriptions.map?.(s => (
                      <tr key={s.id} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3 text-white">{s.user?.name || s.userId}</td>
                        <td className="px-4 py-3"><span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full">{s.plan}</span></td>
                        <td className="px-4 py-3 text-green-400">₹{Number(s.amount).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>{s.status}</span></td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(s.startDate), 'dd MMM yy')}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(s.endDate), 'dd MMM yy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(!subscriptions?.length) && <div className="text-center py-10 text-gray-500">No subscriptions yet</div>}
            </div>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {(!subscriptions?.length) && <div className="text-center py-10 text-gray-500">No subscriptions yet</div>}
              {subscriptions.map?.(s => (
                <div key={s.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-white">{s.user?.name || 'Unknown'}</p>
                    <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full">{s.plan}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="text-green-400 font-medium">₹{Number(s.amount).toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>{s.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{format(new Date(s.startDate), 'dd MMM yy')} → {format(new Date(s.endDate), 'dd MMM yy')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PLAN CONFIG ── */}
        {tab === 'plans' && (
          <div className="space-y-6">
            <p className="text-gray-400 text-sm">Configure subscription plans, pricing, and permissions. Changes take effect immediately.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {['FREE','SILVER','GOLD','PLATINUM'].map(planKey => {
                const existing = plans.find(p => p.plan === planKey);
                const perms = existing ? JSON.parse(existing.permissions || '{}') : PLAN_PERMISSIONS[planKey];
                return (
                  <div key={planKey} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">{existing?.displayName || planKey}</h3>
                      <button onClick={() => setEditPlan({ plan: planKey, displayName: existing?.displayName || planKey, price: existing?.price || 0, currency: existing?.currency || 'INR', durationDays: existing?.durationDays || 30, description: existing?.description || '', isActive: existing?.isActive ?? true, permissions: perms })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-900/30 text-pink-400 hover:bg-pink-900/50 rounded-xl text-xs transition-colors">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">Price</span><span className="text-white font-semibold">₹{Number(existing?.price || 0).toLocaleString()} / {
                        existing?.durationDays === 365 ? '12 months' :
                        existing?.durationDays === 180 ? '6 months' :
                        existing?.durationDays === 90 ? '3 months' :
                        `${existing?.durationDays || 30} days`
                      }</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Status</span><span className={existing?.isActive !== false ? 'text-green-400' : 'text-red-400'}>{existing?.isActive !== false ? 'Active' : 'Inactive'}</span></div>
                      <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
                        {Object.entries(perms).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-xs">
                            <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                            <span className={typeof v === 'boolean' ? (v ? 'text-green-400' : 'text-red-400') : 'text-yellow-400'}>
                              {typeof v === 'boolean' ? (v ? '✓' : '✗') : v === -1 ? 'Unlimited' : v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Edit Plan Modal */}
            {editPlan && (
              <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditPlan(null)}>
                <div className="bg-gray-800 rounded-3xl p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold text-xl mb-5">Edit {editPlan.plan} Plan</h3>
                  <div className="space-y-4">
                    <div><label className="text-xs text-gray-400 mb-1 block">Display Name</label><input value={editPlan.displayName} onChange={e => setEditPlan(p => ({ ...p, displayName: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs text-gray-400 mb-1 block">Price (₹)</label><input type="number" value={editPlan.price} onChange={e => setEditPlan(p => ({ ...p, price: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" /></div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Duration</label>
                        <select value={editPlan.durationDays} onChange={e => setEditPlan(p => ({ ...p, durationDays: parseInt(e.target.value) }))} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500">
                          <option value={90}>3 Months (90 days)</option>
                          <option value={180}>6 Months (180 days)</option>
                          <option value={365}>12 Months (365 days)</option>
                        </select>
                      </div>
                    </div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Description</label><textarea value={editPlan.description} onChange={e => setEditPlan(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 resize-none" /></div>
                    <div className="border-t border-gray-700 pt-4">
                      <p className="text-sm font-semibold mb-3 text-gray-300">Permissions</p>
                      <div className="space-y-3">
                        {[
                          { key: 'canChat', label: 'Can Chat' },
                          { key: 'canSeeContact', label: 'See Contact Details' },
                          { key: 'canBoostProfile', label: 'Profile Boost' },
                          { key: 'canSeeWhoViewed', label: 'See Who Viewed' },
                          { key: 'unlimitedInterests', label: 'Unlimited Interests' },
                          { key: 'aiMatchScore', label: 'AI Match Score' },
                        ].map(p => (
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
                      <button onClick={savePlan} className="flex-1 gradient-bg text-white py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">Save Plan</button>
                      <button onClick={() => setEditPlan(null)} className="flex-1 border border-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-700 transition-colors">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* ── COUPON CODES ── */}
        {tab === 'coupons' && (
          <div className="space-y-6">
            <p className="text-gray-400 text-sm">Generate coupon codes with percentage discounts. Share codes with users manually.</p>

            {/* Create Coupon */}
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h3 className="font-bold text-lg mb-4">Create New Coupon</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Coupon Code</label>
                  <div className="flex gap-2">
                    <input value={newCoupon.code} onChange={e => setNewCoupon(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                      placeholder="e.g. SAVE20" maxLength={20}
                      className="flex-1 px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 tracking-widest font-mono" />
                    <button onClick={generateCode} title="Auto-generate"
                      className="px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-xs text-gray-300 hover:bg-gray-600 transition-colors whitespace-nowrap">
                      Generate
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Discount %</label>
                  <input type="number" min={1} max={100} value={newCoupon.discountPct}
                    onChange={e => setNewCoupon(p => ({ ...p, discountPct: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Max Uses (users)</label>
                  <input type="number" min={1} value={newCoupon.maxUses}
                    onChange={e => setNewCoupon(p => ({ ...p, maxUses: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Expiry Date (optional)</label>
                  <input type="date" value={newCoupon.expiresAt}
                    onChange={e => setNewCoupon(p => ({ ...p, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" />
                </div>
              </div>
              <button onClick={createCoupon}
                className="mt-4 px-6 py-2.5 vd-gradient-gold text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                Create Coupon
              </button>
            </div>

            {/* Coupons List */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              {coupons.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No coupons yet. Create one above.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-700/50">
                      <tr>{['Code', 'Discount', 'Used / Max', 'Expires', 'Status', 'Actions'].map(h =>
                        <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>
                      )}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {coupons.map(c => (
                        <tr key={c.id} className="hover:bg-gray-700/30 transition-colors">
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
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {c.expiresAt ? format(new Date(c.expiresAt), 'dd MMM yyyy') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive && c.usedCount < c.maxUses ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                              {!c.isActive ? 'Disabled' : c.usedCount >= c.maxUses ? 'Exhausted' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <button onClick={() => toggleCoupon(c.id, c.isActive)}
                                className={`p-1.5 rounded-lg text-xs transition-colors ${c.isActive ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'}`}
                                title={c.isActive ? 'Disable' : 'Enable'}>
                                {c.isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => deleteCoupon(c.id)}
                                className="p-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        )}

        {/* ── SUCCESS STORIES ── */}
        {tab === 'stories' && (
          <div className="space-y-6">
            <p className="text-gray-400 text-sm">Manage success stories shown on the homepage carousel.</p>

            {/* Add Story Form */}
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h3 className="font-bold text-lg mb-4">Add New Story</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-400 mb-1 block">Couple Name</label>
                  <input value={newStory.coupleName} onChange={e => setNewStory(p => ({ ...p, coupleName: e.target.value }))} placeholder="e.g. Priya & Arjun"
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Location</label>
                  <input value={newStory.location} onChange={e => setNewStory(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Mumbai, India"
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" /></div>
                <div className="sm:col-span-2"><label className="text-xs text-gray-400 mb-1 block">Story</label>
                  <textarea value={newStory.story} onChange={e => setNewStory(p => ({ ...p, story: e.target.value }))} rows={3} placeholder="Their love story…"
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 resize-none" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Image URL (optional)</label>
                  <input value={newStory.imageUrl} onChange={e => setNewStory(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://…"
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Sort Order</label>
                  <input type="number" value={newStory.sortOrder} onChange={e => setNewStory(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" /></div>
              </div>
              <button onClick={() => saveStory(newStory)} className="mt-4 px-6 py-2.5 vd-gradient-gold text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                Add Story
              </button>
            </div>

            {/* Stories List */}
            <div className="space-y-3">
              {stories.length === 0 && <div className="text-center py-10 text-gray-500">No stories yet.</div>}
              {stories.map(s => (
                <div key={s.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                  {editStory?.id === s.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input value={editStory.coupleName} onChange={e => setEditStory(p => ({ ...p, coupleName: e.target.value }))} placeholder="Couple Name"
                          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" />
                        <input value={editStory.location} onChange={e => setEditStory(p => ({ ...p, location: e.target.value }))} placeholder="Location"
                          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" />
                        <textarea value={editStory.story} onChange={e => setEditStory(p => ({ ...p, story: e.target.value }))} rows={2} placeholder="Story"
                          className="sm:col-span-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 resize-none" />
                        <input value={editStory.imageUrl || ''} onChange={e => setEditStory(p => ({ ...p, imageUrl: e.target.value }))} placeholder="Image URL"
                          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" />
                        <input type="number" value={editStory.sortOrder} onChange={e => setEditStory(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} placeholder="Sort Order"
                          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveStory(editStory)} className="px-4 py-2 vd-gradient-gold text-white rounded-xl text-sm font-semibold hover:opacity-90">Save</button>
                        <button onClick={() => setEditStory(null)} className="px-4 py-2 border border-gray-600 rounded-xl text-sm hover:bg-gray-700">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full vd-gradient-gold flex items-center justify-center text-white font-bold flex-shrink-0">
                          {s.coupleName?.[0] || '♥'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white">{s.coupleName}</p>
                          <p className="text-xs text-gray-400">{s.location}</p>
                          <p className="text-sm text-gray-300 mt-1 line-clamp-2">"{s.story}"</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => setEditStory({ ...s })} className="p-1.5 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteStory(s.id)} className="p-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HOMEPAGE CONTENT ── */}
        {tab === 'homepage' && (
          <div className="space-y-6">
            <p className="text-gray-400 text-sm">Manage homepage hero slides, stats, and features. Changes appear immediately on the homepage.</p>

            {/* Sub-tabs */}
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'slides', label: 'Hero Slides', count: hpSlides.length },
                { id: 'stats', label: 'Stats', count: hpStats.length },
                { id: 'features', label: 'Features', count: hpFeatures.length },
              ].map(t => (
                <button key={t.id} onClick={() => setHpTab(t.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${hpTab === t.id ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>
                  {t.label} <span className="ml-1.5 opacity-60">({t.count})</span>
                </button>
              ))}
            </div>

            {/* ── SLIDES ── */}
            {hpTab === 'slides' && (
              <div className="space-y-6">
                {/* Add form */}
                <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                  <h3 className="font-bold text-lg mb-4">Add New Slide</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-xs text-gray-400 mb-1 block">Tag (badge)</label>
                      <input value={newSlide.tag} onChange={e => setNewSlide(p => ({ ...p, tag: e.target.value }))} placeholder="e.g. 💑 5M+ Happy Couples"
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Sort Order</label>
                      <input type="number" value={newSlide.sortOrder} onChange={e => setNewSlide(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Headline (first part)</label>
                      <input value={newSlide.headline} onChange={e => setNewSlide(p => ({ ...p, headline: e.target.value }))} placeholder="e.g. Find Your"
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Highlight (gradient text)</label>
                      <input value={newSlide.highlight} onChange={e => setNewSlide(p => ({ ...p, highlight: e.target.value }))} placeholder="e.g. Perfect Match"
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" /></div>
                    <div className="sm:col-span-2"><label className="text-xs text-gray-400 mb-1 block">Subtitle</label>
                      <textarea value={newSlide.sub} onChange={e => setNewSlide(p => ({ ...p, sub: e.target.value }))} rows={2} placeholder="Description..."
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white resize-none" /></div>
                  </div>
                  <button disabled={hpSaving} onClick={() => saveHpItem('/api/admin/homepage/slides', newSlide, () => setNewSlide(BLANK_SLIDE))}
                    className="mt-4 px-6 py-2.5 vd-gradient-gold text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
                    {hpSaving ? 'Saving…' : 'Add Slide'}
                  </button>
                </div>

                {/* List */}
                <div className="space-y-3">
                  {hpSlides.length === 0 && <div className="text-center py-10 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700">No slides yet.</div>}
                  {hpSlides.map(s => (
                    <div key={s.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                      {hpEditSlide?.id === s.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input value={hpEditSlide.tag} onChange={e => setHpEditSlide(p => ({ ...p, tag: e.target.value }))} placeholder="Tag"
                              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" />
                            <input type="number" value={hpEditSlide.sortOrder} onChange={e => setHpEditSlide(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} placeholder="Sort"
                              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" />
                            <input value={hpEditSlide.headline} onChange={e => setHpEditSlide(p => ({ ...p, headline: e.target.value }))} placeholder="Headline"
                              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" />
                            <input value={hpEditSlide.highlight} onChange={e => setHpEditSlide(p => ({ ...p, highlight: e.target.value }))} placeholder="Highlight"
                              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" />
                            <textarea value={hpEditSlide.sub} onChange={e => setHpEditSlide(p => ({ ...p, sub: e.target.value }))} rows={2} placeholder="Subtitle"
                              className="sm:col-span-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white resize-none" />
                          </div>
                          <div className="flex gap-2">
                            <button disabled={hpSaving} onClick={() => saveHpItem('/api/admin/homepage/slides', hpEditSlide, () => setHpEditSlide(null))}
                              className="px-4 py-2 vd-gradient-gold text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                              {hpSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => setHpEditSlide(null)} className="px-4 py-2 border border-gray-600 rounded-xl text-sm hover:bg-gray-700">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-vd-accent-soft text-vd-primary px-2 py-0.5 rounded-full">{s.tag}</span>
                              <span className="text-xs text-gray-500">#{s.sortOrder}</span>
                            </div>
                            <p className="font-semibold text-white">{s.headline} <span className="vd-gradient-text">{s.highlight}</span></p>
                            <p className="text-sm text-gray-400 mt-1">{s.sub}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={() => setHpEditSlide({ ...s })} className="p-1.5 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteHpItem('/api/admin/homepage/slides', s.id)} className="p-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STATS ── */}
            {hpTab === 'stats' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                  <h3 className="font-bold text-lg mb-4">Add New Stat</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div><label className="text-xs text-gray-400 mb-1 block">Icon</label>
                      <select value={newStat.icon} onChange={e => setNewStat(p => ({ ...p, icon: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white">
                        {['Users', 'Heart', 'Globe', 'Award', 'Star', 'TrendingUp'].map(i => <option key={i} value={i}>{i}</option>)}
                      </select></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Value</label>
                      <input type="number" value={newStat.value} onChange={e => setNewStat(p => ({ ...p, value: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Suffix</label>
                      <input value={newStat.suffix} onChange={e => setNewStat(p => ({ ...p, suffix: e.target.value }))} placeholder="e.g. M+, %"
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Label</label>
                      <input value={newStat.label} onChange={e => setNewStat(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Members"
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Sort Order</label>
                      <input type="number" value={newStat.sortOrder} onChange={e => setNewStat(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" /></div>
                  </div>
                  <button disabled={hpSaving} onClick={() => saveHpItem('/api/admin/homepage/stats', newStat, () => setNewStat(BLANK_STAT))}
                    className="mt-4 px-6 py-2.5 vd-gradient-gold text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
                    {hpSaving ? 'Saving…' : 'Add Stat'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hpStats.length === 0 && <div className="col-span-2 text-center py-10 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700">No stats yet.</div>}
                  {hpStats.map(s => (
                    <div key={s.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                      {hpEditStat?.id === s.id ? (
                        <div className="space-y-2">
                          <select value={hpEditStat.icon} onChange={e => setHpEditStat(p => ({ ...p, icon: e.target.value }))}
                            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs focus:outline-none focus:border-pink-500 text-white">
                            {['Users', 'Heart', 'Globe', 'Award', 'Star', 'TrendingUp'].map(i => <option key={i} value={i}>{i}</option>)}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <input type="number" value={hpEditStat.value} onChange={e => setHpEditStat(p => ({ ...p, value: parseInt(e.target.value) || 0 }))} placeholder="Value"
                              className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs focus:outline-none focus:border-pink-500 text-white" />
                            <input value={hpEditStat.suffix} onChange={e => setHpEditStat(p => ({ ...p, suffix: e.target.value }))} placeholder="Suffix"
                              className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs focus:outline-none focus:border-pink-500 text-white" />
                          </div>
                          <input value={hpEditStat.label} onChange={e => setHpEditStat(p => ({ ...p, label: e.target.value }))} placeholder="Label"
                            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs focus:outline-none focus:border-pink-500 text-white" />
                          <input type="number" value={hpEditStat.sortOrder} onChange={e => setHpEditStat(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} placeholder="Sort"
                            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs focus:outline-none focus:border-pink-500 text-white" />
                          <div className="flex gap-2">
                            <button disabled={hpSaving} onClick={() => saveHpItem('/api/admin/homepage/stats', hpEditStat, () => setHpEditStat(null))}
                              className="flex-1 px-3 py-1.5 vd-gradient-gold text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-60">{hpSaving ? '...' : 'Save'}</button>
                            <button onClick={() => setHpEditStat(null)} className="flex-1 px-3 py-1.5 border border-gray-600 rounded-lg text-xs hover:bg-gray-700">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">#{s.sortOrder} · {s.icon}</span>
                            <div className="flex gap-1">
                              <button onClick={() => setHpEditStat({ ...s })} className="p-1 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded transition-colors"><Edit2 className="w-3 h-3" /></button>
                              <button onClick={() => deleteHpItem('/api/admin/homepage/stats', s.id)} className="p-1 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                          <p className="text-2xl font-bold vd-gradient-text">{s.value}{s.suffix}</p>
                          <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── FEATURES ── */}
            {hpTab === 'features' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                  <h3 className="font-bold text-lg mb-4">Add New Feature</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-xs text-gray-400 mb-1 block">Icon</label>
                      <select value={newFeature.icon} onChange={e => setNewFeature(p => ({ ...p, icon: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white">
                        {['Search', 'Shield', 'Globe', 'Heart', 'Star', 'Award'].map(i => <option key={i} value={i}>{i}</option>)}
                      </select></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Sort Order</label>
                      <input type="number" value={newFeature.sortOrder} onChange={e => setNewFeature(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" /></div>
                    <div className="sm:col-span-2"><label className="text-xs text-gray-400 mb-1 block">Title</label>
                      <input value={newFeature.title} onChange={e => setNewFeature(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Smart Matching"
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" /></div>
                    <div className="sm:col-span-2"><label className="text-xs text-gray-400 mb-1 block">Description</label>
                      <textarea value={newFeature.desc} onChange={e => setNewFeature(p => ({ ...p, desc: e.target.value }))} rows={2} placeholder="Feature description..."
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white resize-none" /></div>
                  </div>
                  <button disabled={hpSaving} onClick={() => saveHpItem('/api/admin/homepage/features', newFeature, () => setNewFeature(BLANK_FEATURE))}
                    className="mt-4 px-6 py-2.5 vd-gradient-gold text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
                    {hpSaving ? 'Saving…' : 'Add Feature'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hpFeatures.length === 0 && <div className="col-span-2 text-center py-10 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700">No features yet.</div>}
                  {hpFeatures.map(f => (
                    <div key={f.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                      {hpEditFeature?.id === f.id ? (
                        <div className="space-y-2">
                          <select value={hpEditFeature.icon} onChange={e => setHpEditFeature(p => ({ ...p, icon: e.target.value }))}
                            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs focus:outline-none focus:border-pink-500 text-white">
                            {['Search', 'Shield', 'Globe', 'Heart', 'Star', 'Award'].map(i => <option key={i} value={i}>{i}</option>)}
                          </select>
                          <input type="number" value={hpEditFeature.sortOrder} onChange={e => setHpEditFeature(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} placeholder="Sort"
                            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs focus:outline-none focus:border-pink-500 text-white" />
                          <input value={hpEditFeature.title} onChange={e => setHpEditFeature(p => ({ ...p, title: e.target.value }))} placeholder="Title"
                            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs focus:outline-none focus:border-pink-500 text-white" />
                          <textarea value={hpEditFeature.desc} onChange={e => setHpEditFeature(p => ({ ...p, desc: e.target.value }))} rows={2} placeholder="Description"
                            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs focus:outline-none focus:border-pink-500 text-white resize-none" />
                          <div className="flex gap-2">
                            <button disabled={hpSaving} onClick={() => saveHpItem('/api/admin/homepage/features', hpEditFeature, () => setHpEditFeature(null))}
                              className="flex-1 px-3 py-1.5 vd-gradient-gold text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-60">{hpSaving ? '...' : 'Save'}</button>
                            <button onClick={() => setHpEditFeature(null)} className="flex-1 px-3 py-1.5 border border-gray-600 rounded-lg text-xs hover:bg-gray-700">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">#{f.sortOrder} · {f.icon}</span>
                            <div className="flex gap-1">
                              <button onClick={() => setHpEditFeature({ ...f })} className="p-1 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded transition-colors"><Edit2 className="w-3 h-3" /></button>
                              <button onClick={() => deleteHpItem('/api/admin/homepage/features', f.id)} className="p-1 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                          <p className="font-semibold text-white mb-1">{f.title}</p>
                          <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE OPTIONS ── */}
        {tab === 'options' && (
          <ProfileOptionsTab
            options={profileOptions}
            category={optCategory}
            setCategory={setOptCategory}
            newOpt={newOpt}
            setNewOpt={setNewOpt}
            onAdd={async () => {
              if (!newOpt.value || !newOpt.label) { toast.error('Value and label required'); return; }
              const res = await fetch('/api/profile-options', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: optCategory, ...newOpt }),
              });
              if (res.ok) {
                toast.success('Option added');
                setNewOpt({ value: '', label: '', group: '' });
                fetch('/api/profile-options').then(r => r.json()).then(setProfileOptions);
              } else { const d = await res.json(); toast.error(d.error); }
            }}
            onToggle={async (id, isActive) => {
              await fetch('/api/profile-options', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !isActive }),
              });
              fetch('/api/profile-options').then(r => r.json()).then(setProfileOptions);
            }}
            onDelete={async (id) => {
              if (!confirm('Delete this option?')) return;
              await fetch('/api/profile-options', {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
              });
              toast.success('Deleted');
              fetch('/api/profile-options').then(r => r.json()).then(setProfileOptions);
            }}
          />
        )}

        {/* ── SITE SETTINGS ── */}
        {tab === 'siteconfig' && (
          <div className="max-w-2xl space-y-6">
            <p className="text-gray-400 text-sm">Configure global site settings. Changes take effect immediately on the homepage.</p>

            {/* Maintenance Mode */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${siteConfig.maintenance_mode !== '1' ? 'bg-red-900/30' : 'bg-green-900/20'}`}>
                  {siteConfig.maintenance_mode !== '1'
                    ? <Lock className="w-5 h-5 text-red-400" />
                    : <Unlock className="w-5 h-5 text-green-400" />}
                </div>
                <div>
                  <h3 className="font-bold text-white">Maintenance Mode</h3>
                  <p className="text-xs text-gray-500">Value 1 = Site Live. Value 0 = Maintenance page shown to all visitors. Admin panel always accessible.</p>
                </div>
              </div>
              <div className={`flex items-center justify-between p-4 rounded-xl border ${siteConfig.maintenance_mode !== '1' ? 'bg-red-900/10 border-red-800/40' : 'bg-green-900/10 border-green-800/30'}`}>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Site is currently{' '}
                    <span className={siteConfig.maintenance_mode !== '1' ? 'text-red-400' : 'text-green-400'}>
                      {siteConfig.maintenance_mode !== '1' ? '🔴 Under Maintenance' : '🟢 Live'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {siteConfig.maintenance_mode !== '1' ? 'Users see the maintenance page (DB value = 0)' : 'Site is accessible to all users (DB value = 1)'}
                  </p>
                </div>
                <Toggle
                  value={siteConfig.maintenance_mode === '1'}
                  onChange={async (val) => {
                    const newVal = val ? '1' : '0';
                    setSiteConfig(p => ({ ...p, maintenance_mode: newVal }));
                    const res = await fetch('/api/admin/siteconfig', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key: 'maintenance_mode', value: newVal }),
                    });
                    if (res.ok) toast.success(val ? '🟢 Site is now Live' : '🔴 Maintenance mode ON');
                    else { toast.error('Failed'); setSiteConfig(p => ({ ...p, maintenance_mode: val ? '0' : '1' })); }
                  }}
                />
              </div>
            </div>

            {/* Free Trial Settings */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-5">
              <h3 className="font-bold text-lg text-white">Free Trial Settings</h3>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Free Trial Duration (days)</label>
                <p className="text-xs text-gray-500 mb-2">New users get this many days of free premium access after completing their profile. Set to 0 to disable free trial.</p>
                <div className="flex gap-3 items-center">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={siteConfig.freeTrialDays ?? '1'}
                    onChange={e => setSiteConfig(p => ({ ...p, freeTrialDays: e.target.value }))}
                    className="w-32 px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white"
                  />
                  <span className="text-gray-400 text-sm">days</span>
                </div>
              </div>
              <button
                disabled={savingConfig}
                onClick={async () => {
                  setSavingConfig(true);
                  try {
                    const res = await fetch('/api/admin/siteconfig', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key: 'freeTrialDays', value: siteConfig.freeTrialDays }),
                    });
                    if (res.ok) toast.success('Settings saved');
                    else toast.error('Failed to save');
                  } finally { setSavingConfig(false); }
                }}
                className="gradient-bg text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {savingConfig ? 'Saving…' : 'Save Settings'}
              </button>
            </div>

            {/* Site Identity */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
              <h3 className="font-bold text-lg text-white">Site Identity</h3>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Site Name</label>
                <input value={siteConfig.site_name || ''} onChange={e => setSiteConfig(p => ({ ...p, site_name: e.target.value }))}
                  placeholder="e.g. Vivah Dwar"
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Footer Tagline</label>
                <input value={siteConfig.footer_tagline || ''} onChange={e => setSiteConfig(p => ({ ...p, footer_tagline: e.target.value }))}
                  placeholder="e.g. Find your perfect life partner with trust, safety, and love."
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" />
              </div>
              <button disabled={savingConfig} onClick={async () => {
                setSavingConfig(true);
                try {
                  await Promise.all([
                    fetch('/api/admin/siteconfig', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'site_name', value: siteConfig.site_name || '' }) }),
                    fetch('/api/admin/siteconfig', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'footer_tagline', value: siteConfig.footer_tagline || '' }) }),
                  ]);
                  toast.success('Site identity saved');
                } finally { setSavingConfig(false); }
              }} className="vd-gradient-gold text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
                {savingConfig ? 'Saving…' : 'Save'}
              </button>
            </div>

            {/* CTA Section */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
              <h3 className="font-bold text-lg text-white">CTA Section (Bottom Banner)</h3>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Heading</label>
                <input value={siteConfig.cta_heading || ''} onChange={e => setSiteConfig(p => ({ ...p, cta_heading: e.target.value }))}
                  placeholder="e.g. Ready to Find Your Soulmate?"
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Subtext</label>
                <input value={siteConfig.cta_subtext || ''} onChange={e => setSiteConfig(p => ({ ...p, cta_subtext: e.target.value }))}
                  placeholder="e.g. Join 20 million members and start your journey today."
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white" />
              </div>
              <button disabled={savingConfig} onClick={async () => {
                setSavingConfig(true);
                try {
                  await Promise.all([
                    fetch('/api/admin/siteconfig', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'cta_heading', value: siteConfig.cta_heading || '' }) }),
                    fetch('/api/admin/siteconfig', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'cta_subtext', value: siteConfig.cta_subtext || '' }) }),
                  ]);
                  toast.success('CTA section saved');
                } finally { setSavingConfig(false); }
              }} className="vd-gradient-gold text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
                {savingConfig ? 'Saving…' : 'Save'}
              </button>
            </div>

            {/* Hero Slides */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
              <div>
                <h3 className="font-bold text-lg text-white">Hero Slides</h3>
                <p className="text-xs text-gray-500 mt-0.5">JSON array of slides shown in the hero section. Each slide: tag, headline, highlight, sub.</p>
              </div>
              <textarea
                value={siteConfig.hero_slides || ''}
                onChange={e => setSiteConfig(p => ({ ...p, hero_slides: e.target.value }))}
                rows={8}
                placeholder={`[\n  {\n    "id": 1,\n    "tag": "💑 5M+ Happy Couples",\n    "headline": "Find Your",\n    "highlight": "Perfect Match",\n    "sub": "Join 20M+ members..."\n  }\n]`}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-xs font-mono focus:outline-none focus:border-pink-500 text-white resize-none"
              />
              <button disabled={savingConfig} onClick={async () => {
                try { JSON.parse(siteConfig.hero_slides); } catch { toast.error('Invalid JSON'); return; }
                setSavingConfig(true);
                try {
                  const res = await fetch('/api/admin/siteconfig', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'hero_slides', value: siteConfig.hero_slides }) });
                  if (res.ok) toast.success('Hero slides saved'); else toast.error('Failed');
                } finally { setSavingConfig(false); }
              }} className="vd-gradient-gold text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
                {savingConfig ? 'Saving…' : 'Save Slides'}
              </button>
            </div>

            {/* Stats Section */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
              <div>
                <h3 className="font-bold text-lg text-white">Stats Section</h3>
                <p className="text-xs text-gray-500 mt-0.5">JSON array. Each stat: icon (Users/Heart/Globe/Award/Star/TrendingUp), value (number), suffix, label.</p>
              </div>
              <textarea
                value={siteConfig.stats_section || ''}
                onChange={e => setSiteConfig(p => ({ ...p, stats_section: e.target.value }))}
                rows={8}
                placeholder={`[\n  { "icon": "Users", "value": 20, "suffix": "M+", "label": "Members" },\n  { "icon": "Heart", "value": 5, "suffix": "M+", "label": "Happy Couples" }\n]`}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-xs font-mono focus:outline-none focus:border-pink-500 text-white resize-none"
              />
              <button disabled={savingConfig} onClick={async () => {
                try { JSON.parse(siteConfig.stats_section); } catch { toast.error('Invalid JSON'); return; }
                setSavingConfig(true);
                try {
                  const res = await fetch('/api/admin/siteconfig', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'stats_section', value: siteConfig.stats_section }) });
                  if (res.ok) toast.success('Stats saved'); else toast.error('Failed');
                } finally { setSavingConfig(false); }
              }} className="vd-gradient-gold text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
                {savingConfig ? 'Saving…' : 'Save Stats'}
              </button>
            </div>

            {/* Features Section */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
              <div>
                <h3 className="font-bold text-lg text-white">Features Section</h3>
                <p className="text-xs text-gray-500 mt-0.5">JSON array. Each feature: icon (Search/Shield/Globe/Heart), title, desc.</p>
              </div>
              <textarea
                value={siteConfig.features_section || ''}
                onChange={e => setSiteConfig(p => ({ ...p, features_section: e.target.value }))}
                rows={8}
                placeholder={`[\n  { "icon": "Search", "title": "Smart Matching", "desc": "AI-powered recommendations..." },\n  { "icon": "Shield", "title": "Verified Profiles", "desc": "Every profile is verified..." }\n]`}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-xs font-mono focus:outline-none focus:border-pink-500 text-white resize-none"
              />
              <button disabled={savingConfig} onClick={async () => {
                try { JSON.parse(siteConfig.features_section); } catch { toast.error('Invalid JSON'); return; }
                setSavingConfig(true);
                try {
                  const res = await fetch('/api/admin/siteconfig', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'features_section', value: siteConfig.features_section }) });
                  if (res.ok) toast.success('Features saved'); else toast.error('Failed');
                } finally { setSavingConfig(false); }
              }} className="vd-gradient-gold text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
                {savingConfig ? 'Saving…' : 'Save Features'}
              </button>
            </div>
          </div>
        )}

        {/* ── SUPPORT CHAT ── */}
        {tab === 'support' && (
          <div>
            <p className="text-gray-400 text-sm mb-4">Manage live support chats with users. Respond to queries and end sessions when resolved.</p>
            <AdminSupportChat />
          </div>
        )}
      </main>
    </div>
  );
}
