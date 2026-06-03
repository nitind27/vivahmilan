import { randomUUID } from 'crypto';
import { query, queryOne, execute } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';
import {
  fetchUserVerificationData,
  buildApprovalChecklist,
} from '@/lib/profileVerification.js';

export const REMINDER_TEMPLATES = {
  pending_review: {
    label: 'Under review (general)',
    title: 'Your profile is under review',
    message:
      'Thank you for joining Vivah Dwar. Our team is reviewing your profile. Please ensure all required details, photos, and identity documents are uploaded so we can approve you faster.',
  },
  complete_profile: {
    label: 'Complete missing details',
    title: 'Please complete your profile',
    message:
      'Your Vivah Dwar profile still needs a few required details before we can approve it. Log in and complete all mandatory fields, photos, and documents.',
  },
  upload_documents: {
    label: 'Upload identity document',
    title: 'Identity verification needed',
    message:
      'Please upload a valid identity document (Aadhaar, PAN, Passport, etc.) from your profile settings. This helps us verify your account quickly.',
  },
  upload_photos: {
    label: 'Add profile & family photos',
    title: 'Photos required for approval',
    message:
      'Please add at least one profile photo and one family or lifestyle photo. Profiles with clear photos are approved much faster.',
  },
  document_pending: {
    label: 'Document verification pending',
    title: 'Your identity document is pending',
    message:
      'We are reviewing your uploaded ID document. If you have not uploaded one yet, please add Aadhaar, PAN, Passport, or another valid government ID from your profile.',
  },
  update_profile: {
    label: 'Update profile information',
    title: 'Please update your profile',
    message:
      'Please log in to Vivah Dwar and review your profile details, photos, and contact information so matches can reach you easily.',
  },
  custom: {
    label: 'Custom message (use extra note)',
    title: 'Message from Vivah Dwar team',
    message:
      'Our team has sent you an important update regarding your matrimonial profile on Vivah Dwar. Please read the note below and take action.',
  },
};

const COOLDOWN_HOURS = 24;
const DEFAULT_LINK = '/profile-launch';

function checklistActionItems(checklist) {
  return (checklist || [])
    .filter((c) => !c.passed)
    .map((c) => c.detail || c.label)
    .slice(0, 6);
}

