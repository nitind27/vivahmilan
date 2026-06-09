'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL, SUPPORT_HOURS } from '@/lib/siteContact';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import FaqAccordion from '@/components/FaqAccordion';
import { Search, User, Heart, MessageCircle, CreditCard, Settings, Bell, Shield } from 'lucide-react';

const FALLBACK_CATEGORIES = [
  {
    icon: User, label: 'Account & Profile', color: 'bg-vd-accent-soft dark:bg-vd-accent/20 text-vd-primary',
    faqs: [
      { q: 'How do I create my profile?', a: "After registering, complete the onboarding steps — fill in your basic info, religion, location, career details, family info, and upload your photo & ID. Your profile will be reviewed by our admin team within 24 hours." },
      { q: 'How do I edit my profile?', a: 'Go to Dashboard → Edit Profile. You can update any section and save changes anytime.' },
      { q: 'Why is my profile pending approval?', a: "All new profiles are reviewed by our team to ensure authenticity. This usually takes up to 24 hours. You'll receive an email once approved." },
      { q: 'How do I delete my account?', a: 'Contact our support team at supportvivahdwar@gmail.com with your registered email. Account deletion is permanent and cannot be undone.' },
    ],
  },
  {
    icon: Heart, label: 'Matches & Interests', color: 'bg-red-100 dark:bg-red-900/20 text-red-600',
    faqs: [
      { q: 'How does matching work?', a: 'Our algorithm matches profiles based on religion, location, age range, education, and partner preferences you set in your profile.' },
      { q: 'How do I send an interest?', a: 'Visit any profile and click the "Send Interest" button. The other person will be notified and can accept or decline.' },
      { q: 'Can I shortlist profiles?', a: 'Yes! Click the heart icon on any profile card or use "Add to Shortlist" on a profile page. View all saved profiles on My Shortlist (/shortlist).' },
    ],
  },
  {
    icon: MessageCircle, label: 'Chat & Messaging', color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
    faqs: [
      { q: "Why can't I send messages?", a: 'Chat requires a Premium subscription or an active free trial. Upgrade your plan to unlock messaging.' },
      { q: 'Are my messages private?', a: 'Yes, all messages are private between you and the other person. We do not share or read your conversations.' },
      { q: 'Can I send photos in chat?', a: 'Yes, Premium members can send photos, documents, and share their location in chat.' },
    ],
  },
  {
    icon: CreditCard, label: 'Subscription & Payments', color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600',
    faqs: [
      { q: 'What plans are available?', a: 'We offer Silver, Gold, and Platinum plans. Each plan unlocks different features.' },
      { q: 'Is there a free trial?', a: 'Yes! New users get a free trial after their profile is approved by admin.' },
      { q: 'What payment methods are accepted?', a: 'We accept all major credit/debit cards, UPI, net banking, and wallets via Cashfree payment gateway.' },
    ],
  },
  {
    icon: Bell, label: 'Notifications', color: 'bg-vd-accent-soft dark:bg-vd-accent/20 text-vd-primary',
    faqs: [
      { q: 'How do I enable push notifications?', a: 'When you first visit the site, allow notifications when prompted. You can also enable them from your browser settings.' },
      { q: 'Why am I not receiving notifications?', a: "Check that notifications are allowed in your browser settings for our website. Also ensure you're logged in." },
    ],
  },
  {
    icon: Settings, label: 'Privacy & Settings', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    faqs: [
      { q: 'Can I hide my phone number?', a: 'Yes, go to Edit Profile → Lifestyle & Privacy and toggle "Hide phone number from non-premium users".' },
      { q: 'Can I block someone?', a: 'Yes, visit their profile and use the block option. Blocked users cannot view your profile or contact you.' },
      { q: 'How do I report a fake profile?', a: 'Visit the profile and click "Report". Our team will review within 24 hours. You can also use our Report Abuse page.' },
    ],
  },
];

const ICON_MAP = { User, Heart, MessageCircle, CreditCard, Bell, Settings, Shield };

function fallbackToFaqItems() {
  return FALLBACK_CATEGORIES.flatMap((cat) =>
    cat.faqs.map((f, i) => ({
      id: `fallback-${cat.label}-${i}`,
      category: cat.label,
      question: f.q,
      answer: f.a,
      icon: Object.keys(ICON_MAP).find((k) => ICON_MAP[k] === cat.icon) || 'HelpCircle',
    }))
  );
}

export default function HelpPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/faq?help=1')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFaqs(data);
        } else {
          setFaqs(fallbackToFaqItems());
        }
      })
      .catch(() => setFaqs(fallbackToFaqItems()))
      .finally(() => setLoading(false));
  }, []);

  const filteredFaqs = useMemo(() => {
    if (!search) return faqs;
    const q = search.toLowerCase();
    return faqs.filter(
      (f) => f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q)
    );
  }, [faqs, search]);

  return (
    <div className="min-h-screen bg-vd-bg flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16">
        <div className="vd-gradient-gold py-16 px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">How can we help you?</h1>
          <p className="text-white/80 mb-8">Search our help center or browse categories below</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for answers…"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-gray-900 text-sm focus:outline-none shadow-lg"
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 skeleton rounded-2xl" />
              ))}
            </div>
          ) : (
            <FaqAccordion
              items={filteredFaqs}
              searchable={false}
              showCategories={!search}
              title=""
              subtitle=""
              variant="compact"
              emptyMessage="No matching answers found. Try a different search or contact support."
            />
          )}

          <div className="mt-12 vd-gradient-gold rounded-2xl p-6 text-white text-center">
            <h3 className="font-bold text-lg mb-1">Still need help?</h3>
            <p className="text-white/80 text-sm mb-2">Our support team is here for you — {SUPPORT_HOURS}</p>
            <p className="text-white/90 text-sm mb-4">
              <a href={`tel:${SUPPORT_PHONE_TEL}`} className="underline hover:no-underline">{SUPPORT_PHONE_DISPLAY}</a>
              {' · '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:no-underline">{SUPPORT_EMAIL}</a>
            </p>
            <Link href="/contact" className="inline-block bg-white text-vd-primary px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-vd-accent-soft transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
