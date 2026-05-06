'use client';
import { useEffect, useState } from 'react';
import { X, CheckCircle, Star, Ban, User, Mail, Phone, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminUserProfileModal({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setTab('profile');
    fetch(`/api/admin/user-profile?userId=${userId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <User size={20} /> User Profile
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-5">
          {['profile', 'activity', 'notes'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data ? (
            <p className="text-center text-gray-400 py-12">No data found.</p>
          ) : tab === 'profile' ? (
            <ProfileTab data={data} />
          ) : tab === 'activity' ? (
            <ActivityTab data={data} />
          ) : (
            <NotesTab data={data} />
          )}
        </div>
      </div>
    </div>
  );
}


function ProfileTab({ data }) {
  const u = data.user || {};
  const p = data.profile || {};
  return (
    <div className="space-y-4">
      {/* Avatar + basic */}
      <div className="flex items-center gap-4">
        {u.photo ? (
          <img src={u.photo} alt="avatar" className="w-16 h-16 rounded-full object-cover border" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center">
            <User size={28} className="text-pink-400" />
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-800 text-lg">{u.name || '—'}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1"><Mail size={13} /> {u.email || '—'}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1"><Phone size={13} /> {u.phone || '—'}</p>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1">
          {u.isVerified && <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle size={12} /> Verified</span>}
          {u.isPremium && <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full"><Star size={12} /> Premium</span>}
          {u.isBanned && <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><Ban size={12} /> Banned</span>}
        </div>
      </div>

      {/* Profile details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          ['Age', p.age],
          ['Gender', p.gender],
          ['Religion', p.religion],
          ['Caste', p.caste],
          ['City', p.city],
          ['State', p.state],
          ['Education', p.education],
          ['Occupation', p.occupation],
          ['Marital Status', p.maritalStatus],
          ['Height', p.height],
        ].map(([label, val]) => val ? (
          <div key={label} className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="font-medium text-gray-700">{val}</p>
          </div>
        ) : null)}
      </div>

      {p.bio && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><FileText size={12} /> Bio</p>
          <p className="text-gray-700">{p.bio}</p>
        </div>
      )}

      {u.createdAt && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={12} /> Joined {format(new Date(u.createdAt), 'dd MMM yyyy')}
        </p>
      )}

      {/* Family Photos */}
      {data.familyPhotos?.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Family Photos ({data.familyPhotos.length})</p>
          <div className="grid grid-cols-3 gap-2">
            {data.familyPhotos.map(fp => (
              <div key={fp.id} className="relative rounded-xl overflow-hidden border border-gray-200">
                <img src={fp.url} alt={fp.caption || 'Family'} className="w-full h-24 object-cover" />
                {(fp.caption || fp.memberCount) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-1">
                    <p className="text-white text-xs truncate">
                      {fp.caption}{fp.memberCount ? ` · ${fp.memberCount}` : ''}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityTab({ data }) {
  const activity = data.activity || [];
  return (
    <div>
      {activity.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No recent activity.</p>
      ) : (
        <ul className="space-y-2">
          {activity.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm border-b pb-2">
              <Clock size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-700">{item.description || item.action}</p>
                {item.createdAt && (
                  <p className="text-xs text-gray-400">{format(new Date(item.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotesTab({ data }) {
  const notes = data.notes || [];
  return (
    <div>
      {notes.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No admin notes.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note, i) => (
            <li key={i} className="bg-yellow-50 rounded-lg p-3 text-sm">
              <p className="text-gray-700">{note.text || note.content}</p>
              {note.createdAt && (
                <p className="text-xs text-gray-400 mt-1">{format(new Date(note.createdAt), 'dd MMM yyyy')}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
