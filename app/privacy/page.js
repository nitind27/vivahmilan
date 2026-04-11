'use client';
import LegalPage from '@/components/LegalPage';
import { Shield } from 'lucide-react';

const sections = [
  {
    title: 'Information We Collect',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>We collect information you provide directly to us when you create an account, complete your profile, or contact us. This includes:</p>
        <ul className="space-y-2 ml-4">
          {['Full name, date of birth, gender', 'Email address and phone number', 'Profile photos and ID documents', 'Religion, caste, education, profession, and location details', 'Partner preferences and family information', 'Payment information (processed securely via Cashfree — we do not store card details)', 'Messages and communications on our platform'].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
        <p>We also automatically collect certain information when you use our services, including IP address, browser type, device information, and usage data.</p>
      </div>
    ),
  },
  {
    title: 'How We Use Your Information',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>We use the information we collect to:</p>
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          {[
            { title: 'Provide Services', desc: 'Create and manage your account, show matches, enable messaging' },
            { title: 'Verify Identity', desc: 'Review ID documents to ensure authentic profiles' },
            { title: 'Improve Platform', desc: 'Analyze usage patterns to enhance features and user experience' },
            { title: 'Send Notifications', desc: 'Notify you about interests, messages, and account updates' },
            { title: 'Process Payments', desc: 'Handle subscription payments securely' },
            { title: 'Ensure Safety', desc: 'Detect and prevent fraud, abuse, and policy violations' },
          ].map((item, i) => (
            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs mb-1">{item.title}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Information Sharing',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in these circumstances:</p>
        <ul className="space-y-2 ml-4">
          {[
            'With other users — your profile information is visible to registered members as per your privacy settings',
            'With service providers — payment processors, email services, and hosting providers who assist in operating our platform',
            'For legal compliance — when required by law, court order, or government authority',
            'Business transfers — in case of merger, acquisition, or sale of assets',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    title: 'Data Security',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>We implement industry-standard security measures to protect your personal information:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          {['SSL/TLS Encryption', 'Secure Password Hashing', 'Regular Security Audits', 'Access Controls', 'Secure Data Storage', 'HTTPS Everywhere'].map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 bg-green-50 dark:bg-green-900/10 rounded-xl text-xs text-green-700 dark:text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
        <p className="mt-2">While we strive to protect your information, no method of transmission over the internet is 100% secure. We encourage you to use a strong password and keep it confidential.</p>
      </div>
    ),
  },
  {
    title: 'Your Rights & Choices',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>You have the following rights regarding your personal data:</p>
        <ul className="space-y-2 ml-4">
          {[
            'Access — Request a copy of the personal data we hold about you',
            'Correction — Update or correct inaccurate information in your profile',
            'Deletion — Request deletion of your account and associated data',
            'Portability — Request your data in a portable format',
            'Opt-out — Unsubscribe from marketing emails at any time',
            'Privacy controls — Hide your phone number or photos from non-premium users',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
        <p>To exercise any of these rights, contact us at <a href="mailto:privacy@vivahmilan.com" className="text-pink-500 hover:underline">privacy@vivahmilan.com</a></p>
      </div>
    ),
  },
  {
    title: 'Cookies & Tracking',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>We use cookies and similar tracking technologies to enhance your experience. Types of cookies we use:</p>
        <div className="space-y-2 mt-2">
          {[
            { type: 'Essential', desc: 'Required for the platform to function — login sessions, security', color: 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400' },
            { type: 'Functional', desc: 'Remember your preferences like dark/light mode', color: 'bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400' },
            { type: 'Analytics', desc: 'Help us understand how users interact with our platform', color: 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400' },
          ].map((c, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${c.color}`}>
              <span className="font-bold text-xs mt-0.5 flex-shrink-0">{c.type}</span>
              <span className="text-xs">{c.desc}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Contact & Updates',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on our platform.</p>
        <p>For privacy-related questions or concerns, contact our Data Protection Officer:</p>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-1 text-sm">
          <p><span className="font-semibold">Email:</span> <a href="mailto:privacy@vivahmilan.com" className="text-pink-500 hover:underline">privacy@vivahmilan.com</a></p>
          <p><span className="font-semibold">Address:</span> Vivah Milan, Mumbai, Maharashtra, India</p>
          <p><span className="font-semibold">Response time:</span> Within 30 days</p>
        </div>
      </div>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your personal information"
      icon={Shield}
      iconBg="bg-gradient-to-br from-blue-600 to-purple-600"
      lastUpdated="January 1, 2026"
      sections={sections}
      relatedLinks={[
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
        { label: 'Contact Us', href: '/contact' },
      ]}
    />
  );
}
