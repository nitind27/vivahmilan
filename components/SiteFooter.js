'use client';
import Link from 'next/link';
import { Heart, Shield, CheckCircle, Users } from 'lucide-react';
import CookieManageButton from '@/components/CookieManageButton';
import { SUPPORT_WHATSAPP_URL } from '@/lib/siteContact';

const FOOTER_LINKS = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'Success Stories', href: '/stories' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Safety Tips', href: '/safety' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Report Abuse', href: '/report-abuse' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refund' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
    manageCookies: true,
  },
];

export default function SiteFooter({
  tagline = 'Find your perfect life partner with trust, safety, and love.',
  siteName = 'Vivah Dwar',
}) {
  return (
    <footer className="relative bg-vd-bg text-vd-text-sub mt-auto">
      <div className="pointer-events-none -mt-px leading-[0]">
        <svg viewBox="0 0 1440 48" className="w-full block fill-vd-bg" preserveAspectRatio="none">
          <path d="M0,24 C480,48 960,0 1440,24 L1440,48 L0,48 Z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Shield, label: 'Verified Profiles', desc: 'Every profile reviewed for authenticity' },
            { icon: CheckCircle, label: 'Safe & Private', desc: 'Your data stays protected' },
            { icon: Users, label: 'Real Support', desc: 'We help you at every step' },
          ].map(({ icon: Icon, label, desc }) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-2xl bg-vd-bg-section border border-vd-border px-4 py-3.5 shadow-sm"
            >
              <span className="w-10 h-10 rounded-xl vd-gradient-gold flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-white" strokeWidth={2} />
              </span>
              <div>
                <p className="text-sm font-semibold text-vd-text-heading">{label}</p>
                <p className="text-xs text-vd-text-light">{desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-10 border-b border-vd-border">
          <div className="lg:col-span-4 flex flex-col items-center text-center">
            <Link href="/" className="inline-block mb-4 group" aria-label={siteName}>
              <img
                src="/logo/logo.png"
                alt={siteName}
                className="h-16 sm:h-[4.5rem] w-auto object-contain mx-auto transition-opacity group-hover:opacity-90"
              />
            </Link>
            <p className="text-sm leading-relaxed text-vd-text-sub max-w-xs mb-5">{tagline}</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white vd-gradient-gold hover:opacity-90 transition-opacity shadow-sm"
            >
              Join Free <Heart className="w-4 h-4 fill-white" />
            </Link>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-vd-text-heading mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-vd-text-sub hover:text-vd-primary-dark transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  {col.manageCookies && (
                    <li>
                      <CookieManageButton />
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <p className="text-sm text-vd-text-light">Connect with us</p>
          <div className="flex items-center gap-2">
            {[
              { href: 'https://facebook.com/', label: 'Facebook', svg: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
              { href: 'https://www.instagram.com/vivah_dwar?igsh=empvN3VqZzN2OHZk', label: 'Instagram', svg: <><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></> },
              { href: 'https://youtube.com/@vivahdwar', label: 'YouTube', svg: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></> },
              { href: SUPPORT_WHATSAPP_URL, label: 'WhatsApp', svg: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /> },
            ].map(({ href, label, svg }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-10 h-10 rounded-xl bg-vd-bg-section border border-vd-border flex items-center justify-center text-vd-text-light hover:text-vd-primary-dark hover:border-vd-primary/40 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {svg}
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-vd-bg-alt border-t border-vd-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-vd-text-light">
          <p>
            © {new Date().getFullYear()}{' '}
            <span className="text-vd-text-sub font-medium">{siteName}</span> — Indian Matrimonial Platform. All rights reserved.
          </p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 fill-vd-primary text-vd-primary" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
}
