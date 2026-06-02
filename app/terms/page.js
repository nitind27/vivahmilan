'use client';
import LegalPage from '@/components/LegalPage';
import { FileText, AlertTriangle, Scale, CreditCard, ShieldCheck, Ban } from 'lucide-react';

const P = ({ children }) => (
  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{children}</p>
);
const UL = ({ items }) => (
  <ul className="space-y-2">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        <span className="w-1.5 h-1.5 rounded-full bg-vd-primary flex-shrink-0 mt-2" />
        {item}
      </li>
    ))}
  </ul>
);

const sections = [
  {
    title: 'Agreement to Terms',
    content: (
      <div className="space-y-4">
        <P>
          These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;Member&quot;) and <strong className="text-gray-800 dark:text-gray-200">Vivah Dwar</strong> (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your access to and use of the Vivah Dwar matrimonial platform, including our website at{' '}
          <a href="https://vivahdwar.com" className="text-vd-primary hover:underline">vivahdwar.com</a>, mobile application, and all associated services (collectively, the &quot;Platform&quot;).
        </P>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            By creating an account, clicking &quot;I Agree,&quot; or otherwise using the Platform, you confirm that you have read, understood, and agree to be bound by these Terms and our{' '}
            <a href="/privacy" className="underline font-medium">Privacy Policy</a>. If you do not agree, you must not use the Platform.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'About Vivah Dwar',
    content: (
      <div className="space-y-4">
        <P>
          Vivah Dwar (&quot;Your Marriage Gateway&quot;) is an online matrimonial service that enables eligible individuals and families to create profiles, discover compatible matches, express interest, communicate, and pursue marriage alliances in accordance with their preferences, religion, and community values.
        </P>
        <P>
          Vivah Dwar is an <strong>intermediary platform</strong>. We facilitate connections between members but do not act as a marriage broker, matchmaker agent, or guarantor of any relationship outcome. All interactions, meetings, and decisions remain solely between members and their families.
        </P>
      </div>
    ),
  },
  {
    title: 'Eligibility Requirements',
    content: (
      <div className="space-y-4">
        <P>To register and use Vivah Dwar, you must meet all of the following criteria:</P>
        <UL items={[
          'Be at least 18 years of age at the time of registration',
          'Be legally eligible to enter into marriage under the laws applicable to you',
          'Not be currently married unless your marital status is accurately disclosed as Divorced or Widowed',
          'Provide a valid, permanent email address and mobile phone number',
          'Not have been previously banned, suspended, or removed from the Platform',
          'Use the Platform solely for genuine matrimonial purposes — not dating, casual relationships, or commercial solicitation',
          'Have the legal capacity to enter into a binding contract under Indian law or the law of your jurisdiction',
        ]} />
      </div>
    ),
  },
  {
    title: 'Account Registration & Verification',
    content: (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-vd-accent-soft/40 dark:bg-vd-accent/10 border border-vd-border rounded-xl">
          <ShieldCheck className="w-5 h-5 text-vd-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <P><strong>Multi-step verification is mandatory.</strong> Vivah Dwar employs the following verification pipeline to protect all members:</P>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { step: '1', title: 'Email OTP Verification', desc: 'A one-time password is sent to your registered email. Your account is created only after successful verification.' },
            { step: '2', title: 'Phone Number Registration', desc: 'A valid mobile number is required at signup. Temporary or duplicate numbers are not permitted.' },
            { step: '3', title: 'Complete Profile Submission', desc: 'All mandatory profile fields, profile photo, family/lifestyle photo, and ID document must be submitted.' },
            { step: '4', title: 'Admin Profile Approval', desc: 'Our verification team manually reviews each profile before it becomes visible in search and match results.' },
            { step: '5', title: 'ID Document Verification', desc: 'Government-issued ID is reviewed separately. Approved documents earn a Verified Badge on your profile.' },
            { step: '6', title: 'Video KYC (Optional/Admin-initiated)', desc: 'Our team may request a live video verification for additional identity confirmation.' },
          ].map(s => (
            <div key={s.step} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="w-6 h-6 vd-gradient-gold rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{s.step}</span>
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <P>Profiles that fail verification, submit false information, or receive multiple abuse reports may be rejected, suspended, or permanently banned without refund.</P>
      </div>
    ),
  },
  {
    title: 'Profile Standards & Authenticity Policy',
    content: (
      <div className="space-y-4">
        <P>Every member is required to maintain an accurate, truthful, and current profile. The following standards apply:</P>
        <UL items={[
          'Profile photos must be recent, clear, and depict you — not celebrities, stock images, or other persons',
          'All personal details (name, age, religion, location, education, marital status) must be truthful',
          'Only one account per person is permitted — duplicate accounts will be permanently banned',
          'ID documents submitted must belong to you and must not be altered or forged',
          'Using another person\'s photos or identity constitutes fraud and may result in criminal referral',
          'Profiles must be submitted for admin review — incomplete profiles will not appear in search results',
        ]} />
        <P>Vivah Dwar reserves the right to reject, edit, or remove any profile content that violates these standards without prior notice.</P>
      </div>
    ),
  },
  {
    title: 'Acceptable Use & Prohibited Conduct',
    content: (
      <div className="space-y-4">
        <P>The following conduct is strictly prohibited on Vivah Dwar:</P>
        <div className="space-y-2">
          {[
            'Creating fake, misleading, impersonation, or duplicate profiles',
            'Harassing, threatening, stalking, or abusing other members',
            'Soliciting money, gifts, dowry, investments, or financial assistance from other users',
            'Sharing sexually explicit, offensive, defamatory, or inappropriate content',
            'Using the Platform for commercial advertising, MLM, or non-matrimonial solicitation',
            'Scraping, crawling, reverse-engineering, or attempting to hack the Platform',
            'Sharing another member\'s personal contact details publicly without consent',
            'Registering with disposable or temporary email addresses',
            'Uploading photos already used on another account (duplicate photo fraud)',
            'Circumventing admin verification, blocks, or account suspensions',
            'Misrepresenting marital status, age, religion, or identity',
          ].map(item => (
            <div key={item} className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/10 rounded-xl text-xs text-red-700 dark:text-red-400">
              <Ban className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {item}
            </div>
          ))}
        </div>
        <P>Violation may result in immediate account suspension, permanent ban, forfeiture of subscription fees, and reporting to law enforcement where applicable.</P>
      </div>
    ),
  },
  {
    title: 'Community Reporting & Auto-Suspension',
    content: (
      <div className="space-y-4">
        <P>Members may report suspicious or abusive profiles through our Report Abuse feature. Vivah Dwar takes community reports seriously:</P>
        <UL items={[
          'All reports are reviewed by our admin team',
          'Profiles receiving three or more verified abuse reports may be automatically hidden from search pending investigation',
          'Affected members will be notified and may contact support to appeal',
          'False or malicious reporting may itself result in account action against the reporter',
        ]} />
      </div>
    ),
  },
  {
    title: 'Premium Subscriptions & Payments',
    content: (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <CreditCard className="w-5 h-5 text-vd-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <P>Vivah Dwar offers free and premium membership tiers. Premium subscriptions unlock enhanced features such as unlimited profile views, contact access, and priority visibility.</P>
          </div>
        </div>
        <UL items={[
          'All prices are displayed in Indian Rupees (INR) and include applicable taxes unless stated otherwise',
          'Payments are processed securely through Cashfree Payment Gateway — we do not store your card or UPI credentials',
          'Subscriptions are one-time purchases for the selected duration and do not auto-renew unless explicitly stated',
          'A free trial period may be offered upon admin profile approval, subject to platform configuration',
          'We reserve the right to modify pricing with at least 30 days\' notice to existing subscribers',
          'Premium access begins upon successful payment confirmation and receipt of subscription receipt email',
        ]} />
        <P>For refund terms, please refer to our <a href="/refund" className="text-vd-primary hover:underline">Refund Policy</a>.</P>
      </div>
    ),
  },
  {
    title: 'Intellectual Property',
    content: (
      <div className="space-y-4">
        <P>All Platform content — including the Vivah Dwar name, logo, design, software, text, graphics, and layout — is owned by or licensed to Vivah Dwar and protected under copyright, trademark, and other intellectual property laws of India and international treaties.</P>
        <P>You may not copy, reproduce, distribute, modify, or create derivative works from any Platform content without our prior written consent.</P>
      </div>
    ),
  },
  {
    title: 'User Content License',
    content: (
      <div className="space-y-4">
        <P>By uploading content (photos, text, documents) to Vivah Dwar, you grant us a non-exclusive, worldwide, royalty-free license to use, store, display, and distribute that content solely for the purpose of operating and promoting the Platform.</P>
        <UL items={[
          'You retain ownership of your content at all times',
          'You represent that you have the right to upload all content you submit',
          'You may delete photos and update profile text at any time through your account settings',
          'Account deletion will initiate removal of your content subject to legal retention requirements',
        ]} />
      </div>
    ),
  },
  {
    title: 'Privacy & Data Protection',
    content: (
      <div className="space-y-4">
        <P>Your use of the Platform is also governed by our <a href="/privacy" className="text-vd-primary hover:underline font-medium">Privacy Policy</a>, which explains how we collect, use, and protect your personal information. By using Vivah Dwar, you consent to our data practices as described therein.</P>
      </div>
    ),
  },
  {
    title: 'Disclaimers',
    content: (
      <div className="space-y-4">
        <P>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, VIVAH DWAR PROVIDES THE PLATFORM ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED.</P>
        <UL items={[
          'We do not guarantee that you will find a suitable match or enter into a marriage',
          'We do not independently verify all information provided by members beyond our stated verification process',
          'We are not responsible for the conduct, statements, or actions of any member on or off the Platform',
          'Verified badges indicate ID document review — not character, financial status, or intent verification',
          'Members are solely responsible for their own safety when communicating or meeting offline',
          'We recommend following our Safety Guidelines and involving family in all matrimonial decisions',
        ]} />
      </div>
    ),
  },
  {
    title: 'Limitation of Liability',
    content: (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <Scale className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <P>
            To the fullest extent permitted by law, Vivah Dwar shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, goodwill, or emotional distress arising from your use of the Platform or interactions with other members.
          </P>
        </div>
        <P>Our total aggregate liability to you for any claim arising from these Terms or your use of the Platform shall not exceed the greater of (a) the amount you paid to Vivah Dwar in the three (3) months preceding the claim, or (b) INR 1,000.</P>
      </div>
    ),
  },
  {
    title: 'Indemnification',
    content: (
      <div className="space-y-4">
        <P>You agree to indemnify, defend, and hold harmless Vivah Dwar, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including reasonable legal fees) arising from your use of the Platform, your profile content, your violation of these Terms, or your infringement of any third-party rights.</P>
      </div>
    ),
  },
  {
    title: 'Account Suspension & Termination',
    content: (
      <div className="space-y-4">
        <P>Either party may terminate this agreement as follows:</P>
        <UL items={[
          'You may delete your account at any time through account settings or by contacting supportvivahdwar@gmail.com',
          'We may suspend or permanently terminate your account for violation of these Terms, fraudulent activity, or multiple abuse reports — with or without notice',
          'Upon termination, your right to access the Platform ceases immediately',
          'Premium subscriptions terminated for Terms violations are non-refundable',
          'We may retain certain data as required by law or for legitimate business purposes as described in our Privacy Policy',
        ]} />
      </div>
    ),
  },
  {
    title: 'Dispute Resolution & Governing Law',
    content: (
      <div className="space-y-4">
        <P>These Terms shall be governed by and construed in accordance with the laws of <strong>India</strong>, without regard to conflict of law principles.</P>
        <P>Any dispute arising from or relating to these Terms or the Platform shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be subject to the exclusive jurisdiction of the courts in <strong>Mumbai, Maharashtra, India</strong>.</P>
        <P>For grievances, contact our Grievance Officer at <a href="mailto:grievance@vivahdwar.com" className="text-vd-primary hover:underline">grievance@vivahdwar.com</a>. We aim to acknowledge grievances within 48 hours and resolve them within 30 days.</P>
      </div>
    ),
  },
  {
    title: 'General Provisions',
    content: (
      <div className="space-y-4">
        <UL items={[
          'Severability — If any provision is found unenforceable, the remaining provisions remain in full effect',
          'Waiver — Failure to enforce any right does not constitute a waiver of that right',
          'Assignment — You may not assign your account without our consent; we may assign our rights freely',
          'Force Majeure — We are not liable for delays caused by events beyond our reasonable control',
          'Entire Agreement — These Terms, Privacy Policy, and Refund Policy constitute the entire agreement between you and Vivah Dwar',
          'Updates — We may modify these Terms with 14 days\' notice for material changes. Continued use constitutes acceptance',
        ]} />
        <P>For legal inquiries: <a href="mailto:legal@vivahdwar.com" className="text-vd-primary hover:underline">legal@vivahdwar.com</a></P>
      </div>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      subtitle="The legal agreement governing your use of Vivah Dwar matrimonial platform"
      icon={FileText}
      iconBg="vd-gradient-gold"
      lastUpdated="May 28, 2026"
      sections={sections}
      relatedLinks={[
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Refund Policy', href: '/refund' },
        { label: 'Safety Guidelines', href: '/safety' },
        { label: 'Contact Us', href: '/contact' },
      ]}
    />
  );
}
