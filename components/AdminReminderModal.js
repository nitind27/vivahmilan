'use client';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Mail, Send, Smartphone, Loader2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_TEMPLATES = [
  { key: 'pending_review', label: 'Under review (general)' },
  { key: 'complete_profile', label: 'Complete missing details' },
  { key: 'upload_documents', label: 'Upload identity document' },
  { key: 'upload_photos', label: 'Add profile & family photos' },
  { key: 'document_pending', label: 'Document verification pending' },
  { key: 'update_profile', label: 'Update profile information' },
  { key: 'custom', label: 'Custom message (use extra note)' },
];

/**
 * Send profile reminder email + in-app notification + push.
 * @param {object} props
 * @param {{ id: string, name: string, email?: string }[]} props.targets
 * @param {boolean} [props.allowApproved] — allow sending to already approved members (All Members)
 */
export default function AdminReminderModal({ targets, onClose, onSent, allowApproved = false }) {
  const [templateKey, setTemplateKey] = useState('pending_review');
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [force, setForce] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(null);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);

  const userIds = targets.map((t) => t.id);

  useEffect(() => {
    fetch('/api/admin/pending-reminders')
      .then((r) => r.json())
      .then((data) => {
        if (data.templates) {
          setTemplates(
            Object.entries(data.templates).map(([key, t]) => ({
              key,
              label: t.label || key,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (targets.length === 1) {
      const q = allowApproved ? '?userId=' + targets[0].id + '&allowApproved=1' : `?userId=${targets[0].id}`;
      fetch(`/api/admin/pending-reminders${q}`)
        .then((r) => r.json())
        .then(setPreview)
        .catch(() => {});
    } else {
      setPreview(null);
    }
  }, [targets, allowApproved]);

  const send = async () => {
    if (!targets.every((t) => t.email)) {
      toast.error('Selected user has no email address');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/admin/pending-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds,
          templateKey,
          customTitle: customTitle.trim() || undefined,
          customMessage: customMessage.trim() || undefined,
          force,
          allowApproved,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to send');
        return;
      }
      if (data.sent > 0) {
        toast.success(
          `Reminder sent to ${data.sent} member${data.sent > 1 ? 's' : ''} (email + notification)`
        );
      }
      if (data.failed > 0) {
        const reasons = data.results
          .filter((r) => !r.ok)
          .map((r) => r.error)
          .slice(0, 2)
          .join('; ');
        toast.error(`${data.failed} skipped: ${reasons}`);
      }
      onSent?.(data);
      onClose();
    } catch {
      toast.error('Network error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                Send email reminder
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {targets.length === 1
                  ? `To ${targets[0].name} (${targets[0].email})`
                  : `To ${targets.length} members`}
              </p>
              <p className="text-xs text-gray-500 mt-1">Email · in-app notification · web push</p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-white">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Reminder type
            </label>
            <select
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-vd-primary outline-none"
            >
              {templates.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Custom email title (optional)
            </label>
            <input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Overrides template title in email subject…"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-vd-primary outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Extra message (optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              placeholder="e.g. Your Aadhaar document is unclear. Please re-upload a clear photo."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-vd-primary outline-none resize-none"
            />
          </div>

          <div className="rounded-xl bg-gray-800/80 border border-gray-700 p-4 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivered via</p>
            <div className="flex flex-wrap gap-3 text-sm text-gray-300">
              <span className="inline-flex items-center gap-1.5"><Mail className="w-4 h-4 text-blue-400" /> Email</span>
              <span className="inline-flex items-center gap-1.5"><Bell className="w-4 h-4 text-amber-400" /> In-app</span>
              <span className="inline-flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-green-400" /> Push</span>
            </div>
            {!allowApproved && (
              <p className="text-xs text-gray-500">
                Pending members also receive a checklist of missing profile items in the email.
              </p>
            )}
          </div>

          {preview && targets.length === 1 && (
            <div className="text-xs rounded-xl border border-gray-800 bg-gray-800/50 p-3">
              {preview.canSend ? (
                <span className="text-green-400 font-medium">Ready to send</span>
              ) : (
                <span className="text-amber-400">{preview.blockReason || 'Cannot send yet'}</span>
              )}
              {preview.history?.length > 0 && (
                <p className="mt-1 text-gray-500">
                  Last sent {formatDistanceToNow(new Date(preview.history[0].createdAt), { addSuffix: true })}
                  {preview.history[0].emailSent ? ' · email ✓' : ''}
                </p>
              )}
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              className="mt-1 rounded border-gray-600"
            />
            <span className="text-sm text-gray-400">Send even if reminded in the last 24 hours</span>
          </label>
        </div>

        <div className="p-6 border-t border-gray-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={send}
            disabled={sending}
            className="flex-1 py-2.5 vd-gradient-gold text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send email
          </button>
        </div>
      </div>
    </div>
  );
}
