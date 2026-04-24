'use client';
import { useEffect } from 'react';

export default function MaintenancePage() {
  useEffect(() => {
    document.documentElement.style.background = '#0D0A0A';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.background = '#0D0A0A';
    document.body.style.color = '#F5E6D3';
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    return () => {
      document.documentElement.style.background = '';
      document.documentElement.style.overflow = '';
      document.body.style.background = '';
      document.body.style.color = '';
      document.body.style.overflow = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        #maint-root *,
        #maint-root *::before,
        #maint-root *::after {
          box-sizing: border-box !important;
        
          font-family: 'Inter', sans-serif !important;
        }

        #maint-root {
          background: #0D0A0A !important;
          position: fixed !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 9999 !important;
          overflow: hidden !important;
          padding: 24px !important;
        }

        .m-glow {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 65% 50% at 10% 10%, rgba(212,175,55,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 55% 45% at 90% 85%, rgba(183,110,121,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 45% 40% at 50% 50%, rgba(200,164,92,0.06) 0%, transparent 70%);
        }

        .m-orb {
          position: fixed; border-radius: 50%; filter: blur(70px);
          pointer-events: none; z-index: 0; animation: m-drift ease-in-out infinite;
        }
        .m-orb-1 { width: 350px; height: 350px; background: rgba(212,175,55,0.09); top: -100px; left: -100px; animation-duration: 16s; }
        .m-orb-2 { width: 280px; height: 280px; background: rgba(183,110,121,0.1); bottom: -80px; right: -80px; animation-duration: 20s; animation-delay: -7s; }
        .m-orb-3 { width: 200px; height: 200px; background: rgba(230,201,122,0.07); top: 45%; left: 65%; animation-duration: 24s; animation-delay: -12s; }

        @keyframes m-drift {
          0%, 100% { transform: translate(0,0) scale(1); }
          33%       { transform: translate(18px,-18px) scale(1.04); }
          66%       { transform: translate(-14px,14px) scale(0.97); }
        }

        .m-logo {
          position: relative; z-index: 10;
          display: flex !important; align-items: center !important; gap: 10px !important;
          margin-bottom: 36px !important;
        }
        .m-logo-icon {
          width: 44px !important; height: 44px !important;
          background: linear-gradient(135deg, #C8A45C, #E6C97A) !important;
          border-radius: 12px !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
          box-shadow: 0 4px 20px rgba(212,175,55,0.35) !important;
          flex-shrink: 0 !important;
        }
        .m-logo-text {
          font-size: 22px !important; font-weight: 700 !important;
          background: linear-gradient(135deg, #D4AF37, #E6C97A) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          color: transparent !important;
        }

        .m-card {
          position: relative; z-index: 10;
          background: #1C1515 !important;
          border: 1px solid rgba(212,175,55,0.18) !important;
          border-radius: 28px !important;
          padding: 48px 44px !important;
          max-width: 520px !important; width: 100% !important;
          text-align: center !important;
          box-shadow: 0 0 0 1px rgba(212,175,55,0.08), 0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,175,55,0.1) !important;
        }

        .m-icon-wrap {
          width: 88px !important; height: 88px !important;
          margin: 0 auto 24px !important; border-radius: 50% !important;
          background: linear-gradient(135deg, rgba(212,175,55,0.14), rgba(183,110,121,0.12)) !important;
          border: 1.5px solid rgba(212,175,55,0.28) !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
          animation: m-pulse 2.8s ease-in-out infinite !important;
        }
        @keyframes m-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.35); }
          50%       { box-shadow: 0 0 0 14px rgba(212,175,55,0); }
        }
        .m-gear {
          width: 36px !important; height: 36px !important; color: #D4AF37 !important;
          animation: m-spin 7s linear infinite !important;
        }
        @keyframes m-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .m-badge {
          display: inline-flex !important; align-items: center !important; gap: 7px !important;
          background: rgba(212,175,55,0.1) !important;
          border: 1px solid rgba(212,175,55,0.28) !important;
          border-radius: 100px !important; padding: 5px 16px !important;
          font-size: 11px !important; font-weight: 600 !important;
          letter-spacing: 0.08em !important; text-transform: uppercase !important;
          color: #D4AF37 !important; margin-bottom: 20px !important;
        }
        .m-dot {
          width: 6px !important; height: 6px !important; border-radius: 50% !important;
          background: #D4AF37 !important; flex-shrink: 0 !important;
          animation: m-blink 1.6s ease-in-out infinite !important;
        }
        @keyframes m-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }

        .m-h1 {
          font-size: 32px !important; font-weight: 700 !important;
          color: #F5E6D3 !important;
          line-height: 1.2 !important; margin-bottom: 12px !important;
          letter-spacing: -0.02em !important;
        }
        .m-h1 span {
          background: linear-gradient(135deg, #D4AF37, #E6C97A) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
        }
        .m-sub {
          font-size: 15px !important; color: #C8B8B8 !important;
          line-height: 1.75 !important; margin-bottom: 32px !important;
        }

        .m-progress {
          width: 100% !important; height: 3px !important;
          background: rgba(212,175,55,0.12) !important;
          border-radius: 100px !important; overflow: hidden !important;
          margin-bottom: 32px !important;
        }
        .m-bar {
          height: 100% !important; width: 65% !important;
          background: linear-gradient(90deg, #C8A45C, #E6C97A, #C8A45C) !important;
          background-size: 200% 100% !important;
          border-radius: 100px !important;
          animation: m-shimmer 2.2s linear infinite !important;
        }
        @keyframes m-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .m-steps {
          display: flex !important; flex-direction: column !important;
          gap: 10px !important; text-align: left !important; margin-bottom: 32px !important;
        }
        .m-step {
          display: flex !important; align-items: center !important; gap: 14px !important;
          padding: 12px 16px !important;
          background: rgba(212,175,55,0.05) !important;
          border: 1px solid rgba(212,175,55,0.12) !important;
          border-radius: 14px !important;
        }
        .m-num {
          width: 28px !important; height: 28px !important;
          border-radius: 50% !important; flex-shrink: 0 !important;
          background: linear-gradient(135deg, #C8A45C, #E6C97A) !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
          font-size: 12px !important; font-weight: 700 !important; color: #1C1515 !important;
          box-shadow: 0 2px 8px rgba(212,175,55,0.3) !important;
        }
        .m-step-txt { font-size: 13px !important; color: #C8B8B8 !important; line-height: 1.5 !important; }

        .m-divider {
          height: 1px !important;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.22), transparent) !important;
          margin: 28px 0 !important;
        }
        .m-footer { font-size: 13px !important; color: #8A7A7A !important; }
        .m-footer a { color: #D4AF37 !important; font-weight: 600 !important; text-decoration: none !important; }

        @media (max-width: 480px) {
          .m-card { padding: 32px 20px !important; }
          .m-h1 { font-size: 24px !important; }
        }
      `}</style>

      <div id="maint-root">
        <div className="m-glow" />
        <div className="m-orb m-orb-1" />
        <div className="m-orb m-orb-2" />
        <div className="m-orb m-orb-3" />

        {/* Logo */}
       

        <div className="m-card">
          <div className="m-icon-wrap">
            <svg className="m-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
              <path d="M19.622 10.395l-1.097-2.65L20 6l-2-2-1.735 1.483-2.707-1.113L12.935 2h-1.954l-.632 2.401-2.645 1.115L6 4 4 6l1.453 1.789-1.08 2.657L2 11v2l2.401.655L5.516 16.3 4 18l2 2 1.791-1.46 2.606 1.072L11 22h2l.604-2.387 2.651-1.098C16.697 19.48 18 20 18 20l2-2-1.484-1.75 1.106-2.648L22 13v-2l-2.378-.605Z"/>
            </svg>
          </div>

          <div className="m-badge"><span className="m-dot" /> Under Maintenance</div>

          <h1 className="m-h1">We&apos;ll be back <span>shortly</span></h1>

          <p className="m-sub">
            We&apos;re making some improvements to give you a better experience.
            Our team is working hard and the site will be back online very soon.
          </p>

          <div className="m-progress"><div className="m-bar" /></div>

          <div className="m-steps">
            <div className="m-step"><div className="m-num">1</div><span className="m-step-txt">Upgrading systems for better performance</span></div>
            <div className="m-step"><div className="m-num">2</div><span className="m-step-txt">Applying security patches and updates</span></div>
            <div className="m-step"><div className="m-num">3</div><span className="m-step-txt">Running final checks before going live</span></div>
          </div>

          <div className="m-divider" />

          <p className="m-footer">
            Questions? <a href="mailto:supportvivahdwar@gmail.com">supportvivahdwar@gmail.com</a>
          </p>
        </div>
      </div>
    </>
  );
}
