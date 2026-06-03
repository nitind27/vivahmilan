import { randomUUID } from 'crypto';
import { execute, query, queryOne } from '@/lib/db.js';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';
import { getSiteConfig } from '@/lib/siteconfig.js';

export const DONATION_CATEGORIES = [
  { key: 'WEDDING', label: 'Wedding ceremony & rituals' },
  { key: 'VENUE', label: 'Venue & reception' },
  { key: 'ATTIRE', label: 'Wedding attire & jewellery' },
  { key: 'DOCUMENT', label: 'Legal / documentation' },
  { key: 'TRAVEL', label: 'Travel & logistics' },
  { key: 'OTHER', label: 'Other verified expense' },
];

export async function isDonationEnabled() {
  const v = await getSiteConfig('donation_enabled');
  return v === '1' || v === 'true';
}

export async function getDonationPublicConfig() {
  const enabled = await isDonationEnabled();
  const [title, subtitle, note] = await Promise.all([
    getSiteConfig('donation_page_title'),
    getSiteConfig('donation_page_subtitle'),
    getSiteConfig('donation_transparency_note'),
  ]);
  return {
    enabled,
    title: title || 'Shaadi Sahayata — Wedding Support Fund',
    subtitle:
      subtitle ||
      'Help verified members who have no family support for their wedding. Every rupee is tracked publicly.',
    transparencyNote:
      note ||
      'We publish every expense. Donors can see total collected, total used, and item-wise utilization. Funds are never used outside declared purposes.',
  };
}

export async function getDonationStats() {
  await ensureFeatureTables();
  const received = await queryOne(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM donation_payment WHERE status = 'PAID'`
  );
  const spent = await queryOne(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM donation_expenditure`
  );
  const donors = await queryOne(
    `SELECT COUNT(DISTINCT COALESCE(userId, donorEmail)) AS cnt FROM donation_payment WHERE status = 'PAID'`
  );
  const totalReceived = Number(received?.total || 0);
  const totalSpent = Number(spent?.total || 0);
  return {
    totalReceived,
    totalSpent,
    balance: Math.max(0, totalReceived - totalSpent),
    donorCount: Number(donors?.cnt || 0),
  };
}

export async function listActiveCampaigns() {
  await ensureFeatureTables();
  const rows = await query(
    `SELECT c.*,
      (SELECT COALESCE(SUM(p.amount), 0) FROM donation_payment p
       WHERE p.campaignId = c.id AND p.status = 'PAID') AS raisedAmount
     FROM donation_campaign c
     WHERE c.isActive = 1
     ORDER BY c.sortOrder ASC, c.createdAt DESC`
  );
  return rows;
}

export async function listExpenditures({ limit = 50 } = {}) {
  await ensureFeatureTables();
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
  return query(
    `SELECT e.*, c.title AS campaignTitle
     FROM donation_expenditure e
     LEFT JOIN donation_campaign c ON c.id = e.campaignId
     ORDER BY e.expenditureDate DESC, e.createdAt DESC
     LIMIT ${lim}`
  );
}

export async function listDonationsForUser(userId, email) {
  await ensureFeatureTables();
  const emailNorm = (email || '').trim().toLowerCase();
  return query(
    `SELECT d.*, c.title AS campaignTitle
     FROM donation_payment d
     LEFT JOIN donation_campaign c ON c.id = d.campaignId
     WHERE d.status = 'PAID'
       AND (d.userId = ? OR (d.donorEmail IS NOT NULL AND LOWER(TRIM(d.donorEmail)) = ?))
     ORDER BY d.paidAt DESC, d.createdAt DESC
     LIMIT 100`,
    [userId, emailNorm]
  );
}

export async function createDonationPayment({
  userId = null,
  donorName,
  donorEmail,
  donorPhone = null,
  amount,
  campaignId = null,
  message = null,
  isAnonymous = false,
}) {
  await ensureFeatureTables();
  const id = randomUUID();
  const orderId = `DONATE_${Date.now()}_${id.slice(0, 8).toUpperCase()}`;
  await execute(
    `INSERT INTO donation_payment
      (id, orderId, userId, donorName, donorEmail, donorPhone, amount, currency, status,
       campaignId, message, isAnonymous, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'INR', 'PENDING', ?, ?, ?, NOW())`,
    [
      id,
      orderId,
      userId,
      donorName,
      donorEmail?.trim().toLowerCase() || null,
      donorPhone,
      amount,
      campaignId || null,
      message,
      isAnonymous ? 1 : 0,
    ]
  );
  return { id, orderId };
}

export async function markDonationPaid(orderId, { paymentRef = null } = {}) {
  await ensureFeatureTables();
  const row = await queryOne('SELECT * FROM donation_payment WHERE orderId = ?', [orderId]);
  if (!row) return null;
  if (row.status === 'PAID') return row;
  await execute(
    `UPDATE donation_payment SET status = 'PAID', paidAt = NOW(), paymentRef = ? WHERE orderId = ?`,
    [paymentRef || orderId, orderId]
  );
  return queryOne('SELECT * FROM donation_payment WHERE orderId = ?', [orderId]);
}

export async function markDonationFailed(orderId) {
  await ensureFeatureTables();
  await execute(
    `UPDATE donation_payment SET status = 'FAILED' WHERE orderId = ? AND status = 'PENDING'`,
    [orderId]
  );
}

export async function getDonationByOrderId(orderId) {
  await ensureFeatureTables();
  return queryOne(
    `SELECT d.*, c.title AS campaignTitle
     FROM donation_payment d
     LEFT JOIN donation_campaign c ON c.id = d.campaignId
     WHERE d.orderId = ?`,
    [orderId]
  );
}
