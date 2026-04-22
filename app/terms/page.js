'use client';
import LegalPage from '@/components/LegalPage';
import { FileText } from 'lucide-react';

const sections = [
  {
    title: 'Acceptance of Terms',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>By accessing or using Vivah Milan ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-xs">
          ⚠️ These terms constitute a legally binding agreement between you and Vivah Milan. Please read them carefully.
        </div>
      </div>
    ),
  },
  {
    title: 'Eligibility',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>To use Vivah Milan, you must:</p>
        <ul className="space-y-2 ml-4">
          {['Be at least 18 years of age', 'Be legally eligible to marry under applicable laws', 'Provide accurate and truthful information', 'Not be currently married (unless divorced or widowed)', 'Have a valid email address and phone number', 'Not have been previously banned from our platform'].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-vd-primary flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    title: 'Account Responsibilities',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>You are responsible for:</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { title: 'Account Security', desc: 'Maintaining the confidentiality of your password and account credentials' },
            { title: 'Accurate Information', desc: 'Providing truthful, current, and complete information in your profile' },
            { title: 'Account Activity', desc: 'All activities that occur under your account' },
            { title: 'Compliance', desc: 'Complying with all applicable laws and these Terms of Service' },
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
    title: 'Prohibited Conduct',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>The following activities are strictly prohibited on Vivah Milan:</p>
        <div className="space-y-2">
          {[
            'Creating fake, misleading, or impersonation profiles',
            'Harassing, threatening, or abusing other users',
            'Soliciting money, gifts, or financial assistance from other users',
            'Sharing explicit, offensive, or inappropriate content',
            'Using the platform for commercial solicitation or advertising',
            'Attempting to hack, scrape, or disrupt our services',
            'Sharing another user\'s personal information without consent',
            'Creating multiple accounts or using the platform after being banned',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/10 rounded-xl text-xs text-red-700 dark:text-red-400">
              <span className="font-bold flex-shrink-0">✗</span>
              {item}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Violation of these rules may result in immediate account suspension or permanent ban.</p>
      </div>
    ),
  },
  {
    title: 'Subscription & Payments',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>Vivah Milan offers both free and premium subscription plans. By purchasing a subscription:</p>
        <ul className="space-y-2 ml-4">
          {['You agree to pay the applicable fees as described at the time of purchase', 'Payments are processed securely via Cashfree payment gateway', 'Subscriptions are one-time payments and do not auto-renew', 'Prices are in Indian Rupees (INR) and include applicable taxes', 'We reserve the right to modify pricing with 30 days notice'].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-vd-primary flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    title: 'Intellectual Property',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>All content on Vivah Milan, including logos, design, text, and software, is owned by or licensed to Vivah Milan and protected by intellectual property laws.</p>
        <p>By uploading content (photos, text) to our platform, you grant Vivah Milan a non-exclusive, royalty-free license to use, display, and distribute that content solely for operating the platform.</p>
        <p>You retain ownership of your content and may delete it at any time by removing it from your profile or deleting your account.</p>
      </div>
    ),
  },
  {
    title: 'Limitation of Liability',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>Vivah Milan is a platform that connects individuals — we do not guarantee successful matches or relationships. To the maximum extent permitted by law:</p>
        <ul className="space-y-2 ml-4">
          {['We are not responsible for the conduct of users on or off the platform', 'We do not verify all information provided by users', 'We are not liable for any indirect, incidental, or consequential damages', 'Our total liability shall not exceed the amount paid by you in the last 3 months'].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-vd-primary flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    title: 'Termination',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>Either party may terminate this agreement at any time:</p>
        <ul className="space-y-2 ml-4">
          {['You may delete your account at any time from account settings or by contacting support', 'We may suspend or terminate accounts that violate these Terms', 'Upon termination, your right to use the platform ceases immediately', 'We may retain certain data as required by law or for legitimate business purposes'].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-vd-primary flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    title: 'Governing Law',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra, India.</p>
        <p>For any questions about these Terms, contact us at <a href="mailto:legal@vivahmilan.com" className="text-vd-primary hover:underline">legal@vivahmilan.com</a></p>
      </div>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      subtitle="Please read these terms carefully before using Vivah Milan"
      icon={FileText}
      iconBg="vd-gradient-gold"
      lastUpdated="January 1, 2026"
      sections={sections}
      relatedLinks={[
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Refund Policy', href: '/refund' },
        { label: 'Contact Us', href: '/contact' },
      ]}
    />
  );
}
