import LegalPage from '@/components/LegalPage';
import { Cookie } from 'lucide-react';

const sections = [
  {
    title: 'What Are Cookies?',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and improve your overall experience.</p>
        <p>Vivah Milan uses cookies and similar technologies (like local storage and session storage) to provide a seamless experience across your visits.</p>
      </div>
    ),
  },
  {
    title: 'Types of Cookies We Use',
    content: (
      <div className="space-y-4 text-gray-600 dark:text-gray-400 text-sm">
        {[
          {
            type: 'Essential Cookies', required: true, color: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10',
            badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
            desc: 'These cookies are necessary for the platform to function and cannot be disabled.',
            examples: ['Authentication tokens (keep you logged in)', 'Security cookies (CSRF protection)', 'Session management', 'Load balancing'],
          },
          {
            type: 'Functional Cookies', required: false, color: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10',
            badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
            desc: 'These cookies remember your preferences to enhance your experience.',
            examples: ['Dark/light mode preference', 'Language settings', 'Notification preferences', 'Last visited pages'],
          },
          {
            type: 'Analytics Cookies', required: false, color: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10',
            badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
            desc: 'Help us understand how users interact with our platform to improve it.',
            examples: ['Page views and navigation patterns', 'Feature usage statistics', 'Error tracking', 'Performance monitoring'],
          },
        ].map((c, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${c.color}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{c.type}</span>
              {c.required && <span className="text-xs text-gray-400">Required</span>}
            </div>
            <p className="text-xs mb-2">{c.desc}</p>
            <ul className="space-y-1">
              {c.examples.map((ex, j) => (
                <li key={j} className="text-xs flex items-center gap-1.5 text-gray-500">
                  <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />{ex}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Third-Party Cookies',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>Some features on our platform use third-party services that may set their own cookies:</p>
        <div className="space-y-2">
          {[
            { name: 'Cashfree', purpose: 'Payment processing — secure transaction handling', link: 'https://cashfree.com/privacy' },
            { name: 'Google OAuth', purpose: 'Social login — if you sign in with Google', link: 'https://policies.google.com/privacy' },
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex-1">
                <p className="font-semibold text-xs text-gray-800 dark:text-gray-200">{t.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.purpose}</p>
              </div>
              <a href={t.link} target="_blank" rel="noreferrer" className="text-xs text-pink-500 hover:underline flex-shrink-0">Privacy Policy ↗</a>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Managing Cookies',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>You can control cookies through your browser settings. Here's how to manage them in popular browsers:</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { browser: 'Chrome', path: 'Settings → Privacy → Cookies' },
            { browser: 'Firefox', path: 'Settings → Privacy & Security' },
            { browser: 'Safari', path: 'Preferences → Privacy' },
            { browser: 'Edge', path: 'Settings → Cookies and site permissions' },
          ].map((b, i) => (
            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="font-semibold text-xs text-gray-800 dark:text-gray-200">{b.browser}</p>
              <p className="text-xs text-gray-500 mt-0.5">{b.path}</p>
            </div>
          ))}
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400">
          ⚠️ Disabling essential cookies may prevent you from logging in or using core features of Vivah Milan.
        </div>
      </div>
    ),
  },
  {
    title: 'Cookie Retention',
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>Different cookies are retained for different periods:</p>
        <div className="space-y-2">
          {[
            { type: 'Session cookies', duration: 'Deleted when you close your browser', color: 'text-blue-600 dark:text-blue-400' },
            { type: 'Authentication tokens', duration: '30 days (or until you log out)', color: 'text-purple-600 dark:text-purple-400' },
            { type: 'Preference cookies', duration: '1 year', color: 'text-green-600 dark:text-green-400' },
            { type: 'Analytics cookies', duration: '90 days', color: 'text-yellow-600 dark:text-yellow-400' },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className={`text-xs font-medium ${c.color}`}>{c.type}</span>
              <span className="text-xs text-gray-500">{c.duration}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      subtitle="How Vivah Milan uses cookies to improve your experience"
      icon={Cookie}
      iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
      lastUpdated="January 1, 2026"
      sections={sections}
      relatedLinks={[
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Contact Us', href: '/contact' },
      ]}
    />
  );
}
