'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, MessageCircle, HelpCircle, Flag, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const TOPICS = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'account', label: 'Account Issue' },
  { value: 'payment', label: 'Payment / Subscription' },
  { value: 'technical', label: 'Technical Problem' },
  { value: 'safety', label: 'Safety Concern' },
  { value: 'feedback', label: 'Feedback / Suggestion' },
  { value: 'other', label: 'Other' },
];

const CONTACT_INFO = [
  { icon: Mail, label: 'Email Support', value: 'support@vivahmilan.com', sub: 'We reply within 24 hours', href: 'mailto:support@vivahmilan.com' },
  { icon: Phone, label: 'Phone Support', value: '+91 98765 43210', sub: 'Mon–Sat, 10am–6pm IST', href: 'tel:+919876543210' },
  { icon: MapPin, label: 'Office Address', value: 'Mumbai, Maharashtra, India', sub: 'Registered office', href: null },
  { icon: Clock, label: 'Support Hours', value: 'Mon–Sat: 10am–6pm', sub: 'IST (UTC+5:30)', href: null },
];

const QUICK_LINKS = [
  { icon: HelpCircle, label: 'Help Center', href: '/help', desc: 'Browse FAQs and guides' },
  { icon: Shield, label: 'Safety Tips', href: '/safety', desc: 'Stay safe on our platform' },
  { icon: Flag, label: 'Report Abuse', href: '/report-abuse', desc: 'Report fake profiles or scams' },
  { icon: MessageCircle, label: 'Live Chat', href: '/chat', desc: 'Chat with matched profiles' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error('Please fill all required fields'); return; }
    setLoading(true);
    // Simulate submission
    await new Promise(r => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-24 flex items-center justify-center px-4 pb-12">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-10 max-w-md w-full text-center border border-gray-100 dark:border-gray-700 shadow-xl">
            <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
            <p className="text-gray-500 text-sm mb-2">Thank you for reaching out, <strong>{form.name}</strong>.</p>
            <p className="text-gray-400 text-sm mb-6">We've received your message and will reply to <strong className="text-pink-500">{form.email}</strong> within 24 hours.</p>
            <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', topic: '', message: '' }); }}
              className="w-full gradient-bg text-white py-3 rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity">
              Send Another Message
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-16">
        {/* Hero */}
        <div className="gradient-bg py-14 px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Contact Us</h1>
          <p className="text-white/80 text-sm max-w-md mx-auto">Have a question or need help? We're here for you. Reach out and we'll get back to you as soon as possible.</p>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left — Contact Info */}
            <div className="space-y-6">
              {/* Contact cards */}
              <div className="space-y-3">
                {CONTACT_INFO.map((c, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                    {c.href ? (
                      <a href={c.href} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-pink-300 transition-colors group">
                        <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center flex-shrink-0">
                          <c.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">{c.label}</p>
                          <p className="font-semibold text-sm group-hover:text-pink-500 transition-colors">{c.value}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center flex-shrink-0">
                          <c.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">{c.label}</p>
                          <p className="font-semibold text-sm">{c.value}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Quick links */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="font-bold text-sm mb-3 text-gray-500 uppercase tracking-wide">Quick Links</h3>
                <div className="space-y-2">
                  {QUICK_LINKS.map((l, i) => (
                    <a key={i} href={l.href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                      <l.icon className="w-4 h-4 text-pink-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium group-hover:text-pink-500 transition-colors">{l.label}</p>
                        <p className="text-xs text-gray-400">{l.desc}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="font-bold text-xl mb-5">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name <span className="text-red-500">*</span></label>
                      <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Your name"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email <span className="text-red-500">*</span></label>
                      <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/20" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Topic</label>
                    <select value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:border-pink-400 appearance-none">
                      <option value="">Select a topic</option>
                      {TOPICS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message <span className="text-red-500">*</span></label>
                    <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      rows={5} maxLength={2000}
                      placeholder="Describe your issue or question in detail…"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/20 resize-none" />
                    <p className="text-xs text-gray-400 mt-1 text-right">{form.message.length}/2000</p>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full gradient-bg text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity">
                    {loading ? 'Sending…' : <><Send className="w-4 h-4" /> Send Message</>}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
