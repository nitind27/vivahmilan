/**
 * Resend receipt emails for ACTIVE subscriptions where receiptSentAt IS NULL.
 * Usage: node scripts/resend-receipts.js
 */
import { config } from 'dotenv';
import { query, execute } from '../lib/db.js';
import { sendSubscriptionReceiptEmail } from '../lib/email.js';

config({ path: '.env' });
config({ path: '.env.local' });

const subs = await query(`
  SELECT s.*, u.name, u.email, pc.displayName, pc.description
  FROM subscription s
  JOIN user u ON u.id = s.userId
  LEFT JOIN planconfig pc ON pc.plan = s.plan
  WHERE s.status = 'ACTIVE' AND s.receiptSentAt IS NULL AND u.email IS NOT NULL
  ORDER BY s.createdAt DESC
`);

console.log(`Found ${subs.length} subscription(s) without receipt email`);

for (const sub of subs) {
  try {
    await sendSubscriptionReceiptEmail({
      email: sub.email,
      name: sub.name,
      plan: sub.plan,
      planDisplayName: sub.displayName || sub.plan,
      amount: Number(sub.amount),
      currency: sub.currency || 'INR',
      paymentId: sub.paymentId,
      startDate: sub.startDate,
      endDate: sub.endDate,
      description: sub.description || '',
    });
    await execute('UPDATE subscription SET receiptSentAt = NOW() WHERE id = ?', [sub.id]);
    console.log(`✓ Sent to ${sub.email} — ${sub.plan} (${sub.paymentId})`);
  } catch (err) {
    console.error(`✗ Failed ${sub.email}:`, err.message);
  }
}

console.log('Done');
