'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileDown, Loader2, Scale, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const COLOR_MAP = {
  green: 'from-green-500 to-emerald-600',
  blue: 'from-blue-500 to-indigo-600',
  yellow: 'from-yellow-500 to-amber-500',
  orange: 'from-orange-500 to-red-500',
};

export default function KundaliMatchReport({ partnerId, partnerName }) {
  const [match, setMatch] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [lang, setLang] = useState('en');
  const [canPdf, setCanPdf] = useState(null);

  useEffect(() => {
    fetch('/api/features').then(r => r.ok ? r.json() : null).then(d => {
      setCanPdf(!!d?.access?.kundaliMatchPdf);
    }).catch(() => setCanPdf(false));
  }, []);

  useEffect(() => {
    if (!partnerId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/kundali/match?partnerId=${partnerId}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw data;
        setMatch(data);
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [partnerId]);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/kundali/match/pdf?partnerId=${partnerId}&lang=${lang}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.locked) {
          toast.error('Upgrade to premium for PDF download');
          return;
        }
        throw new Error(err.error || err.message || 'Download failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kundali-match-${partnerName || partnerId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF report downloaded');
    } catch (e) {
      toast.error(e.message || 'Could not download PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-vd-bg-section rounded-2xl border border-vd-border p-6 flex items-center justify-center gap-2 text-vd-text-light">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Calculating Guna Milan…</span>
      </div>
    );
  }

  if (error?.code === 'NO_SELF_KUNDALI') {
    return (
      <div className="bg-vd-bg-section rounded-2xl border border-vd-border p-6 text-center">
        <div className="text-3xl mb-2">⚖️</div>
        <p className="text-sm font-semibold text-vd-text-heading mb-1">Kundali Match Report</p>
        <p className="text-xs text-vd-text-light mb-4">Generate your kundali to see Guna Milan with {partnerName || 'this profile'}.</p>
        <Link href="/profile/edit" className="inline-block vd-gradient-gold text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90">
          Generate My Kundali
        </Link>
      </div>
    );
  }

  if (error?.code === 'NO_PARTNER_KUNDALI') return null;
  if (error) return null;
  if (!match) return null;

  const gradient = COLOR_MAP[match.color] || COLOR_MAP.blue;
  const t = lang === 'hi';

  return (
    <div className="bg-vd-bg-section rounded-2xl border border-vd-border overflow-hidden">
      <div className="px-5 py-4 border-b border-vd-border flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-vd-text-heading flex items-center gap-2">
          <Scale className="w-4 h-4 text-vd-primary" />
          {t ? 'कुंडली मिलान रिपोर्ट' : 'Kundali Match Report'}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex bg-vd-bg-alt rounded-lg p-0.5 border border-vd-border text-xs">
            <button onClick={() => setLang('en')} className={`px-2 py-0.5 rounded ${lang === 'en' ? 'bg-vd-primary text-white' : 'text-vd-text-light'}`}>EN</button>
            <button onClick={() => setLang('hi')} className={`px-2 py-0.5 rounded ${lang === 'hi' ? 'bg-vd-primary text-white' : 'text-vd-text-light'}`}>हि</button>
          </div>
          {canPdf === false ? (
            <Link href="/premium" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-yellow-600/40 bg-yellow-900/20 text-yellow-500 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" /> PDF — Premium
            </Link>
          ) : (
            <button
              onClick={downloadPdf}
              disabled={downloading || canPdf === null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl vd-gradient-gold text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              PDF
            </button>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className={`rounded-2xl bg-gradient-to-r ${gradient} p-5 text-white mb-4`}>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold tabular-nums">{match.totalGunas}<span className="text-xl opacity-80">/{match.maxGunas}</span></p>
              <p className="text-sm opacity-90 mt-1">{t ? 'कुल गुण' : 'Total Gunas'} · {match.percentage}%</p>
            </div>
            <p className="text-lg font-semibold text-right">{t ? match.verdictHi : match.verdict}</p>
          </div>
        </div>

        <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4 text-xs border ${
          match.manglik.compatible ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {match.manglik.compatible
            ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{match.manglik.note}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div className="bg-vd-bg-alt rounded-xl p-3 border border-vd-border">
            <p className="font-semibold text-vd-text-heading mb-1">{match.groom.name}</p>
            <p className="text-vd-text-light">{match.groom.rashi} · {match.groom.nakshatra}</p>
          </div>
          <div className="bg-vd-bg-alt rounded-xl p-3 border border-vd-border">
            <p className="font-semibold text-vd-text-heading mb-1">{match.bride.name}</p>
            <p className="text-vd-text-light">{match.bride.rashi} · {match.bride.nakshatra}</p>
          </div>
        </div>

        <p className="text-xs font-semibold text-vd-text-light uppercase tracking-wide mb-2">
          {t ? 'अष्टकूट विवरण' : 'Ashtakoot Breakdown'}
        </p>
        <div className="space-y-1.5">
          {Object.values(match.kootas).map((k) => (
            <div key={k.label} className="flex items-center justify-between rounded-lg px-3 py-2 bg-vd-bg-alt border border-vd-border text-xs">
              <span className="text-vd-text-heading font-medium">{t ? k.labelHi : k.label}</span>
              <span className="tabular-nums font-bold text-vd-primary">{k.points}/{k.max}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
