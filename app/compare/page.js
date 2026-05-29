'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SmartImage from '@/components/SmartImage';
import { SiteLoaderInline } from '@/components/SiteLoader';
import { Scale, ChevronRight, User } from 'lucide-react';
import { differenceInYears } from 'date-fns';

function CompareInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const ids = searchParams.get('ids') || '';

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !ids) { setLoading(false); return; }
    fetch(`/api/compare?ids=${encodeURIComponent(ids)}`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false));
  }, [status, ids]);

  if (loading) {
    return <SiteLoaderInline message="Loading comparison…" className="pt-32" />;
  }

  if (!ids || !data?.profiles?.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-12 text-center">
        <Scale className="w-12 h-12 text-vd-primary mx-auto mb-4" />
        <h1 className="text-xl font-bold text-vd-text-heading mb-2">Compare Profiles</h1>
        <p className="text-sm text-vd-text-light mb-6">Select 2–3 profiles from your shortlist to compare side by side.</p>
        <Link href="/shortlist" className="vd-gradient-gold text-white px-6 py-2.5 rounded-xl text-sm font-semibold">Go to Shortlist</Link>
      </div>
    );
  }

  const rows = [
    { key: 'age', label: 'Age', fn: p => p.profile?.dob ? differenceInYears(new Date(), new Date(p.profile.dob)) : '—' },
    { key: 'city', label: 'City', fn: p => p.profile?.city || '—' },
    { key: 'religion', label: 'Religion', fn: p => p.profile?.religion || '—' },
    { key: 'education', label: 'Education', fn: p => p.profile?.education || '—' },
    { key: 'profession', label: 'Profession', fn: p => p.profile?.profession || '—' },
    { key: 'height', label: 'Height', fn: p => p.profile?.height ? `${p.profile.height} cm` : '—' },
    { key: 'marital', label: 'Marital', fn: p => (p.profile?.maritalStatus || '—').replace(/_/g, ' ') },
    { key: 'complete', label: 'Profile %', fn: p => `${p.profile?.profileComplete || 0}%` },
    { key: 'rashi', label: 'Rashi', fn: p => p.kundali?.rashi || '—' },
    { key: 'nakshatra', label: 'Nakshatra', fn: p => p.kundali?.nakshatra || '—' },
    { key: 'manglik', label: 'Manglik', fn: p => p.kundali ? (p.kundali.manglik ? 'Yes' : 'No') : '—' },
    { key: 'guna', label: 'Guna Milan', fn: p => p.gunaMatch ? `${p.gunaMatch.totalGunas}/${p.gunaMatch.maxGunas}` : '—' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
      <div className="flex items-center gap-2 text-sm text-vd-text-light mb-6">
        <Link href="/dashboard" className="hover:text-vd-primary">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/shortlist" className="hover:text-vd-primary">Shortlist</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-vd-primary font-medium">Compare</span>
      </div>

      <h1 className="text-2xl font-bold text-vd-text-heading flex items-center gap-2 mb-6">
        <Scale className="w-6 h-6 text-vd-primary" /> Profile Comparison
      </h1>

      <div className="overflow-x-auto rounded-2xl border border-vd-border bg-vd-bg-section shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-vd-border bg-vd-accent-soft/50">
              <th className="text-left p-4 font-semibold text-vd-text-light w-36">Attribute</th>
              {data.profiles.map(p => (
                <th key={p.id} className="p-4 text-center min-w-[160px]">
                  <Link href={`/profile/${p.id}`} className="group">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-2 bg-vd-accent-soft">
                      {p.photo ? (
                        <SmartImage src={p.photo} alt={p.name} width={64} height={64} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center vd-gradient-gold text-white font-bold text-xl">
                          {p.name?.[0] || <User className="w-6 h-6" />}
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-vd-text-heading group-hover:text-vd-primary truncate">{p.name}</p>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.key} className={i % 2 === 0 ? 'bg-vd-bg-section' : 'bg-vd-bg-alt/50'}>
                <td className="p-4 font-medium text-vd-text-light border-r border-vd-border">{row.label}</td>
                {data.profiles.map(p => (
                  <td key={p.id} className="p-4 text-center text-vd-text-heading font-medium">{row.fn(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <Suspense fallback={<SiteLoaderInline message="Loading…" className="pt-32" />}>
        <CompareInner />
      </Suspense>
    </div>
  );
}
