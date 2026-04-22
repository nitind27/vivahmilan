'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Heart, Search, ChevronDown, MessageCircle, Shield, User, CreditCard, Settings, Bell } from 'lucide-react';

const CATEGORIES = [
  {
    icon: User, label: 'Account & Profile', color: 'bg-vd-accent-soft dark:bg-vd-accent/20 text-vd-primary',
    faqs: [
      { q: 'How do I create my profile?', a: "After registering, complete the onboarding steps — fill in your basic info, religion, location, career details, family info, and upload your photo & ID. Your profile will be reviewed by our admin team within 24 hours." },
      { q: 'How do I edit my profile?', a: 'Go to Dashboard → Edit Profile. You can update any section and save changes anytime.' },
      { q: 'Why is my profile pending approval?', a: "All new profiles are reviewed by our team to ensure authenticity. This usually takes up to 24 hours. You'll receive an email once approved." },
      { q: 'How do I delete my account?', a: 'Contact our support team at support@vivahmilan.com with your registered email. Account deletion is permanent and cannot be undone.' },
    ],
  },
  {
    icon: Heart, label: 'Matches & Interests', color: 'bg-red-100 dark:bg-red-900/20 text-red-600',
    faqs: [
      { q: 'How does matching work?', a: 'Our algorithm matches profiles based on religion, location, age range, education, and partner preferences you set in your profile.' },
      { q: 'How do I send an interest?', a: 'Visit any profile and click the "Send Interest" button. The other person will be notified and can accept or decline.' },
      { q: 'Can I shortlist profiles?', a: 'Yes! Click the heart icon on any profile card to add them to your shortlist. Access your shortlist from the dashboard.' },
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
      { q: 'What plans are available?', a: 'We offer Silver (₹749/month), Gold (₹1499/month), and Platinum (₹2999/month) plans. Each plan unlocks different features.' },
      { q: 'Is there a free trial?', a: 'Yes! New users get a free trial after their profile is approved by admin. The trial duration is set by our team.' },
      { q: 'How do I cancel my subscription?', a: "Subscriptions are one-time payments and do not auto-renew. Simply don't repurchase when your plan expires." },
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

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-vd-border last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:text-vd-primary transition-colors">
        <span className="font-medium text-sm">{q}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180 text-vd-primary' : 'text-gray-400'}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <p className="text-vd-text-sub text-sm pb-4 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const filtered = CATEGORIES.map(cat => ({
    ...cat,
    faqs: cat.faqs.filter(f =>
      !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => !search || cat.faqs.length > 0);

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="pt-16">
        {/* Hero */}
        <div className="vd-gradient-gold py-16 px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">How can we help you?</h1>
          <p className="text-white/80 mb-8">Search our help center or browse categories below</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search for answers…"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-gray-900 text-sm focus:outline-none shadow-lg"
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Category grid */}
          {!search && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
              {CATEGORIES.map((cat, i) => (
                <button key={i} onClick={() => setActiveCategory(activeCategory === i ? null : i)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${activeCategory === i ? 'border-vd-primary bg-vd-accent-soft dark:bg-vd-accent/10' : 'border-vd-border bg-vd-bg-section dark:bg-vd-bg-card hover:border-vd-primary'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cat.color}`}>
                    <cat.icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-sm">{cat.label}</p>
                  <p className="text-xs text-vd-text-light mt-0.5">{cat.faqs.length} articles</p>
                </button>
              ))}
            </div>
          )}

          {/* FAQs */}
          <div className="space-y-6">
            {(search ? filtered : activeCategory !== null ? [CATEGORIES[activeCategory]] : CATEGORIES).map((cat, i) => (
              <div key={i} className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl border border-vd-border overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-vd-border">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cat.color}`}>
                    <cat.icon className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold">{cat.label}</h2>
                </div>
                <div className="px-5">
                  {cat.faqs.map((faq, j) => <FAQItem key={j} q={faq.q} a={faq.a} />)}
                </div>
              </div>
            ))}
          </div>

          {/* Still need help */}
          <div className="mt-12 vd-gradient-gold rounded-2xl p-6 text-white text-center">
            <h3 className="font-bold text-lg mb-1">Still need help?</h3>
            <p className="text-white/80 text-sm mb-4">Our support team is here for you</p>
            <Link href="/contact" className="inline-block bg-white text-vd-primary px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-vd-accent-soft transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
