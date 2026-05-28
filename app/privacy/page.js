'use client';
import LegalPage from '@/components/LegalPage';
import { Shield, Lock, Eye, UserCheck, Globe, Mail } from 'lucide-react';

const P = ({ children }) => (
  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{children}</p>
);
const UL = ({ items }) => (
  <ul className="space-y-2 ml-1">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        <span className="w-1.5 h-1.5 rounded-full bg-vd-primary flex-shrink-0 mt-2" />
        {item}
      </li>
    ))}
  </ul>
);
const Box = ({ title, children, tone = 'neutral' }) => {
  const tones = {
    neutral: 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700',
    gold: 'bg-vd-accent-soft/50 dark:bg-vd-accent/10 border-vd-border',
    blue: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
  };
  return (
    <div className={`p-4 rounded-xl border ${tones[tone]} space-y-2`}>
      {title && <p className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">{title}</p>}
      {children}
    </div>
  );
};

const sections = [
  {
    title: 'Introduction & Scope',
    content: (
      <div className="space-y-4">
        <P>
          This Privacy Policy (&quot;Policy&quot;) describes how <strong className="text-gray-800 dark:text-gray-200">Vivah Dwar</strong> (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), operated through the website and mobile application at{' '}
          <a href="https://vivahdwar.com" className="text-vd-primary hover:underline">vivahdwar.com</a>, collects, uses, stores, shares, and protects your personal information when you access or use our matrimonial platform and related services (collectively, the &quot;Services&quot;).
        </P>
        <P>
          By registering for, accessing, or using Vivah Dwar, you acknowledge that you have read, understood, and agree to the practices described in this Policy. If you do not agree, please discontinue use of the Services immediately.
        </P>
        <Box title="Policy applies to" tone="gold">
          <UL items={[
            'Visitors browsing our public pages',
            'Registered members creating matrimonial profiles',
            'Premium subscribers and payment users',
            'Users of our mobile application (Flutter) and web platform',
            'Individuals contacting us via email, support forms, or social channels',
          ]} />
        </Box>
      </div>
    ),
  },
  {
    title: 'Data Controller & Contact Information',
    content: (
      <div className="space-y-4">
        <P>For the purposes of applicable data protection laws, Vivah Dwar acts as the data controller responsible for your personal information.</P>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: Mail, label: 'Privacy Inquiries', value: 'privacy@vivahdwar.com' },
            { icon: Shield, label: 'Grievance Officer', value: 'grievance@vivahdwar.com' },
            { icon: Globe, label: 'Website', value: 'https://vivahdwar.com' },
            { icon: Lock, label: 'Security Reports', value: 'security@vivahdwar.com' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <Icon className="w-4 h-4 text-vd-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</p>
                <p className="text-sm text-vd-primary">{value}</p>
              </div>
            </div>
          ))}
        </div>
        <P>We will respond to verified privacy requests within <strong>30 calendar days</strong>, or as required under applicable law.</P>
      </div>
    ),
  },
  {
    title: 'Information We Collect',
    content: (
      <div className="space-y-4">
        <P>We collect information in three primary ways: information you provide directly, information generated through your use of the Services, and information from third-party sources where permitted.</P>
        <div className="space-y-3">
          {[
            {
              title: 'A. Account & Identity Information',
              items: ['Full legal name, gender, date of birth, and age', 'Email address and mobile phone number', 'Account credentials (password stored as irreversible hash)', 'Government-issued ID documents submitted for verification (Aadhaar, PAN, Passport, Voter ID, Driving License)', 'Profile photographs, family photos, and video KYC recordings where applicable'],
            },
            {
              title: 'B. Matrimonial Profile Information',
              items: ['Religion, caste, sub-caste, sect, gotra, and mother tongue', 'Education, profession, income range, and employment details', 'Location (country, state, city), height, weight, and physical attributes', 'Marital status, lifestyle preferences (diet, smoking, drinking)', 'Family background, horoscope details, and partner preferences', 'About Me, bio, and free-text profile descriptions'],
            },
            {
              title: 'C. Transaction & Subscription Data',
              items: ['Subscription plan, duration, and payment status', 'Transaction IDs and payment timestamps (processed via Cashfree — we do not store full card or UPI credentials)', 'Coupon codes applied and invoice/receipt metadata', 'Premium feature usage history'],
            },
            {
              title: 'D. Communications & Activity Data',
              items: ['Messages, interests sent/received, and chat history on-platform', 'Profile views, shortlists, blocks, and match interactions', 'Abuse reports submitted or received', 'Push notification tokens and email delivery logs', 'Customer support correspondence'],
            },
            {
              title: 'E. Technical & Device Information',
              items: ['IP address, browser type, operating system, and device identifiers', 'Approximate geolocation derived from IP or device (with consent where required)', 'Session logs, crash reports, and performance analytics', 'Cookies, local storage, and similar tracking technologies (see Section 14)'],
            },
          ].map(block => (
            <Box key={block.title} title={block.title}>
              <UL items={block.items} />
            </Box>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'How We Use Your Information',
    content: (
      <div className="space-y-4">
        <P>We use personal information solely for legitimate purposes connected to operating a secure matrimonial platform:</P>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { title: 'Service Delivery', desc: 'Create and manage your account, display profiles, facilitate interests, messaging, and match recommendations.' },
            { title: 'Identity Verification', desc: 'Review ID documents, admin-approve profiles, issue verified badges, and conduct video KYC to prevent fake accounts.' },
            { title: 'Safety & Fraud Prevention', desc: 'Detect duplicate photos, block disposable emails, investigate abuse reports, and auto-hide suspicious profiles.' },
            { title: 'Payments & Billing', desc: 'Process subscriptions, send payment receipts, and manage premium access.' },
            { title: 'Communications', desc: 'Send OTPs, approval notifications, match alerts, and service announcements.' },
            { title: 'Legal Compliance', desc: 'Respond to lawful requests, enforce our Terms, and protect the rights of users and Vivah Dwar.' },
            { title: 'Platform Improvement', desc: 'Analyze anonymized usage trends to improve features, performance, and user experience.' },
            { title: 'Marketing (with consent)', desc: 'Send promotional offers you have opted into. You may unsubscribe at any time.' },
          ].map(item => (
            <div key={item.title} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs mb-1">{item.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Legal Basis for Processing',
    content: (
      <div className="space-y-4">
        <P>Depending on your jurisdiction, we rely on one or more of the following legal bases:</P>
        <UL items={[
          'Contractual necessity — processing required to provide the Services you registered for',
          'Legitimate interests — fraud prevention, platform security, and service improvement, balanced against your rights',
          'Legal obligation — compliance with applicable Indian laws, court orders, and regulatory requirements',
          'Consent — for optional marketing, non-essential cookies, and certain sensitive data uses where required',
          'Vital interests — rare situations involving safety of an individual',
        ]} />
      </div>
    ),
  },
  {
    title: 'Profile Visibility & Matrimonial Data Sharing',
    content: (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
          <Eye className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Important:</strong> Matrimonial profiles are designed to be discoverable by other verified members. By creating a profile, you understand that certain information will be visible to registered users subject to your privacy settings and subscription tier.
          </div>
        </div>
        <UL items={[
          'Only admin-approved, active profiles appear in search and match results',
          'Phone numbers and photos may be hidden from non-premium members based on your settings',
          'Verified badge status indicates ID document review — not a guarantee of character or intent',
          'You control visibility of specific fields through profile privacy settings where available',
          'We never sell your personal data to third-party advertisers or data brokers',
        ]} />
      </div>
    ),
  },
  {
    title: 'Identity Verification & Anti-Fraud Measures',
    content: (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
          <UserCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <P>
            Vivah Dwar employs multi-layer verification to maintain profile authenticity. This includes email OTP verification, mandatory phone number, admin profile approval, ID document upload, duplicate photo detection, disposable email blocking, and automatic profile suspension after multiple abuse reports.
          </P>
        </div>
        <P>Verification data is accessed only by authorized administrators and is stored securely. ID documents are used exclusively for identity confirmation and are not publicly displayed on your profile.</P>
      </div>
    ),
  },
  {
    title: 'Third-Party Service Providers',
    content: (
      <div className="space-y-4">
        <P>We engage trusted third parties who process data on our behalf under strict contractual obligations:</P>
        <UL items={[
          'Cashfree — payment gateway processing (PCI-DSS compliant infrastructure)',
          'Email delivery providers — transactional and notification emails',
          'Cloud hosting and CDN providers — secure data storage and content delivery',
          'Push notification services — web and mobile alerts',
          'Analytics providers — aggregated, anonymized usage statistics where enabled',
        ]} />
        <P>These providers may only use your data to perform services for Vivah Dwar and must maintain appropriate security standards. We do not authorize them to use your data for their own marketing purposes.</P>
      </div>
    ),
  },
  {
    title: 'Data Retention',
    content: (
      <div className="space-y-4">
        <P>We retain personal information only as long as necessary for the purposes described in this Policy:</P>
        <UL items={[
          'Active account data — retained for the duration of your membership',
          'Deleted accounts — core data removed within 90 days, except where retention is required by law',
          'Payment records — retained for 7 years as required under Indian tax and accounting regulations',
          'Abuse reports and security logs — retained for up to 3 years for investigation and legal purposes',
          'ID verification documents — retained while account is active and for a reasonable period after deletion for dispute resolution',
        ]} />
      </div>
    ),
  },
  {
    title: 'Data Security',
    content: (
      <div className="space-y-4">
        <P>We implement industry-standard technical and organizational measures to protect your information:</P>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {['TLS/HTTPS Encryption', 'Bcrypt Password Hashing', 'Role-Based Admin Access', 'Secure File Storage', 'Session Token Management', 'Regular Security Reviews', 'Abuse Detection Systems', 'Automated Account Suspension', 'Audit Logging'].map(item => (
            <div key={item} className="flex items-center gap-2 p-2.5 bg-green-50 dark:bg-green-900/10 rounded-xl text-xs text-green-700 dark:text-green-400">
              <Lock className="w-3 h-3 flex-shrink-0" /> {item}
            </div>
          ))}
        </div>
        <P>No method of electronic transmission or storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your login credentials.</P>
      </div>
    ),
  },
  {
    title: 'Your Rights & Choices',
    content: (
      <div className="space-y-4">
        <P>Subject to applicable law, you may exercise the following rights regarding your personal data:</P>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { r: 'Right of Access', d: 'Request a copy of personal data we hold about you' },
            { r: 'Right to Rectification', d: 'Correct inaccurate or incomplete profile information' },
            { r: 'Right to Erasure', d: 'Request deletion of your account and associated data' },
            { r: 'Right to Restrict Processing', d: 'Limit how we use your data in certain circumstances' },
            { r: 'Right to Data Portability', d: 'Receive your data in a structured, machine-readable format' },
            { r: 'Right to Object', d: 'Object to processing based on legitimate interests or direct marketing' },
            { r: 'Right to Withdraw Consent', d: 'Withdraw consent at any time where processing is consent-based' },
            { r: 'Privacy Controls', d: 'Hide phone, photos, or profile from certain user tiers via settings' },
          ].map(({ r, d }) => (
            <div key={r} className="p-3 border border-vd-border rounded-xl">
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{r}</p>
              <p className="text-xs text-gray-500 mt-1">{d}</p>
            </div>
          ))}
        </div>
        <P>
          To exercise any right, email{' '}
          <a href="mailto:privacy@vivahdwar.com" className="text-vd-primary hover:underline">privacy@vivahdwar.com</a>{' '}
          with your registered email and a description of your request. We may verify your identity before processing.
        </P>
      </div>
    ),
  },
  {
    title: 'Children\'s Privacy',
    content: (
      <div className="space-y-4">
        <P>Vivah Dwar is strictly intended for individuals aged <strong>18 years and above</strong> who are legally eligible to marry. We do not knowingly collect personal information from minors. If we discover that a user is under 18, we will promptly delete their account and associated data. Report underage accounts to <a href="mailto:safety@vivahdwar.com" className="text-vd-primary hover:underline">safety@vivahdwar.com</a>.</P>
      </div>
    ),
  },
  {
    title: 'Cookies & Tracking Technologies',
    content: (
      <div className="space-y-4">
        <P>We use cookies and similar technologies to operate and improve the Services. For detailed information, please see our <a href="/cookies" className="text-vd-primary hover:underline">Cookie Policy</a>.</P>
        <div className="space-y-2">
          {[
            { type: 'Strictly Necessary', desc: 'Authentication sessions, security tokens, CSRF protection — cannot be disabled', color: 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400' },
            { type: 'Functional', desc: 'Dark mode preference, language, notification settings', color: 'bg-vd-accent-soft dark:bg-vd-accent/10 text-vd-primary' },
            { type: 'Analytics', desc: 'Aggregated usage statistics to improve platform performance (opt-out available)', color: 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400' },
          ].map(c => (
            <div key={c.type} className={`flex items-start gap-3 p-3 rounded-xl ${c.color}`}>
              <span className="font-bold text-xs mt-0.5 flex-shrink-0 w-28">{c.type}</span>
              <span className="text-xs leading-relaxed">{c.desc}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'International Data Transfers',
    content: (
      <div className="space-y-4">
        <P>Your data is primarily stored and processed in India. If we transfer data internationally (e.g., to cloud infrastructure providers), we ensure appropriate safeguards such as standard contractual clauses or equivalent protections as required by applicable law.</P>
      </div>
    ),
  },
  {
    title: 'Changes to This Privacy Policy',
    content: (
      <div className="space-y-4">
        <P>We may update this Policy periodically to reflect changes in our practices, technology, or legal requirements. Material changes will be communicated via email or a prominent notice on the platform at least <strong>14 days</strong> before taking effect. Continued use after the effective date constitutes acceptance of the updated Policy.</P>
        <Box tone="blue">
          <P><strong>Current version:</strong> May 28, 2026 · <strong>Effective date:</strong> May 28, 2026</P>
        </Box>
      </div>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How Vivah Dwar collects, uses, protects, and respects your personal information"
      icon={Shield}
      iconBg="vd-gradient-gold"
      lastUpdated="May 28, 2026"
      sections={sections}
      relatedLinks={[
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
        { label: 'Safety Guidelines', href: '/safety' },
        { label: 'Contact Us', href: '/contact' },
      ]}
    />
  );
}