/** @returns {{ eligible: boolean, reason?: string, user?: object }} */
export async function canSendPendingReminder(userId, { force = false, allowApproved = false } = {}) {
  await ensureFeatureTables();

  const user = await queryOne(
    `SELECT id, name, email, adminVerified, isActive, role FROM \`user\` WHERE id = ?`,
    [userId]
  );
  if (!user) return { eligible: false, reason: 'User not found' };
  if (user.role !== 'USER') return { eligible: false, reason: 'Not a member account' };
  if (!user.isActive) return { eligible: false, reason: 'Account is inactive' };
  if (!user.email) return { eligible: false, reason: 'No email on account' };
  if (user.adminVerified && !allowApproved) {
    return { eligible: false, reason: 'Profile already approved' };
  }

  if (!force) {
    const recent = await queryOne(
      `SELECT id FROM profilereminderlog
       WHERE userId = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [userId, COOLDOWN_HOURS]
    );
    if (recent) {
      return {
        eligible: false,
        reason: `Reminder already sent in the last ${COOLDOWN_HOURS} hours`,
        cooldown: true,
      };
    }
  }

  return { eligible: true, user };
}

/**
 * Send in-app notification, email, and web push to a pending user.
 */
export async function sendProfilePendingReminder(
  userId,
  {
    adminId = null,
    templateKey = 'pending_review',
    customTitle = null,
    customMessage = null,
    force = false,
    allowApproved = false,
  } = {}
) {
  await ensureFeatureTables();

  const check = await canSendPendingReminder(userId, { force, allowApproved });
  if (!check.eligible) {
    return { ok: false, userId, error: check.reason, cooldown: !!check.cooldown };
  }

  const user = check.user;
  const tpl = REMINDER_TEMPLATES[templateKey] || REMINDER_TEMPLATES.pending_review;
  const title = (customTitle || tpl.title).trim().slice(0, 191);
  const extra = (customMessage || '').trim();
  const message = extra ? `${tpl.message}\n\n${extra}` : tpl.message;

  let actionItems = [];
  if (!user.adminVerified) {
    const data = await fetchUserVerificationData(userId);
    const { checklist } = buildApprovalChecklist(data, { mode: 'submit' });
    actionItems = checklistActionItems(checklist);
  } else if (customMessage) {
    actionItems = customMessage
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  let emailSent = false;
  let pushSent = false;
  let inAppSent = false;

  const notifId = randomUUID();
  const link = user.adminVerified ? '/profile/edit' : DEFAULT_LINK;

  try {
    await execute(
      `INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt)
       VALUES (?, ?, 'SYSTEM', ?, ?, 0, ?, NOW())`,
      [notifId, userId, title, message, link]
    );
    inAppSent = true;

    try {
      const io = global.getIO?.();
      if (io) io.to(`user:${userId}`).emit('notification:new', { userId });
    } catch {}
  } catch (err) {
    console.error('[PendingReminder] in-app failed:', err.message);
  }

  try {
    const { sendProfilePendingReminderEmail } = await import('@/lib/email.js');
    if (user.email) {
      await sendProfilePendingReminderEmail(user.email, user.name, {
        title,
        message,
        actionItems,
        link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vivahdwar.com'}${link}`,
        profileApproved: !!user.adminVerified,
      });
      emailSent = true;
    }
  } catch (err) {
    console.error('[PendingReminder] email failed:', err.message);
  }

  try {
    const { sendPushToUser } = await import('@/lib/webpush.js');
    const pushBody =
      actionItems.length > 0
        ? `${message.slice(0, 80)}… Action: ${actionItems[0]}`
        : message.slice(0, 120);
    await sendPushToUser(userId, {
      title: `📋 ${title}`,
      body: pushBody,
      url: link,
    });
    const subs = await queryOne(
      'SELECT COUNT(*) AS cnt FROM pushsubscription WHERE userId = ?',
      [userId]
    );
    pushSent = Number(subs?.cnt || 0) > 0;
  } catch (err) {
    console.error('[PendingReminder] push failed:', err.message);
  }

  const logId = randomUUID();
  await execute(
    `INSERT INTO profilereminderlog
     (id, userId, adminId, templateKey, title, message, emailSent, pushSent, inAppSent, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      logId,
      userId,
      adminId,
      templateKey,
      title,
      message,
      emailSent ? 1 : 0,
      pushSent ? 1 : 0,
      inAppSent ? 1 : 0,
    ]
  );

  return {
    ok: true,
    userId,
    logId,
    channels: { inApp: inAppSent, email: emailSent, push: pushSent },
    actionItems,
  };
}

export async function getReminderStatsForUsers(userIds) {
  if (!userIds?.length) return {};
  await ensureFeatureTables();
  const placeholders = userIds.map(() => '?').join(',');
  const rows = await query(
    `SELECT userId, MAX(createdAt) AS lastReminderAt, COUNT(*) AS reminderCount,
            SUM(emailSent) AS emailCount, SUM(pushSent) AS pushCount
     FROM profilereminderlog
     WHERE userId IN (${placeholders})
     GROUP BY userId`,
    userIds
  );
  return Object.fromEntries(
    rows.map((r) => [
      r.userId,
      {
        lastReminderAt: r.lastReminderAt,
        reminderCount: Number(r.reminderCount || 0),
        emailCount: Number(r.emailCount || 0),
        pushCount: Number(r.pushCount || 0),
      },
    ])
  );
}

export async function getReminderHistory(userId, limit = 10) {
  await ensureFeatureTables();
  return query(
    `SELECT id, templateKey, title, message, emailSent, pushSent, inAppSent, createdAt
     FROM profilereminderlog WHERE userId = ? ORDER BY createdAt DESC LIMIT ?`,
    [userId, limit]
  );
}
