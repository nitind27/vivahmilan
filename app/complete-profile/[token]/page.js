'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Mail, Loader2, AlertCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import SiteLoader from '@/components/SiteLoader';

function CompleteProfileInner() {
  const { token } = useParams();
  const router = useRouter();
  const [phase, setPhase] = useState('loading');
  const [userName, setUserName] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/profile-complete/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setErrorMsg(data.error);
          setPhase('error');
          return;
        }
        setUserName(data.userName || 'Member');
        setMaskedEmail(data.maskedEmail || '');
        if (data.emailVerified && data.onboardingUrl) {
          router.replace(data.onboardingUrl);
          return;
        }
        setPhase('verify');
      })
      .catch(() => {
        setErrorMsg('Could not load this link');
        setPhase('error');
      });
  }, [token]);

  const verify = async () => {
    if (!emailInput.trim()) {
      toast.error('Enter your email address');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(`/api/profile-complete/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Verification failed');
        return;
      }
      toast.success('Verified! Opening your profile form…');
      router.replace(data.onboardingUrl);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setVerifying(false);
    }
  };

  if (phase === 'loading') {
    return <SiteLoader message="Loading secure link…" size="lg" />;
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vd-bg px-4">
        <div className="max-w-md w-full bg-vd-bg-section rounded-3xl border border-vd-border p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-vd-text-heading mb-2">Link not available</h1>
          <p className="text-sm text-vd-text-sub mb-6">{errorMsg}</p>
          <Link href="/login" className="text-vd-primary text-sm font-semibold hover:underline">Go to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vd-bg px-4 py-10">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 vd-gradient-gold rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-xl font-bold vd-gradient-text">Milan</span>
          </Link>
          <h1 className="text-2xl font-bold text-vd-text-heading">Complete your profile</h1>
          <p className="text-vd-text-sub text-sm mt-2">
            Hi <strong>{userName}</strong> — verify your email to continue
          </p>
        </div>

        <div className="bg-vd-bg-section rounded-3xl border border-vd-border p-6 shadow-lg">
          <div className="flex items-start gap-3 p-4 bg-vd-accent-soft/30 rounded-2xl mb-5">
            <Shield className="w-5 h-5 text-vd-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-vd-text-sub leading-relaxed">
              For your security, enter the <strong>same email</strong> where you received this link
              {maskedEmail ? <> (e.g. <strong>{maskedEmail}</strong>)</> : null}.
              Only then can you upload photos and documents.
            </p>
          </div>

          <label className="block text-xs font-semibold text-vd-text-light uppercase tracking-wide mb-1.5">
            Your email address
          </label>
          <div className="relative mb-4">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light" />
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
              placeholder="you@email.com"
              autoComplete="email"
              className="w-full pl-10 pr-4 py-3 border border-vd-border rounded-2xl bg-vd-bg text-sm focus:outline-none focus:border-vd-primary"
            />
          </div>

          <button
            type="button"
            onClick={verify}
            disabled={verifying}
            className="w-full flex items-center justify-center gap-2 vd-gradient-gold text-white py-3 rounded-2xl text-sm font-semibold disabled:opacity-60"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Verify & continue →
          </button>
        </div>

        <p className="text-center text-xs text-vd-text-light mt-6">
          Wrong email? Open the link from the inbox where you received the invite.
        </p>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<SiteLoader message="Loading…" size="lg" />}>
      <CompleteProfileInner />
    </Suspense>
  );
}
