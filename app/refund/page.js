'use client';
import LegalPage from '@/components/LegalPage';
import { RefreshCw } from 'lucide-react';

const sections = [
  {
    title: 'Refund Policy Overview',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>At Vivah Milan, we strive to provide the best possible experience. We understand that sometimes things don't go as expected, and we have a fair refund policy to address such situations.</p>
        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          {[
            { label: '7-Day Window', desc: 'Refund requests accepted within 7 days of purchase', icon: '📅' },
            { label: 'Quick Processing', desc: 'Refunds processed within 5-7 business days', icon: '⚡' },
            { label: 'Original Method', desc: 'Refunded to your original payment method', icon: '💳' },
          ].map((item, i) => (
            <div key={i} className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-2xl text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="font-bold text-xs text-green-700 dark:text-green-400 mb-1">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Eligible Refund Scenarios',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>You may be eligible for a refund in the following cases:</p>
        <div className="space-y-2">
          {[
            { scenario: 'Technical Issues', desc: 'If you were unable to access premium features due to a technical error on our end', eligible: true },
            { scenario: 'Duplicate Payment', desc: 'If you were charged twice for the same subscription', eligible: true },
            { scenario: 'Unauthorized Transaction', desc: 'If a payment was made without your authorization (report within 48 hours)', eligible: true },
            { scenario: 'Service Unavailability', desc: 'If our platform was unavailable for more than 72 consecutive hours', eligible: true },
            { scenario: 'Change of Mind', desc: 'Refunds are not provided simply because you changed your mind after purchase', eligible: false },
            { scenario: 'Partial Usage', desc: 'No refunds for partially used subscription periods', eligible: false },
            { scenario: 'Account Suspension', desc: 'No refunds if your account was suspended due to policy violations', eligible: false },
          ].map((item, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${item.eligible ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
              <span className={`font-bold text-sm flex-shrink-0 ${item.eligible ? 'text-green-600' : 'text-red-600'}`}>{item.eligible ? '✓' : '✗'}</span>
              <div>
                <p className={`font-semibold text-xs ${item.eligible ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{item.scenario}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'How to Request a Refund',
    content: (
      <div className="space-y-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>To request a refund, follow these steps:</p>
        <div className="space-y-3">
          {[
            { step: '1', title: 'Contact Support', desc: 'Email us at refunds@vivahmilan.com within 7 days of your purchase', icon: '📧' },
            { step: '2', title: 'Provide Details', desc: 'Include your registered email, order ID, payment date, and reason for refund', icon: '📋' },
            { step: '3', title: 'Review Process', desc: 'Our team will review your request within 2-3 business days', icon: '🔍' },
            { step: '4', title: 'Refund Issued', desc: 'If approved, refund will be credited within 5-7 business days', icon: '✅' },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {s.step}
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{s.title} {s.icon}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-800 rounded-xl">
          <p className="text-xs text-pink-700 dark:text-pink-400">
            <strong>Refund Email:</strong> <a href="mailto:refunds@vivahmilan.com" className="underline">refunds@vivahmilan.com</a><br />
            <strong>Subject line:</strong> Refund Request — [Your Order ID]
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Subscription Plans & Pricing',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>Our current subscription plans:</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { plan: 'Silver', price: '₹749', duration: '30 days', color: 'border-gray-300 dark:border-gray-600' },
            { plan: 'Gold', price: '₹1,499', duration: '30 days', color: 'border-yellow-400 dark:border-yellow-600', popular: true },
            { plan: 'Platinum', price: '₹2,999', duration: '30 days', color: 'border-purple-400 dark:border-purple-600' },
          ].map((p, i) => (
            <div key={i} className={`p-4 rounded-2xl border-2 text-center relative ${p.color}`}>
              {p.popular && <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">Popular</span>}
              <p className="font-bold text-gray-800 dark:text-gray-200">{p.plan}</p>
              <p className="text-2xl font-bold gradient-text mt-1">{p.price}</p>
              <p className="text-xs text-gray-400">{p.duration}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">All prices include applicable taxes. Subscriptions are one-time payments and do not auto-renew.</p>
      </div>
    ),
  },
  {
    title: 'Payment Methods & Security',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>We accept the following payment methods via Cashfree:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {['Credit Cards', 'Debit Cards', 'UPI (GPay, PhonePe)', 'Net Banking', 'Wallets', 'EMI Options'].map((m, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-xs text-gray-600 dark:text-gray-400">
              <span className="text-green-500">✓</span> {m}
            </div>
          ))}
        </div>
        <p>All transactions are secured with 256-bit SSL encryption. We do not store your card details on our servers.</p>
      </div>
    ),
  },
  {
    title: 'Dispute Resolution',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>If you are not satisfied with our refund decision, you may:</p>
        <ul className="space-y-2 ml-4">
          {['Escalate to our senior support team at escalations@vivahmilan.com', 'File a dispute with your bank or card issuer (chargeback)', 'Contact the National Consumer Helpline (India): 1800-11-4000', 'Approach the Consumer Forum in your jurisdiction'].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
        <p>We are committed to resolving all disputes fairly and promptly.</p>
      </div>
    ),
  },
];

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      subtitle="Our commitment to fair and transparent refund practices"
      icon={RefreshCw}
      iconBg="bg-gradient-to-br from-green-600 to-teal-600"
      lastUpdated="January 1, 2026"
      sections={sections}
      relatedLinks={[
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Contact Us', href: '/contact' },
      ]}
    />
  );
}
