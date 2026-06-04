import { queryOne } from '@/lib/db.js';
import { validateCompletionToken } from '@/lib/profileCompletionInvite.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * Resolve user for onboarding APIs.
 * - completionToken: must be ACTIVE session; email must match session email
 * - email only: legacy flow (registered / correction)
 */
export async function resolveOnboardingUser({ email, completionToken }) {
  if (completionToken) {
    const check = await validateCompletionToken(completionToken, { requireActive: true });
    if (!check.ok) return { ok: false, error: check.error, status: check.status };

    const session = check.session;
    if (email && normalizeEmail(email) !== normalizeEmail(session.email)) {
      return { ok: false, error: 'Email does not match this completion link', status: 403 };
    }

    const user = await queryOne(
      'SELECT id, emailVerified, name, phone, phoneVerified, password, freeTrialUsed, adminVerified FROM `user` WHERE id = ?',
      [session.userId]
    );
    if (!user) return { ok: false, error: 'User not found', status: 404 };

    return { ok: true, user, completionToken, viaInvite: true };
  }

  if (!email) return { ok: false, error: 'Email required', status: 400 };

  const user = await queryOne(
    'SELECT id, emailVerified, name, phone, phoneVerified, password, freeTrialUsed, adminVerified FROM `user` WHERE email = ?',
    [email]
  );
  if (!user) return { ok: false, error: 'User not found', status: 404 };

  const isGoogleAccount = user.password == null || user.password === '';
  if (!user.emailVerified && !isGoogleAccount) {
    return { ok: false, error: 'Email not verified', status: 403 };
  }

  return { ok: true, user, viaInvite: false };
}
