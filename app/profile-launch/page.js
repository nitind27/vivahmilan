'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession, getSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Bell, Phone, Mail, LogOut, Heart, ShieldCheck, Loader2, CheckCircle2, Clock
} from 'lucide-react';
import SiteLoader from '@/components/SiteLoader';
import { SITE_CONTACT } from '@/lib/siteContact';

const FALLBACK = {
  title: 'Your Profile Will Be Live Soon',
  subtitle: 'Congratulations! Your registration has been verified.',
  body:
    'We are putting the final touches on your profile. Very soon you will be able to view your complete profile, explore matches, and use all features.',
  updateNote: 'When your access is enabled, you will receive an update via email or SMS.',
  supportNote: 'If you face any issue, please contact us using the phone number or email below.',
  steps: [
    { label: 'Registration complete', done: true },
    { label: 'Verified by admin', done: true },
    { label: 'Profile launching very soon', done: false, active: true },
    { label: 'You will receive an update', done: false },
  ],
};

function normalizeLaunchMessage(raw) {
  if (!raw || typeof raw !== 'object') return FALLBACK;
  return {
    title: raw.title || raw.titleEn || raw.titleHi || FALLBACK.title,
    subtitle: raw.subtitle || raw.subtitleEn || raw.subtitleHi || FALLBACK.subtitle,
    body: raw.body || raw.bodyEn || raw.bodyHi || FALLBACK.body,
    updateNote: raw.updateNote || raw.updateNoteEn || raw.updateNoteHi || FALLBACK.updateNote,
    supportNote: raw.supportNote || raw.supportNoteEn || raw.supportNoteHi || FALLBACK.supportNote,
    steps: Array.isArray(raw.steps)
      ? raw.steps.map((s) => ({
          label: s.label || s.en || s.hi || '',
          done: !!s.done,
          active: !!s.active,
        }))
      : FALLBACK.steps,
  };
}

const FALLBACK_CONTACT = SITE_CONTACT;

function formatPhone(contact) {
  const raw = String(contact?.phone || '8735995467').replace(/\D/g, '');
  const ten = raw.length > 10 ? raw.slice(-10) : raw;
  return {
    tel: `+91${ten}`,
    display: contact?.phoneDisplay || `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`,
    plain: ten,
  };
}

