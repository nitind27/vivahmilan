'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import SiteLoader from '@/components/SiteLoader';
import { useCashfreeSdk } from '@/components/CashfreeCheckout';
import {
  Heart, Shield, Eye, IndianRupee, Loader2, CheckCircle2,
  TrendingUp, TrendingDown, Wallet, Users, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PRESETS = [101, 501, 1001, 2100, 5001, 11000];

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function categoryLabel(key) {
  const map = {
    WEDDING: 'Wedding',
    VENUE: 'Venue',
    ATTIRE: 'Attire',
    DOCUMENT: 'Documents',
    TRAVEL: 'Travel',
    OTHER: 'Other',
  };
  return map[key] || key;
}

export default function DonatePage() {
  const { data: session } = useSession();
  const { ready: sdkReady, openCheckout } = useCashfreeSdk();

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState(501);
  const [customAmount, setCustomAmount] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [myDonations, setMyDonations] = useState(null);
  const [expenditures, setExpenditures] = useState([]);

  useEffect(() => {
    fetch('/api/donation/config')
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig({ enabled: false }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (session?.user) {
      setDonorName(session.user.name || '');
      setDonorEmail(session.user.email || '');
      fetch('/api/donation/my')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d) {
            setMyDonations(d);
            setExpenditures(d.expenditures || []);
          }
        })
        .catch(() => {});
    } else {
      fetch('/api/donation/transparency')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setExpenditures(d.expenditures || []))
        .catch(() => {});
    }
  }, [session]);

  const finalAmount = useMemo(() => {
    if (customAmount.trim()) return Math.round(Number(customAmount) || 0);
    return amount;
  }, [amount, customAmount]);

  const donate = async () => {
    if (finalAmount < 10) return toast.error('Minimum donation is ₹10');
    setPaying(true);
    try {
      const res = await fetch('/api/donation/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          campaignId: campaignId || undefined,
          donorName,
          donorEmail,
          donorPhone,
          message,
          isAnonymous,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not start payment');
        return;
      }
      if (!sdkReady) {
        toast.error('Payment gateway loading — please wait');
        return;
      }
      await openCheckout(data.paymentSessionId, '_self');
    } catch (e) {
      toast.error(e.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <SiteLoader message="Loading…" />;
  if (!config?.enabled) {
    return (
      <div className="min-h-screen bg-vd-bg">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-28 text-center">
          <Heart className="w-14 h-14 mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-vd-text-heading">Donations unavailable</h1>
          <p className="text-sm text-vd-text-sub mt-2">This feature is temporarily disabled. Please check back later.</p>
          <Link href="/" className="inline-block mt-6 text-vd-primary font-semibold text-sm">← Home</Link>
        </div>
      </div>
    );
  }

  const stats = config.stats || {};

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-vd-primary bg-vd-accent-soft px-3 py-1 rounded-full mb-4">
            <Heart className="w-3.5 h-3.5 fill-vd-primary" /> 100% transparent
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-vd-text-heading">{config.title}</h1>
          <p className="text-vd-text-sub text-sm sm:text-base mt-3 max-w-2xl mx-auto leading-relaxed">
            {config.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { label: 'Total received', value: stats.totalReceived, icon: TrendingUp, color: 'text-green-600' },
            { label: 'Used for weddings', value: stats.totalSpent, icon: TrendingDown, color: 'text-amber-600' },
            { label: 'Available balance', value: stats.balance, icon: Wallet, color: 'text-vd-primary' },
            { label: 'Donors', value: stats.donorCount, icon: Users, color: 'text-blue-600', isCount: true },
          ].map((s) => (
            <div key={s.label} className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl border border-vd-border p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
              <p className="text-lg font-bold text-vd-text-heading">
                {s.isCount ? s.value : formatINR(s.value || 0)}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-vd-text-light mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {config.campaigns?.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-vd-text-heading mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-vd-primary" /> Members needing support
            </h2>
            <div className="space-y-3">
              <label className={`block p-4 rounded-2xl border cursor-pointer transition-all ${!campaignId ? 'border-vd-primary bg-vd-accent-soft/50' : 'border-vd-border'}`}>
                <input type="radio" name="camp" className="sr-only" checked={!campaignId} onChange={() => setCampaignId('')} />
                <span className="font-semibold text-sm">General wedding support fund</span>
              </label>
              {config.campaigns.map((c) => (
                <label
                  key={c.id}
                  className={`block p-4 rounded-2xl border cursor-pointer transition-all ${campaignId === c.id ? 'border-vd-primary bg-vd-accent-soft/50' : 'border-vd-border'}`}
                >
                  <input
                    type="radio"
                    name="camp"
                    className="sr-only"
                    checked={campaignId === c.id}
                    onChange={() => setCampaignId(c.id)}
                  />
                  <p className="font-semibold text-vd-text-heading">{c.title}</p>
                  {c.beneficiaryNote && <p className="text-xs text-vd-text-sub mt-1">{c.beneficiaryNote}</p>}
                  {c.story && <p className="text-sm text-vd-text-sub mt-2 line-clamp-3">{c.story}</p>}
                  <p className="text-xs text-vd-primary font-semibold mt-2">
                    Raised {formatINR(c.raisedAmount || 0)}
                    {c.goalAmount ? ` / ${formatINR(c.goalAmount)} goal` : ''}
                  </p>
                </label>
              ))}
            </div>
          </section>
        )}

        <div className="bg-vd-bg-section dark:bg-vd-bg-card rounded-3xl border border-vd-border p-6 sm:p-8 shadow-sm mb-10">
          <h2 className="text-lg font-bold text-vd-text-heading mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-vd-primary" /> Donate now (live payment)
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { setAmount(p); setCustomAmount(''); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  amount === p && !customAmount
                    ? 'vd-gradient-gold text-white border-transparent'
                    : 'border-vd-border text-vd-text-sub hover:border-vd-primary'
                }`}
              >
                ₹{p.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={10}
            placeholder="Custom amount (₹)"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-xl border border-vd-border bg-vd-bg text-sm focus:outline-none focus:border-vd-primary"
          />
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <input
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Your name *"
              className="px-4 py-3 rounded-xl border border-vd-border bg-vd-bg text-sm focus:outline-none focus:border-vd-primary"
            />
            <input
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder="Email for receipt *"
              className="px-4 py-3 rounded-xl border border-vd-border bg-vd-bg text-sm focus:outline-none focus:border-vd-primary"
            />
            <input
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="px-4 py-3 rounded-xl border border-vd-border bg-vd-bg text-sm focus:outline-none focus:border-vd-primary sm:col-span-2"
            />
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Message of support (optional)"
            className="w-full mb-4 px-4 py-3 rounded-xl border border-vd-border bg-vd-bg text-sm resize-none focus:outline-none focus:border-vd-primary"
          />
          <label className="flex items-center gap-2 text-sm text-vd-text-sub mb-6 cursor-pointer">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded" />
            Show as anonymous on public donor list
          </label>
          <button
            type="button"
            onClick={donate}
            disabled={paying || !sdkReady}
            className="w-full py-4 vd-gradient-gold text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg"
          >
            {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5 fill-white" />}
            Donate {formatINR(finalAmount)} securely
          </button>
          <p className="text-xs text-vd-text-light text-center mt-3 flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5" /> Cashfree — UPI, cards, net banking
          </p>
        </div>

        <section className="mb-10 rounded-3xl border border-vd-border bg-vd-accent-soft/30 dark:bg-vd-accent/10 p-6">
          <h2 className="text-lg font-bold text-vd-text-heading mb-2 flex items-center gap-2">
            <Eye className="w-5 h-5 text-vd-primary" /> How your money is used
          </h2>
          <p className="text-sm text-vd-text-sub mb-4">{config.transparencyNote}</p>
          {expenditures.length === 0 ? (
            <p className="text-sm text-vd-text-light italic">No expenses published yet. Admin will update after fund utilization.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {expenditures.map((e) => (
                <div key={e.id} className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl border border-vd-border p-4">
                  <div className="flex justify-between gap-3 items-start">
                    <div>
                      <p className="font-semibold text-vd-text-heading text-sm">{e.title}</p>
                      <p className="text-xs text-vd-text-light mt-0.5">
                        {e.expenditureDate} · {categoryLabel(e.category)}
                        {e.campaignTitle ? ` · ${e.campaignTitle}` : ''}
                      </p>
                    </div>
                    <p className="font-bold text-vd-primary whitespace-nowrap">{formatINR(e.amount)}</p>
                  </div>
                  <p className="text-sm text-vd-text-sub mt-2">{e.description}</p>
                  {e.receiptNote && <p className="text-xs text-vd-text-light mt-1">Note: {e.receiptNote}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {session && myDonations?.donations?.length > 0 && (
          <section className="rounded-3xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card p-6">
            <h2 className="text-lg font-bold text-vd-text-heading mb-2">Your contributions</h2>
            <p className="text-sm text-vd-text-sub mb-4">
              You donated <strong>{formatINR(myDonations.myTotal)}</strong> total. Below are your payments — fund usage is shown above for full transparency.
            </p>
            <div className="space-y-2">
              {myDonations.donations.map((d) => (
                <div key={d.id} className="flex justify-between items-center py-2 border-b border-vd-border last:border-0 text-sm">
                  <span>
                    {formatINR(d.amount)} · {d.paidAt ? new Date(d.paidAt).toLocaleDateString('en-IN') : '—'}
                    {d.campaignTitle ? ` · ${d.campaignTitle}` : ''}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
