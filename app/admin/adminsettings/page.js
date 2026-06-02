'use client';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  UserCog, Mail, Lock, UserPlus, Shield, Eye, EyeOff, Loader2,
  CheckCircle, XCircle, RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function PasswordInput({ value, onChange, placeholder, id }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-4 pr-11 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary"
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [me, setMe] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const [editAdmin, setEditAdmin] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [savingOther, setSavingOther] = useState(false);

  const inp = 'w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary';

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMe(data.me);
      setAdmins(data.admins || []);
      setName(data.me?.name || '');
      setEmail(data.me?.email || '');
    } catch (e) {
      toast.error(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveMyAccount = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSavingAccount(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || 'Saved');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (data.requiresReLogin) {
        toast('Sign in again with your new credentials', { icon: '🔐' });
        setTimeout(() => signOut({ callbackUrl: '/login' }), 1500);
        return;
      }

      await updateSession?.();
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSavingAccount(false);
    }
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    if (newAdminPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdminName.trim(),
          email: newAdminEmail.trim(),
          password: newAdminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const saveOtherAdmin = async () => {
    if (!editAdmin) return;
    if (resetPassword && resetPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSavingOther(true);
    try {
      const res = await fetch(`/api/admin/settings/${editAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editAdmin.name,
          email: editAdmin.email,
          password: resetPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setEditAdmin(null);
      setResetPassword('');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setSavingOther(false);
    }
  };

  const toggleActive = async (admin, activate) => {
    if (!activate && !window.confirm(`Deactivate admin ${admin.email}? They will not be able to log in.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/settings/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: activate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-10 h-10 text-vd-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <p className="text-gray-400 text-sm">
        Manage your admin login and add other administrators. New admins can sign in at{' '}
        <span className="text-white font-medium">/login</span> with email and password.
      </p>

      {/* My account */}
      <section className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vd-primary/20 flex items-center justify-center">
            <UserCog className="w-5 h-5 text-vd-primary" />
          </div>
          <div>
            <h2 className="font-bold text-white">My admin account</h2>
            <p className="text-xs text-gray-500">Signed in as {session?.user?.email}</p>
          </div>
        </div>

        <form onSubmit={saveMyAccount} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Display name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inp}
              placeholder="Admin name"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Login email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inp}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Changing email requires your current password below.</p>
          </div>

          <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 space-y-4">
            <p className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              Change password
            </p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Current password</label>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Required to change email or password"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">New password</label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Confirm new password</label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingAccount}
            className="w-full py-3 vd-gradient-gold text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {savingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save my account
          </button>
        </form>
      </section>

      {/* Add admin */}
      <section className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="font-bold text-white">Add new admin</h2>
            <p className="text-xs text-gray-500">Creates a full admin login (or upgrades an existing member email)</p>
          </div>
        </div>

        <form onSubmit={createAdmin} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Name</label>
              <input
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                className={inp}
                placeholder="e.g. Priya Admin"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Email *</label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className={inp}
                required
                placeholder="admin@company.com"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Initial password *
            </label>
            <PasswordInput
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              placeholder="Min 8 characters — share securely with the new admin"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Create admin account
          </button>
        </form>
      </section>

      {/* Admin list */}
      <section className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-vd-primary" />
            <h2 className="font-bold text-white">Admin team ({admins.length})</h2>
          </div>
          <button
            type="button"
            onClick={load}
            className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-gray-700">
          {admins.map((a) => (
            <div key={a.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white truncate">{a.name || 'Admin'}</p>
                  {a.isSelf && (
                    <span className="text-[10px] font-bold uppercase bg-vd-primary/20 text-vd-primary px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                  {!a.isActive && (
                    <span className="text-[10px] font-bold uppercase bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate">{a.email}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Added {format(new Date(a.createdAt), 'dd MMM yyyy')}
                  {a.lastLoginAt && ` · Last login ${format(new Date(a.lastLoginAt), 'dd MMM yyyy')}`}
                </p>
              </div>
              {!a.isSelf && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditAdmin({ ...a })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-700 text-white hover:bg-gray-600"
                  >
                    Edit / Reset password
                  </button>
                  {a.isActive ? (
                    <button
                      type="button"
                      onClick={() => toggleActive(a, false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleActive(a, true)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-green-500/15 text-green-400 hover:bg-green-500/25"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Edit other admin modal */}
      {editAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-white">Edit admin</h3>
              <button type="button" onClick={() => { setEditAdmin(null); setResetPassword(''); }} className="text-gray-500 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name</label>
              <input
                value={editAdmin.name || ''}
                onChange={(e) => setEditAdmin((p) => ({ ...p, name: e.target.value }))}
                className={inp}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input
                type="email"
                value={editAdmin.email || ''}
                onChange={(e) => setEditAdmin((p) => ({ ...p, email: e.target.value }))}
                className={inp}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">New password (optional)</label>
              <PasswordInput
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Leave blank to keep current"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setEditAdmin(null); setResetPassword(''); }}
                className="flex-1 py-2.5 bg-gray-800 rounded-xl text-sm font-semibold text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveOtherAdmin}
                disabled={savingOther}
                className="flex-1 py-2.5 vd-gradient-gold rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {savingOther ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