export default function ProfileLaunchPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [checking, setChecking] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);
  const [sessionFound, setSessionFound] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/portal-access');
      const json = await res.json();
      if (json.granted) {
        await update().catch(() => {});
        router.replace('/dashboard');
        return;
      }
      setData(json);
    } catch {
      setData({ message: FALLBACK, contact: FALLBACK_CONTACT });
    } finally {
      setChecking(false);
    }
  }, [router, update]);

  useEffect(() => {
    document.documentElement.style.background = '#0D0A0A';
    document.documentElement.style.overflow = 'auto';
    document.body.style.background = '#0D0A0A';
    document.body.style.color = '#F5E6D3';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    return () => {
      document.documentElement.style.background = '';
      document.documentElement.style.overflow = '';
      document.body.style.background = '';
      document.body.style.color = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, []);

  // OAuth redirect: session cookie may arrive before useSession updates — poll getSession
  useEffect(() => {
    if (status === 'authenticated') {
      setSessionFound(true);
      setAuthResolved(true);
      return;
    }
    if (status === 'loading') return;

    let cancelled = false;
    (async () => {
      for (let i = 0; i < 30; i++) {
        const s = await getSession();
        if (s?.user?.id) {
          if (!cancelled) {
            setSessionFound(true);
            setAuthResolved(true);
            router.refresh();
          }
          return;
        }
        await new Promise(r => setTimeout(r, 200));
      }
      if (!cancelled) setAuthResolved(true);
    })();

    return () => { cancelled = true; };
  }, [status]);

  useEffect(() => {
    if (!authResolved) return;
    if (!sessionFound && status !== 'authenticated') {
      router.replace('/login');
      return;
    }
    if (status === 'authenticated' || sessionFound) {
      if (session?.user?.role === 'ADMIN') {
        router.replace('/admin');
        return;
      }
      loadStatus();
      const id = setInterval(loadStatus, 30000);
      return () => clearInterval(id);
    }
  }, [authResolved, sessionFound, status, session, router, loadStatus]);

  if (!authResolved || status === 'loading' || checking) {
    return <SiteLoader message="Loading…" />;
  }

  const msg = normalizeLaunchMessage({ ...FALLBACK, ...(data?.message || {}) });
  const contact = data?.contact || FALLBACK_CONTACT;
  const phone = formatPhone(contact);
  const firstName = (session?.user?.name || 'Member').split(' ')[0];
  const steps = msg.steps?.length ? msg.steps : FALLBACK.steps;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        #pl-root, #pl-root * { box-sizing: border-box; font-family: 'Inter', sans-serif; }

        #pl-root {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          background: #0D0A0A;
          color: #F5E6D3;
          display: flex;
          flex-direction: column;
        }

        .pl-glow {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 70% 55% at 0% 0%, rgba(212,175,55,0.14) 0%, transparent 55%),
            radial-gradient(ellipse 60% 50% at 100% 100%, rgba(183,110,121,0.12) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 40%, rgba(200,164,92,0.06) 0%, transparent 70%);
        }

        .pl-header {
          position: relative; z-index: 2;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(212,175,55,0.12);
          background: rgba(13,10,10,0.85);
          backdrop-filter: blur(12px);
        }

        .pl-logo { display: flex; align-items: center; gap: 12px; }
        .pl-logo-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg, #C8A45C, #E6C97A);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(212,175,55,0.35);
        }
        .pl-logo-text {
          font-size: 20px; font-weight: 700;
          background: linear-gradient(135deg, #D4AF37, #E6C97A);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .pl-logo-sub { font-size: 11px; color: rgba(245,230,211,0.45); margin-top: 2px; }

        .pl-logout {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 16px; border-radius: 12px;
          border: 1px solid rgba(245,230,211,0.12);
          background: transparent; color: rgba(245,230,211,0.6);
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.2s;
        }
        .pl-logout:hover { border-color: rgba(212,175,55,0.35); color: #E6C97A; background: rgba(212,175,55,0.08); }

        .pl-main {
          position: relative; z-index: 1;
          flex: 1; width: 100%; max-width: 900px;
          margin: 0 auto; padding: 32px 20px 48px;
        }

        .pl-badge-row {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          margin-bottom: 28px; flex-wrap: wrap;
        }
        .pl-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 999px;
          background: rgba(16,185,129,0.12); border: 1px solid rgba(52,211,153,0.35);
          color: #6EE7B7; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
        }

        .pl-hero { text-align: center; margin-bottom: 40px; }
        .pl-title-hi {
          font-size: clamp(26px, 6vw, 38px); font-weight: 700; line-height: 1.25;
          color: #F5E6D3; margin: 0 0 10px;
        }
        .pl-title-en {
          font-size: clamp(15px, 3.5vw, 18px); font-weight: 500;
          color: rgba(212,175,55,0.75); margin: 0 0 24px;
        }
        .pl-greet {
          display: inline-block; padding: 14px 22px; border-radius: 16px;
          background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.15);
          max-width: 100%;
        }
        .pl-greet-hi { font-size: 16px; color: #F5E6D3; margin: 0 0 6px; line-height: 1.5; }
        .pl-greet-en { font-size: 14px; color: rgba(245,230,211,0.55); margin: 0; line-height: 1.5; }
        .pl-name { color: #E6C97A; font-weight: 700; }

        .pl-section {
          width: 100%; margin-bottom: 28px;
          padding: 24px 0;
          border-top: 1px solid rgba(212,175,55,0.1);
        }
        .pl-section-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(212,175,55,0.55);
          margin-bottom: 20px; text-align: center;
        }

        .pl-steps { display: flex; flex-direction: column; gap: 0; width: 100%; }
        .pl-step {
          display: grid; grid-template-columns: 48px 1fr;
          gap: 16px; padding: 18px 0;
          border-bottom: 1px solid rgba(245,230,211,0.06);
        }
        .pl-step:last-child { border-bottom: none; }
        .pl-step-icon {
          width: 48px; height: 48px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .pl-step-icon.done { background: rgba(16,185,129,0.15); color: #34D399; }
        .pl-step-icon.active { background: rgba(212,175,55,0.15); color: #D4AF37; border: 1px solid rgba(212,175,55,0.35); }
        .pl-step-icon.pending { background: rgba(245,230,211,0.04); color: rgba(245,230,211,0.25); }
        .pl-step-hi { font-size: 15px; font-weight: 600; color: #F5E6D3; margin: 0 0 4px; line-height: 1.4; }
        .pl-step-en { font-size: 13px; color: rgba(245,230,211,0.45); margin: 0; line-height: 1.4; }
        .pl-step-hi.active { color: #E6C97A; }

        .pl-message-block { margin-bottom: 20px; }
        .pl-msg-hi {
          font-size: 16px; line-height: 1.75; color: rgba(245,230,211,0.92);
          margin: 0 0 8px; text-align: center;
        }
        .pl-msg-en {
          font-size: 14px; line-height: 1.7; color: rgba(245,230,211,0.5);
          margin: 0; text-align: center; font-style: italic;
        }
        .pl-divider {
          width: 60px; height: 2px; margin: 24px auto;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent);
        }

        .pl-contact-wrap { width: 100%; }
        .pl-contact-intro-hi {
          text-align: center; font-size: 15px; color: rgba(245,230,211,0.85);
          margin: 0 0 6px; line-height: 1.6;
        }
        .pl-contact-intro-en {
          text-align: center; font-size: 13px; color: rgba(245,230,211,0.45);
          margin: 0 0 28px; line-height: 1.6;
        }

        .pl-phone-block {
          width: 100%; text-align: center;
          padding: 28px 20px; margin-bottom: 16px;
          border-radius: 20px;
          background: linear-gradient(180deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%);
          border: 1px solid rgba(212,175,55,0.25);
        }
        .pl-phone-label-hi { font-size: 13px; color: rgba(245,230,211,0.6); margin: 0 0 4px; }
        .pl-phone-label-en { font-size: 11px; color: rgba(245,230,211,0.35); margin: 0 0 14px; text-transform: uppercase; letter-spacing: 0.08em; }
        .pl-phone-number {
          display: block; font-size: clamp(28px, 8vw, 36px); font-weight: 700;
          color: #E6C97A; letter-spacing: 0.04em; text-decoration: none;
          margin-bottom: 6px; word-break: break-word;
        }
        .pl-phone-sub { font-size: 14px; color: rgba(245,230,211,0.5); margin: 0; }
        .pl-call-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          margin-top: 18px; padding: 14px 32px; border-radius: 14px;
          background: linear-gradient(135deg, #C8A45C, #B8860B);
          color: #0D0A0A; font-size: 15px; font-weight: 700;
          text-decoration: none; box-shadow: 0 8px 24px rgba(212,175,55,0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .pl-call-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(212,175,55,0.4); }

        .pl-email-block {
          width: 100%; text-align: center;
          padding: 22px 20px;
          border-radius: 20px;
          background: rgba(183,110,121,0.08);
          border: 1px solid rgba(183,110,121,0.22);
        }
        .pl-email-label-hi { font-size: 13px; color: rgba(245,230,211,0.6); margin: 0 0 4px; }
        .pl-email-label-en { font-size: 11px; color: rgba(245,230,211,0.35); margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.08em; }
        .pl-email-link {
          display: inline-block; font-size: clamp(14px, 4vw, 17px); font-weight: 600;
          color: #F5E6D3; word-break: break-all; text-decoration: none;
          border-bottom: 1px dashed rgba(183,110,121,0.5); padding-bottom: 2px;
        }
        .pl-email-link:hover { color: #E6C97A; border-color: #E6C97A; }

        .pl-footer {
          position: relative; z-index: 2;
          text-align: center; padding: 24px 20px 32px;
          border-top: 1px solid rgba(212,175,55,0.1);
          background: rgba(13,10,10,0.9);
        }
        .pl-footer-hi { font-size: 12px; color: rgba(245,230,211,0.35); margin: 0 0 4px; }
        .pl-footer-en { font-size: 11px; color: rgba(245,230,211,0.25); margin: 0; }

        @media (min-width: 640px) {
          .pl-main { padding: 48px 32px 64px; }
          .pl-header { padding: 24px 32px; }
        }
      `}</style>

      <div id="pl-root">
        <div className="pl-glow" aria-hidden="true" />

        <header className="pl-header">
          <div className="pl-logo">
            <div className="pl-logo-icon">
              <Heart size={22} fill="#fff" color="#fff" strokeWidth={0} />
            </div>
            <div>
              <div className="pl-logo-text">Vivah Dwar</div>
              <div className="pl-logo-sub">Vivah Dwar · Matrimonial Platform</div>
            </div>
          </div>
          <button type="button" className="pl-logout" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </header>

        <main className="pl-main">
          <div className="pl-badge-row">
            <span className="pl-badge">
              <ShieldCheck size={16} />
              Verified Member
            </span>
          </div>

          <section className="pl-hero">
            <h1 className="pl-title-hi">{msg.title}</h1>
            <div className="pl-greet">
              <p className="pl-greet-en">
                Hello <span className="pl-name">{firstName}</span>! {msg.subtitle}
              </p>
            </div>
          </section>

          <section className="pl-section">
            <p className="pl-section-label">Your Progress</p>
            <div className="pl-steps">
              {steps.map((step, i) => {
                const Icon = step.done ? CheckCircle2 : step.active ? Loader2 : Bell;
                const state = step.done ? 'done' : step.active ? 'active' : 'pending';
                return (
                  <div key={i} className="pl-step">
                    <div className={`pl-step-icon ${state}`}>
                      <Icon size={22} className={step.active && !step.done ? 'animate-spin' : ''} />
                    </div>
                    <div>
                      <p className="pl-step-en">{step.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="pl-section">
            <p className="pl-section-label">Message</p>
            <div className="pl-message-block">
              <p className="pl-msg-en">{msg.body}</p>
            </div>
            <div className="pl-divider" />
            <div className="pl-message-block">
              <p className="pl-msg-en">{msg.updateNote}</p>
            </div>
          </section>

          <section className="pl-section pl-contact-wrap">
            <p className="pl-section-label">Contact Support</p>
            <p className="pl-contact-intro-en">{msg.supportNote}</p>

            <div className="pl-phone-block">
              <p className="pl-phone-label-en">Phone support — {SITE_CONTACT.supportHours || '24 hours'}</p>
              <a href={`tel:${phone.tel}`} className="pl-phone-number">
                {phone.display}
              </a>
              <p className="pl-phone-sub">{phone.plain} · India (+91)</p>
              <a href={`tel:${phone.tel}`} className="pl-call-btn">
                <Phone size={20} strokeWidth={2.5} />
                Call Now
              </a>
            </div>

            <div className="pl-email-block">
              <p className="pl-email-label-en">Email support</p>
              <a href={`mailto:${contact.email}`} className="pl-email-link">
                {contact.email}
              </a>
            </div>
          </section>
        </main>

        <footer className="pl-footer">
          <p className="pl-footer-en">
            This page will automatically redirect to your dashboard when your access is enabled.
          </p>
        </footer>
      </div>
    </>
  );
}
