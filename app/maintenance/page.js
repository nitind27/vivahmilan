export const metadata = {
  title: 'Under Maintenance | Vivah Dwar',
  description: 'We are currently under maintenance. Please check back soon.',
};

export default function MaintenancePage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Inter', sans-serif;
            background: #0f0a1e;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          .bg-glow {
            position: fixed;
            inset: 0;
            z-index: 0;
            background:
              radial-gradient(ellipse 80% 60% at 20% 20%, rgba(139, 92, 246, 0.18) 0%, transparent 60%),
              radial-gradient(ellipse 60% 50% at 80% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
          }

          .particles {
            position: fixed;
            inset: 0;
            z-index: 0;
            overflow: hidden;
          }

          .particle {
            position: absolute;
            border-radius: 50%;
            background: rgba(139, 92, 246, 0.4);
            animation: float linear infinite;
          }

          @keyframes float {
            0%   { transform: translateY(110vh) scale(0); opacity: 0; }
            10%  { opacity: 1; }
            90%  { opacity: 0.6; }
            100% { transform: translateY(-10vh) scale(1); opacity: 0; }
          }

          .card {
            position: relative;
            z-index: 10;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 56px 48px;
            max-width: 520px;
            width: 90%;
            text-align: center;
            backdrop-filter: blur(20px);
            box-shadow:
              0 0 0 1px rgba(139, 92, 246, 0.15),
              0 32px 64px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          .icon-wrap {
            width: 88px;
            height: 88px;
            margin: 0 auto 28px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(236, 72, 153, 0.2));
            border: 1px solid rgba(139, 92, 246, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse-ring 2.5s ease-in-out infinite;
          }

          @keyframes pulse-ring {
            0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
            50%       { box-shadow: 0 0 0 16px rgba(139, 92, 246, 0); }
          }

          .icon-wrap svg {
            width: 40px;
            height: 40px;
            color: #a78bfa;
            animation: spin-slow 6s linear infinite;
          }

          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }

          .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(139, 92, 246, 0.15);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 100px;
            padding: 4px 14px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #c4b5fd;
            margin-bottom: 20px;
          }

          .badge-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #a78bfa;
            animation: blink 1.4s ease-in-out infinite;
          }

          @keyframes blink {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.2; }
          }

          h1 {
            font-size: 32px;
            font-weight: 700;
            color: #f1f0ff;
            line-height: 1.2;
            margin-bottom: 14px;
            letter-spacing: -0.02em;
          }

          h1 span {
            background: linear-gradient(135deg, #a78bfa, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          p {
            font-size: 15px;
            color: rgba(255, 255, 255, 0.5);
            line-height: 1.7;
            margin-bottom: 36px;
          }

          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent);
            margin: 32px 0;
          }

          .steps {
            display: flex;
            flex-direction: column;
            gap: 12px;
            text-align: left;
            margin-bottom: 36px;
          }

          .step {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
          }

          .step-num {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(135deg, #7c3aed, #db2777);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            color: white;
            flex-shrink: 0;
          }

          .step-text {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
          }

          .footer-text {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.3);
            margin-bottom: 0;
          }

          .footer-text strong {
            color: #a78bfa;
            font-weight: 600;
          }

          @media (max-width: 480px) {
            .card { padding: 40px 24px; }
            h1 { font-size: 26px; }
          }
        `}</style>
      </head>
      <body>
        <div className="bg-glow" />

        {/* Floating particles */}
        <div className="particles">
          {[
            { left: '10%', size: 4, duration: '12s', delay: '0s' },
            { left: '25%', size: 6, duration: '18s', delay: '3s' },
            { left: '40%', size: 3, duration: '14s', delay: '6s' },
            { left: '55%', size: 5, duration: '20s', delay: '1s' },
            { left: '70%', size: 4, duration: '16s', delay: '8s' },
            { left: '85%', size: 7, duration: '22s', delay: '4s' },
            { left: '15%', size: 3, duration: '15s', delay: '10s' },
            { left: '60%', size: 5, duration: '19s', delay: '7s' },
          ].map((p, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                animationDuration: p.duration,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>

        <div className="card">
          {/* Gear icon */}
          <div className="icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
              <path d="M19.622 10.395l-1.097-2.65L20 6l-2-2-1.735 1.483-2.707-1.113L12.935 2h-1.954l-.632 2.401-2.645 1.115L6 4 4 6l1.453 1.789-1.08 2.657L2 11v2l2.401.655L5.516 16.3 4 18l2 2 1.791-1.46 2.606 1.072L11 22h2l.604-2.387 2.651-1.098C16.697 19.48 18 20 18 20l2-2-1.484-1.75 1.106-2.648L22 13v-2l-2.378-.605Z"/>
            </svg>
          </div>

          <div className="badge">
            <span className="badge-dot" />
            Under Maintenance
          </div>

          <h1>We&apos;ll be back <span>shortly</span></h1>

          <p>
            We&apos;re currently performing scheduled maintenance to improve your experience.
            The site will be back online very soon.
          </p>

          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <span className="step-text">Upgrading our systems for better performance</span>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <span className="step-text">Applying security patches and updates</span>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <span className="step-text">Running final checks before going live</span>
            </div>
          </div>

          <div className="divider" />

          <p className="footer-text">
            Questions? Contact us at <strong>support@vivahdwar.com</strong>
          </p>
        </div>
      </body>
    </html>
  );
}
