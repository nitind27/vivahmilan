'use client';
import { SiteLoaderInline } from '@/components/SiteLoader';
import ImageLightbox, { PhotoPreviewButton, resolveImageUrl } from '@/components/ImageLightbox';
import { useEffect, useState } from 'react';
import {
  X, CheckCircle, Star, Ban, User, Mail, Phone, Clock, FileText, MapPin, Globe, Monitor,
  Heart, MessageCircle, Eye, CreditCard, Shield, Send, Inbox, ZoomIn, Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import ApprovalChecklist from '@/components/ApprovalChecklist';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'notes', label: 'CRM Notes' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'activity', label: 'Activity' },
  { id: 'documents', label: 'Documents' },
  { id: 'geo', label: 'Login & Geo' },
];

function fmtDate(d) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '—'; }
}

function fmtDateTime(d) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy, hh:mm a'); } catch { return '—'; }
}

function DetailCell({ label, val }) {
  if (val == null || val === '') return null;
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-700 break-words">{String(val)}</p>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color = 'text-pink-600', bg = 'bg-pink-50' }) {
  return (
    <div className={`${bg} rounded-xl p-3 text-center`}>
      <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
      <p className="text-xl font-bold text-gray-800">{value ?? 0}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function AdminUserProfileModal({ userId, onClose, allowPermanentDelete, onRequestDelete }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setTab('profile');
    fetch(`/api/admin/user-profile?userId=${userId}`)
      .then(r => r.json())
      .then(d => { if (d.error) setData(null); else setData(d); })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <User size={20} /> User Details
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <div className="flex border-b px-3 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-3 px-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {loading ? (
            <SiteLoaderInline message="Loading…" className="py-12" />
          ) : !data?.user ? (
            <p className="text-center text-gray-400 py-12">No data found.</p>
          ) : tab === 'profile' ? (
            <ProfileTab data={data} />
          ) : tab === 'notes' ? (
            <NotesTab userId={userId} />
          ) : tab === 'subscription' ? (
            <SubscriptionTab data={data} />
          ) : tab === 'activity' ? (
            <ActivityTab data={data} />
          ) : tab === 'documents' ? (
            <DocumentsTab data={data} />
          ) : (
            <GeoTab data={data} />
          )}
        </div>

        {allowPermanentDelete && data?.user && !data.user.isActive && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 mb-3">
              This account is rejected/deactivated. Permanent delete removes all data from the database.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onRequestDelete?.();
              }}
              className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> Delete account permanently…
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function UserHeader({ data, onPhotoClick }) {
  const u = data.user || {};
  const p = data.profile || {};
  const photoItems = (data.photos || []).filter(ph => ph.url).map(ph => ({
    url: ph.url,
    label: ph.isMain ? 'Main photo' : 'Profile photo',
  }));
  const openAvatar = () => {
    if (!u.photo && photoItems.length === 0) return;
    const images = photoItems.length ? photoItems : [{ url: u.photo, label: 'Profile photo' }];
    onPhotoClick?.(images, 0);
  };
  return (
    <div className="flex items-start gap-4 pb-4 border-b border-gray-100 mb-4">
      {u.photo ? (
        <button
          type="button"
          onClick={openAvatar}
          className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-pink-100 shrink-0 group focus:outline-none focus:ring-2 focus:ring-pink-400"
        >
          <img src={resolveImageUrl(u.photo)} alt="" className="w-full h-full object-cover" />
          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
            <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
        </button>
      ) : (
        <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
          <User size={28} className="text-pink-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-lg">{u.name || '—'}</p>
        <p className="text-sm text-gray-500 flex items-center gap-1"><Mail size={13} /> {u.email || '—'}</p>
        <p className="text-sm text-gray-500 flex items-center gap-1"><Phone size={13} /> {u.phone || '—'}</p>
        {p.profileComplete != null && (
          <p className="text-xs text-gray-400 mt-1">Profile {p.profileComplete}% complete</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {u.adminVerified && <Badge color="green" icon={CheckCircle}>Admin Verified</Badge>}
        {u.isVerified && <Badge color="green" icon={Shield}>Verified</Badge>}
        {u.phoneVerified && <Badge color="blue" icon={Phone}>Phone Verified</Badge>}
        {u.isPremium && <Badge color="yellow" icon={Star}>Premium</Badge>}
        {!u.isActive && <Badge color="red" icon={Ban}>Blocked</Badge>}
        {!!u.verificationBadge && <Badge color="purple" icon={CheckCircle}>Badge</Badge>}
      </div>
    </div>
  );
}

function Badge({ children, color, icon: Icon }) {
  const colors = {
    green: 'text-green-600 bg-green-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50',
    purple: 'text-purple-600 bg-purple-50',
  };
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${colors[color] || colors.green}`}>
      {Icon && <Icon size={12} />} {children}
    </span>
  );
}

function ProfileTab({ data }) {
  const u = data.user || {};
  const p = data.profile || {};
  const [lightbox, setLightbox] = useState(null);
  const openGallery = (images, index = 0) => setLightbox({ images, index });
  const profilePhotos = (data.photos || []).filter(ph => ph.url).map(ph => ({
    url: ph.url,
    label: ph.isMain ? 'Main photo' : 'Photo',
  }));
  const familyPhotos = (data.familyPhotos || []).filter(fp => fp.url).map(fp => ({
    url: fp.url,
    label: [fp.caption, fp.memberCount ? `${fp.memberCount} members` : null].filter(Boolean).join(' · ') || 'Family photo',
  }));

  const personal = [
    ['Age', p.age],
    ['Gender', p.gender],
    ['Date of Birth', p.dob ? fmtDate(p.dob) : null],
    ['Height', p.height ? `${p.height} cm` : null],
    ['Weight', p.weight ? `${p.weight} kg` : null],
    ['Complexion', p.complexion],
    ['Body Type', p.bodyType],
    ['Marital Status', p.maritalStatus?.replace(/_/g, ' ')],
    ['Mother Tongue', p.motherTongue],
    ['Diet', p.diet],
    ['Smoking', p.smoking],
    ['Drinking', p.drinking],
  ];

  const background = [
    ['Religion', p.religion],
    ['Caste', p.caste],
    ['Sub Caste', p.subCaste],
    ['Sect', p.sect],
    ['Gotra', p.gotra],
    ['Education', p.education],
    ['Profession', p.profession],
    ['Income', p.income],
    ['City', p.city],
    ['State', p.state],
    ['Country', p.country],
  ];

  const family = [
    ['Family Type', p.familyType],
    ['Family Status', p.familyStatus],
    ['Father Occupation', p.fatherOccupation],
    ['Mother Occupation', p.motherOccupation],
    ['Siblings', p.siblings],
  ];

  const partner = [
    ['Partner Age', p.partnerAgeMin || p.partnerAgeMax ? `${p.partnerAgeMin || '?'} – ${p.partnerAgeMax || '?'}` : null],
    ['Partner Height', p.partnerHeightMin || p.partnerHeightMax ? `${p.partnerHeightMin || '?'} – ${p.partnerHeightMax || '?'} cm` : null],
    ['Partner Religion', p.partnerReligion],
    ['Partner Education', p.partnerEducation],
    ['Partner Location', p.partnerLocation],
    ['Horoscope', p.horoscopeSign],
    ['Nakshatra', p.nakshatra],
    ['Manglik', p.manglik],
    ['Kundli Match', p.kundliMatch],
    ['Amritdhari', p.amritdhari],
  ];

  const account = [
    ['Joined', u.createdAt ? fmtDate(u.createdAt) : null],
    ['Last Login', u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : null],
    ['Login OTP', u.loginOtpEnabled ? 'Enabled' : 'Disabled'],
    ['Hide Phone', p.hidePhone ? 'Yes' : 'No'],
    ['Hide Photo', p.hidePhoto ? 'Yes' : 'No'],
    ['Free Trial Used', u.freeTrialUsed ? 'Yes' : 'No'],
    ['Free Trial Expiry', u.freeTrialExpiry ? fmtDate(u.freeTrialExpiry) : null],
    ['Needs Password', u.needsPassword ? 'Yes' : 'No'],
  ];

  const checklist = data.approvalChecklist;

  return (
    <div className="space-y-4">
      <UserHeader data={data} onPhotoClick={openGallery} />
      {!u.adminVerified && checklist?.checklist?.length > 0 && (
        <ApprovalChecklist
          checklist={checklist.checklist}
          eligible={checklist.eligible}
          title={checklist.eligible ? 'All verification checks passed — you can approve this profile' : 'Cannot approve yet — user must complete these items first'}
        />
      )}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          title={u.name ? `${u.name} — Photos` : 'Photo preview'}
        />
      )}

      <Section title="Personal">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {personal.map(([l, v]) => <DetailCell key={l} label={l} val={v} />)}
        </div>
      </Section>

      <Section title="Background & Location">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {background.map(([l, v]) => <DetailCell key={l} label={l} val={v} />)}
        </div>
      </Section>

      {family.some(([, v]) => v) && (
        <Section title="Family">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {family.map(([l, v]) => <DetailCell key={l} label={l} val={v} />)}
          </div>
        </Section>
      )}

      {partner.some(([, v]) => v) && (
        <Section title="Partner Preferences">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {partner.map(([l, v]) => <DetailCell key={l} label={l} val={v} />)}
          </div>
        </Section>
      )}

      {(p.aboutMe || p.bio) && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><FileText size={12} /> About Me</p>
          <p className="text-gray-700 whitespace-pre-wrap">{p.aboutMe || p.bio}</p>
        </div>
      )}

      <Section title="Account">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {account.map(([l, v]) => <DetailCell key={l} label={l} val={v} />)}
        </div>
      </Section>

      {profilePhotos.length > 0 && (
        <Section title={`Photos (${profilePhotos.length})`}>
          <p className="text-xs text-gray-400 mb-2">Click any photo to preview full size</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {data.photos.filter(ph => ph.url).map((ph, i) => (
              <PhotoPreviewButton
                key={ph.id}
                url={ph.url}
                badge={ph.isMain ? 'Main' : null}
                className="aspect-square"
                onClick={() => openGallery(profilePhotos, i)}
              />
            ))}
          </div>
        </Section>
      )}

      {familyPhotos.length > 0 && (
        <Section title={`Family Photos (${familyPhotos.length})`}>
          <p className="text-xs text-gray-400 mb-2">Click to preview</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.familyPhotos.filter(fp => fp.url).map((fp, i) => (
              <div key={fp.id} className="space-y-1">
                <PhotoPreviewButton
                  url={fp.url}
                  className="aspect-[4/3] w-full"
                  onClick={() => openGallery(familyPhotos, i)}
                />
                {(fp.caption || fp.memberCount) && (
                  <p className="text-xs text-gray-500 truncate px-0.5">
                    {fp.caption}{fp.memberCount ? ` · ${fp.memberCount} members` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  );
}

function SubscriptionTab({ data }) {
  const u = data.user || {};
  const active = data.activeSubscription;
  const subs = data.subscriptions || [];
  const planCfg = data.premiumPlanConfig;

  const hasPremium = u.isPremium || active;

  return (
    <div className="space-y-4">
      <UserHeader data={data} />

      <div className={`rounded-xl p-4 border-2 ${hasPremium ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <CreditCard size={16} /> Current Plan Status
        </p>
        {hasPremium ? (
          <div className="space-y-2 text-sm">
            <p className="text-lg font-bold text-yellow-700 flex items-center gap-2">
              <Star size={18} /> {planCfg?.displayName || u.premiumPlan || active?.planDisplayName || active?.plan || 'Premium'}
            </p>
            {u.premiumPlan && <p><span className="text-gray-500">Plan code:</span> {u.premiumPlan}</p>}
            {u.premiumExpiry && (
              <p><span className="text-gray-500">Premium expires:</span> {fmtDateTime(u.premiumExpiry)}</p>
            )}
            {u.profileBoost && (
              <p><span className="text-gray-500">Profile boost:</span> Active{u.boostExpiry ? ` until ${fmtDate(u.boostExpiry)}` : ''}</p>
            )}
            {active && (
              <>
                <p><span className="text-gray-500">Subscription status:</span> <StatusPill status={active.status} /></p>
                <p><span className="text-gray-500">Valid:</span> {fmtDate(active.startDate)} → {fmtDate(active.endDate)}</p>
                {active.amount != null && (
                  <p><span className="text-gray-500">Amount paid:</span> {active.currency || 'INR'} {Number(active.amount).toLocaleString()}</p>
                )}
                {active.paymentId && <p><span className="text-gray-500">Payment ID:</span> <span className="font-mono text-xs">{active.paymentId}</span></p>}
              </>
            )}
          </div>
        ) : (
          <p className="text-gray-600">No active subscription — user is on <strong>Free</strong> plan.</p>
        )}
        {u.freeTrialUsed && !hasPremium && u.freeTrialExpiry && (
          <p className="text-xs text-gray-500 mt-2">Free trial used · expired {fmtDate(u.freeTrialExpiry)}</p>
        )}
      </div>

      <Section title={`Payment History (${subs.length})`}>
        {subs.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No subscription purchases yet.</p>
        ) : (
          <ul className="space-y-2">
            {subs.map(s => (
              <li key={s.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3 text-sm">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-gray-800">{s.planDisplayName || s.plan}</span>
                  <StatusPill status={s.status} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                  <p><span className="text-gray-400">Amount:</span> {s.currency || 'INR'} {Number(s.amount).toLocaleString()}</p>
                  <p><span className="text-gray-400">Period:</span> {fmtDate(s.startDate)} – {fmtDate(s.endDate)}</p>
                  {s.paymentId && <p className="col-span-2"><span className="text-gray-400">Payment ID:</span> {s.paymentId}</p>}
                  <p><span className="text-gray-400">Purchased:</span> {fmtDate(s.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function StatusPill({ status }) {
  const colors = {
    ACTIVE: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function ActivityTab({ data }) {
  const s = data.stats || {};
  const interests = data.interests || [];

  return (
    <div className="space-y-4">
      <UserHeader data={data} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox icon={Send} label="Interests Sent" value={s.interestsSent} color="text-pink-600" bg="bg-pink-50" />
        <StatBox icon={Inbox} label="Interests Received" value={s.interestsReceived} color="text-blue-600" bg="bg-blue-50" />
        <StatBox icon={Heart} label="Sent Accepted" value={s.interestsSentAccepted} color="text-green-600" bg="bg-green-50" />
        <StatBox icon={Heart} label="Received Accepted" value={s.interestsReceivedAccepted} color="text-green-600" bg="bg-green-50" />
        <StatBox icon={MessageCircle} label="Messages Sent" value={s.messagesSent} color="text-purple-600" bg="bg-purple-50" />
        <StatBox icon={MessageCircle} label="Messages Received" value={s.messagesReceived} color="text-indigo-600" bg="bg-indigo-50" />
        <StatBox icon={Eye} label="Profiles Viewed" value={s.profileViews} color="text-teal-600" bg="bg-teal-50" />
        <StatBox icon={Eye} label="Profile Views" value={s.profileViewedBy} color="text-cyan-600" bg="bg-cyan-50" />
        <StatBox icon={Star} label="Shortlisted" value={s.shortlisted} />
        <StatBox icon={Star} label="Shortlisted By" value={s.shortlistedBy} />
        <StatBox icon={Ban} label="Reports Made" value={s.reportsMade} color="text-orange-600" bg="bg-orange-50" />
        <StatBox icon={Ban} label="Reports Received" value={s.reportsReceived} color="text-red-600" bg="bg-red-50" />
      </div>

      {(s.interestsSentPending > 0 || s.interestsReceivedPending > 0) && (
        <p className="text-xs text-gray-500 text-center">
          Pending: {s.interestsSentPending ?? 0} sent · {s.interestsReceivedPending ?? 0} received
        </p>
      )}

      <Section title={`Recent Interests (${interests.length})`}>
        {interests.length === 0 ? (
          <p className="text-center text-gray-400 py-6 text-sm">No interests yet.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {interests.map(i => (
              <li key={i.id} className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-800">{i.otherName || 'Unknown'}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${i.direction === 'sent' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                      {i.direction === 'sent' ? '↑ Sent' : '↓ Received'}
                    </span>
                    <StatusPill status={i.status} />
                  </div>
                </div>
                {i.otherEmail && <p className="text-xs text-gray-500 mt-0.5">{i.otherEmail}</p>}
                {i.message && <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{i.message}&rdquo;</p>}
                <p className="text-xs text-gray-400 mt-1">{fmtDateTime(i.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function isImageDocUrl(url) {
  return url && /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url);
}

function DocumentsTab({ data }) {
  const docs = data.documents || [];
  const u = data.user || {};
  const [lightbox, setLightbox] = useState(null);
  const imageDocs = docs.filter(d => d.url && isImageDocUrl(d.url)).map(d => ({
    url: d.url,
    label: d.type,
  }));

  return (
    <div className="space-y-4">
      <UserHeader data={data} />
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          title={u.name ? `${u.name} — Documents` : 'Document preview'}
        />
      )}
      {docs.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">No documents uploaded.</p>
      ) : (
        <ul className="space-y-3">
          {docs.map(d => {
            const imgIdx = imageDocs.findIndex(x => x.url === d.url);
            return (
              <li key={d.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="font-semibold text-gray-800">{d.type}</p>
                  <StatusPill status={d.status} />
                </div>
                {d.adminNote && <p className="text-xs text-gray-600 mb-2">Note: {d.adminNote}</p>}
                <p className="text-xs text-gray-400">Uploaded {fmtDateTime(d.createdAt)}</p>
                {d.url && isImageDocUrl(d.url) && (
                  <PhotoPreviewButton
                    url={d.url}
                    className="mt-3 w-full max-w-xs aspect-[3/2]"
                    onClick={() => setLightbox({ images: imageDocs, index: Math.max(0, imgIdx) })}
                  />
                )}
                {d.url && (
                  <a href={d.url} target="_blank" rel="noreferrer" className="inline-block mt-2 text-xs text-pink-600 hover:underline">
                    Open in new tab →
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function GeoTab({ data }) {
  const u = data.user || {};
  const logs = data.geoLogs || [];

  return (
    <div className="space-y-4">
      <UserHeader data={data} />
      <GeoSummary user={u} />
      <Section title="Activity Log">
        {logs.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No login or registration activity logged yet.</p>
        ) : (
          <ul className="space-y-3 max-h-80 overflow-y-auto">
            {logs.map((item) => {
              const coords = item.latitude != null && item.longitude != null
                ? `${Number(item.latitude).toFixed(5)}, ${Number(item.longitude).toFixed(5)}`
                : null;
              const isLogin = item.eventType === 'LOGIN';
              return (
                <li key={item.id} className={`rounded-xl border p-3 text-sm ${isLogin ? 'border-green-100 bg-green-50/50' : 'border-blue-100 bg-blue-50/50'}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isLogin ? 'text-green-700' : 'text-blue-700'}`}>
                      {isLogin ? 'Login' : 'Registration'}
                    </span>
                    {item.createdAt && (
                      <span className="text-xs text-gray-400">{fmtDateTime(item.createdAt)}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                    <p><span className="text-gray-400">IP:</span> {item.ip || '—'}</p>
                    <p><span className="text-gray-400">Source:</span> {item.geoSource || 'IP'}</p>
                    <p className="col-span-2"><span className="text-gray-400">Location:</span> {[item.city, item.region, item.country].filter(Boolean).join(', ') || 'Unknown'}{item.geoSource === 'GPS' ? ' · GPS' : ''}</p>
                    {coords && (
                      <p className="col-span-2">
                        <span className="text-gray-400">Lat/Lon:</span>{' '}
                        <a href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{coords}</a>
                      </p>
                    )}
                    {(item.device || item.browser || item.os) && (
                      <p className="col-span-2"><span className="text-gray-400">Device:</span> {[item.device, item.browser, item.os].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

function GeoSummary({ user: u }) {
  const regCoords = u.registrationLat != null && u.registrationLon != null
    ? `${Number(u.registrationLat).toFixed(5)}, ${Number(u.registrationLon).toFixed(5)}`
    : null;
  const loginCoords = u.lastLoginLat != null && u.lastLoginLon != null
    ? `${Number(u.lastLoginLat).toFixed(5)}, ${Number(u.lastLoginLon).toFixed(5)}`
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
        <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1">
          <Globe size={12} /> Registration Location
        </p>
        <p className="text-gray-700 font-medium">{u.registrationIp || '—'}</p>
        <p className="text-xs text-gray-500 mt-1">
          {[u.registrationCity, u.registrationCountry].filter(Boolean).join(', ') || 'Unknown'}
        </p>
        {regCoords && (
          <a href={`https://www.google.com/maps?q=${u.registrationLat},${u.registrationLon}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1">
            <MapPin size={11} /> {regCoords}
          </a>
        )}
      </div>
      <div className="bg-green-50 rounded-lg p-3 border border-green-100">
        <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1">
          <Monitor size={12} /> Last Login Location
        </p>
        <p className="text-gray-700 font-medium">{u.lastLoginIp || '—'}</p>
        <p className="text-xs text-gray-500 mt-1">
          {[u.lastLoginCity, u.lastLoginCountry].filter(Boolean).join(', ') || 'Not logged in yet'}
        </p>
        {loginCoords && (
          <a href={`https://www.google.com/maps?q=${u.lastLoginLat},${u.lastLoginLon}`} target="_blank" rel="noreferrer" className="text-xs text-green-700 hover:underline mt-1 inline-flex items-center gap-1">
            <MapPin size={11} /> {loginCoords}
          </a>
        )}
        {u.lastLoginAt && (
          <p className="text-xs text-gray-400 mt-1">{fmtDateTime(u.lastLoginAt)}</p>
        )}
      </div>
    </div>
  );
}

function NotesTab({ userId }) {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/notes?userId=${userId}`)
      .then(r => r.json())
      .then(d => setNotes(d.notes || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [userId]);

  const add = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, note: text }),
      });
      setText('');
      load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SiteLoaderInline message="Loading notes…" className="py-8" />;

  return (
    <div className="space-y-4">
      <div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add internal CRM note (only visible to admins)…"
          className="w-full border border-gray-200 rounded-xl p-3 text-sm min-h-[80px] focus:outline-none focus:border-pink-400"
        />
        <button type="button" onClick={add} disabled={saving || !text.trim()} className="mt-2 px-4 py-2 bg-pink-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
          {saving ? 'Saving…' : 'Add Note'}
        </button>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{n.note}</p>
              <p className="text-xs text-gray-400 mt-2">{n.adminName || 'Admin'} · {fmtDateTime(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
