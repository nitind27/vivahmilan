import prisma from '@/lib/prisma';
import { sendSubscriptionReceiptEmail } from '@/lib/email';

/**
 * Send subscription payment receipt email once per paymentId.
 * Safe to call from webhook, verify, and instant-activation paths.
 */
export async function dispatchSubscriptionReceipt(paymentId) {
  if (!paymentId) return;

  const sub = await prisma.subscription.findFirst({
    where: { paymentId, status: 'ACTIVE' },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!sub?.user?.email) return;

  let claimed = false;
  try {
    const result = await prisma.subscription.updateMany({
      where: { id: sub.id, receiptSentAt: null },
      data: { receiptSentAt: new Date() },
    });
    claimed = result.count > 0;
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes('receiptSentAt') || msg.includes('Unknown column')) {
      claimed = true;
    } else {
      throw err;
    }
  }
  if (!claimed) return;

  const planConfig = await prisma.planConfig.findUnique({ where: { plan: sub.plan } });

  try {
    await sendSubscriptionReceiptEmail({
      email: sub.user.email,
      name: sub.user.name,
      plan: sub.plan,
      planDisplayName: planConfig?.displayName || sub.plan,
      amount: Number(sub.amount),
      currency: sub.currency || 'INR',
      paymentId: sub.paymentId,
      startDate: sub.startDate,
      endDate: sub.endDate,
      description: planConfig?.description || '',
    });
  } catch (err) {
    try {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { receiptSentAt: null },
      });
    } catch { /* column may not exist yet */ }
    console.error('[subscriptionReceipt] email failed:', err?.message || err);
  }
}
