'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Shield, AlertTriangle, Eye, Lock, Phone, Heart, CheckCircle, XCircle, Flag } from 'lucide-react';

const TIPS = [
  {
    icon: Eye, color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
    title: 'Verify Before You Trust',
    tips: [
      'Always check for the verified badge (✓) on profiles — it means their ID has been reviewed by our team.',
      'Video call before meeting in person to confirm the person matches their photos.',
      'Search their name and photos online to verify their identity.',
      'Be cautious of profiles with very few photos or vague information.',
    ],
  },
  {
    icon: Lock, color: 'bg-vd-accent-soft dark:bg-vd-accent/20 text-vd-primary',
    title: 'Protect Your Personal Information',
    tips: [
      'Never share your home address, workplace, or daily routine with someone you just met.',
      'Do not share financial information, bank details, or send money to anyone.',
      'Keep your phone number private until you\'re comfortable — use in-app chat first.',
      'Use a separate email address for matrimony platforms if you prefer extra privacy.',
    ],
  },
  {
    icon: AlertTriangle, color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600',
    title: 'Recognize Red Flags',
    tips: [
      'Avoid anyone who asks for money, gifts, or financial help — this is a common scam.',
      'Be wary of profiles that seem too perfect or rush into emotional commitment quickly.',
      'If someone refuses to video call or meet in person after weeks of chatting, be cautious.',
      'Inconsistent stories, vague job descriptions, or living abroad are common scam patterns.',
    ],
  },
  {
    icon: Phone, color: 'bg-green-100 dark:bg-green-900/20 text-green-600',
    title: 'Safe First Meeting',
    tips: [
      'Always meet for the first time in a public place — café, restaurant, or mall.',
      'Tell a trusted friend or family member where you\'re going and who you\'re meeting.',
      'Arrange your own transportation — don\'t accept rides from someone you just met.',
      'Keep your phone charged and have an emergency contact ready.',
    ],
  },
  {
    icon: Heart, color: 'bg-vd-accent-soft dark:bg-vd-accent/20 text-vd-primary',
    title: 'Emotional Safety',
    tips: [
      'Take your time — there\'s no rush. A genuine person will respect your pace.',
      'Trust your instincts. If something feels wrong, it probably is.',
      'Don\'t feel pressured to share personal photos or videos.',
      'Block and report anyone who makes you feel uncomfortable or unsafe.',
    ],
  },
];

const DOS = [
  'Use in-app messaging before sharing personal contact',
  'Meet in public places for first meetings',
  'Inform family/friends about your meetings',
  'Report suspicious profiles immediately',
  'Verify identity through video calls',
  'Trust your gut feeling',
];

const DONTS = [
  'Send money or gifts to anyone online',
  'Share your home address early on',
  'Share intimate photos or videos',
  'Ignore red flags hoping things improve',
  'Meet alone in private locations initially',
  'Share OTPs or passwords with anyone',
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="pt-16">
        {/* Hero */}
        <div className="vd-gradient-gold py-16 px-4 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Safety is Our Priority</h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm">
            Vivah Milan is committed to providing a safe and secure platform. Follow these tips to protect yourself.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
          {/* Do's and Don'ts */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl border border-vd-border p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" /> Do's
              </h2>
              <ul className="space-y-3">
                {DOS.map((d, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {d}
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl border border-vd-border p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" /> Don'ts
              </h2>
              <ul className="space-y-3">
                {DONTS.map((d, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    {d}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Safety Tips */}
          {TIPS.map((section, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl border border-vd-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.color}`}>
                  <section.icon className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-lg">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.tips.map((tip, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-vd-primary flex-shrink-0 mt-2" />
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Report CTA */}
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Flag className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-700 dark:text-red-400 mb-1">See something suspicious?</h3>
              <p className="text-sm text-red-600 dark:text-red-500 mb-3">Report fake profiles, scams, or inappropriate behavior immediately. Our team reviews all reports within 24 hours.</p>
              <Link href="/report-abuse" className="inline-block bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
                Report Abuse
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
