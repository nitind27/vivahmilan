'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import {
  HelpCircle, User, Heart, MessageCircle, CreditCard, Shield, Bell, Settings, BookOpen, Star,
} from 'lucide-react';
import { groupFaqsByCategory } from '@/lib/faqShared';

const ICON_MAP = {
  HelpCircle, User, Heart, MessageCircle, CreditCard, Shield, Bell, Settings, BookOpen, Star,
};

const CATEGORY_COLORS = {
  General: 'bg-vd-accent-soft dark:bg-vd-accent/20 text-vd-primary',
  'Account & Profile': 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
  'Matches & Interests': 'bg-red-100 dark:bg-red-900/20 text-red-600',
  'Chat & Messaging': 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600',
  'Subscription & Payments': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600',
  'Safety & Privacy': 'bg-green-100 dark:bg-green-900/20 text-green-600',
};

function FAQItem({ question, answer, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-vd-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:text-vd-primary transition-colors group"
      >
        <span className="font-medium text-sm text-vd-text-heading group-hover:text-vd-primary">{question}</span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180 text-vd-primary' : 'text-vd-text-light'}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-vd-text-sub text-sm pb-4 leading-relaxed whitespace-pre-wrap">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqAccordion({
  items = [],
  searchable = false,
  showCategories = true,
  variant = 'default',
  title = 'Frequently Asked Questions',
  subtitle = 'Quick answers to common questions',
  emptyMessage = 'No FAQs available yet.',
}) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const filtered = items.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q);
  });

  const grouped = groupFaqsByCategory(filtered);
  const displayGroups = search
    ? grouped
    : activeCategory !== null
      ? grouped.filter((g) => g.category === grouped[activeCategory]?.category)
      : grouped;

  const isCompact = variant === 'compact';

  return (
    <section className={isCompact ? '' : 'mt-4'}>
      {!isCompact && title && (
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-vd-text-heading mb-2">{title}</h2>
          {subtitle && <p className="text-vd-text-sub text-sm max-w-lg mx-auto">{subtitle}</p>}
        </div>
      )}

      {searchable && (
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-vd-text-light" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search FAQs…"
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-vd-border bg-vd-bg-section text-sm focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft"
          />
        </div>
      )}

      {showCategories && !search && grouped.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === null
                ? 'vd-gradient-gold text-white shadow-sm'
                : 'bg-vd-bg-section border border-vd-border text-vd-text-sub hover:border-vd-primary'
            }`}
          >
            All
          </button>
          {grouped.map((g, i) => {
            const Icon = ICON_MAP[g.faqs[0]?.icon] || HelpCircle;
            return (
              <button
                key={g.category}
                type="button"
                onClick={() => setActiveCategory(activeCategory === i ? null : i)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeCategory === i
                    ? 'vd-gradient-gold text-white shadow-sm'
                    : 'bg-vd-bg-section border border-vd-border text-vd-text-sub hover:border-vd-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {g.category}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-vd-bg-section rounded-3xl border border-vd-border">
          <HelpCircle className="w-10 h-10 text-vd-text-light mx-auto mb-3" />
          <p className="text-vd-text-sub text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {displayGroups.map((group) => {
            const Icon = ICON_MAP[group.faqs[0]?.icon] || HelpCircle;
            const color = CATEGORY_COLORS[group.category] || CATEGORY_COLORS.General;
            return (
              <div
                key={group.category}
                className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl sm:rounded-3xl border border-vd-border overflow-hidden shadow-sm"
              >
                {showCategories && (
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-vd-border bg-vd-bg-alt/30">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-vd-text-heading text-sm sm:text-base">{group.category}</h3>
                      <p className="text-xs text-vd-text-light">{group.faqs.length} questions</p>
                    </div>
                  </div>
                )}
                <div className="px-5">
                  {group.faqs.map((faq, j) => (
                    <FAQItem key={faq.id || j} question={faq.question} answer={faq.answer} defaultOpen={j === 0 && isCompact} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
