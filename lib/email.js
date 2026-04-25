import nodemailer from 'nodemailer';
import { join } from 'path';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: parseInt(process.env.EMAIL_SERVER_PORT || '587') === 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  family: 6, // Server has IPv6 connectivity to Gmail, IPv4 is ENETUNREACH
});

const FROM    = `Vivah Dwar 💕 <${process.env.EMAIL_SERVER_USER || 'noreply@vivahdwar.com'}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vivahdwar.com';
const YEAR    = new Date().getFullYear();

// CID attachment — logo is attached to the email itself, referenced via cid:logo
// This works in Gmail, Outlook, Apple Mail — no external URL needed
const LOGO_CID  = 'vivahdwar-logo@email';
const LOGO_PATH = join(process.cwd(), 'public', 'logo', 'logo-email.png');

// Attachment object reused in every sendMail call
const LOGO_ATTACHMENT = {
  filename   : 'logo.png',
  path       : LOGO_PATH,
  cid        : LOGO_CID,   // <img src="cid:vivahdwar-logo@email">
  contentDisposition: 'inline',
};

/* ─── colour palette (matches website) ─────────────────────────────────── */
const gold   = '#C8A45C';
const goldD  = '#A07840';
const bg     = '#1C0F0A';
const card   = '#231510';
const sect   = '#2C1A12';
const border = '#3D2518';
const tHead  = '#F5E6C8';
const tBody  = '#C4A882';
const tSub   = '#8A7060';

/* ─── shared wrapper ────────────────────────────────────────────────────── */
function wrap(preview, inner) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Vivah Dwar</title>
</head>
<body style="margin:0;padding:0;background:${bg};font-family:'Segoe UI',Arial,sans-serif;">

<!-- preview text -->
<div style="display:none;max-height:0;overflow:hidden;">${preview} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- ══ HEADER ══ -->
  <tr><td style="background:linear-gradient(160deg,#2E1A0E 0%,#1C0F0A 100%);
                 border-radius:20px 20px 0 0;
                 border:1px solid ${border};border-bottom:none;
                 padding:36px 48px 30px;text-align:center;">

    <img src="cid:${LOGO_CID}" width="72" height="72" alt="Vivah Dwar"
         style="border-radius:50%;border:2px solid ${gold};
                display:block;margin:0 auto 16px;object-fit:cover;"/>

    <div style="font-size:28px;font-weight:800;color:${gold};
                letter-spacing:1px;line-height:1;">Vivah Dwar</div>
    <div style="font-size:11px;color:${tSub};letter-spacing:4px;
                text-transform:uppercase;margin-top:5px;">Matrimony Platform</div>

    <!-- gold rule -->
    <table cellpadding="0" cellspacing="0" style="margin:20px auto 0;">
    <tr>
      <td width="30" style="height:1px;background:transparent;"></td>
      <td width="80" style="height:2px;background:linear-gradient(90deg,transparent,${gold},transparent);"></td>
      <td width="30" style="height:1px;background:transparent;"></td>
    </tr>
    </table>
  </td></tr>

  <!-- ══ BODY ══ -->
  <tr><td style="background:${card};
                 border-left:1px solid ${border};border-right:1px solid ${border};
                 padding:40px 48px;">
    ${inner}
  </td></tr>

  <!-- ══ FOOTER ══ -->
  <tr><td style="background:${sect};
                 border-radius:0 0 20px 20px;
                 border:1px solid ${border};border-top:none;
                 padding:24px 48px;text-align:center;">
    <p style="margin:0 0 8px;font-size:12px;color:${tSub};">
      You received this because you have an account on Vivah Dwar.
    </p>
    <p style="margin:0 0 14px;font-size:12px;">
      <a href="${APP_URL}" style="color:${gold};text-decoration:none;">vivah dwar</a>
      &nbsp;·&nbsp;
      <a href="${APP_URL}/privacy" style="color:${tSub};text-decoration:none;">Privacy</a>
      &nbsp;·&nbsp;
      <a href="${APP_URL}/contact" style="color:${tSub};text-decoration:none;">Support</a>
    </p>
    <p style="margin:0;font-size:11px;color:${border};">
      © ${YEAR} Vivah Dwar Matrimony. All rights reserved.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/* ─── reusable pieces ───────────────────────────────────────────────────── */
const hi = (name) =>
  `<p style="margin:0 0 18px;font-size:17px;font-weight:700;color:${tHead};">
     Namaste, ${name || 'there'} 🙏
   </p>`;

const btn = (href, label) =>
  `<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
   <tr><td style="border-radius:12px;
                  background:linear-gradient(135deg,${gold} 0%,${goldD} 100%);
                  box-shadow:0 4px 18px rgba(200,164,92,0.35);">
     <a href="${href}"
        style="display:inline-block;padding:14px 40px;
               color:#1C0F0A;font-size:15px;font-weight:800;
               text-decoration:none;border-radius:12px;letter-spacing:.5px;">
       ${label}
     </a>
   </td></tr>
   </table>`;

const divider = `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr><td style="height:1px;background:${border};"></td></tr>
</table>`;

/* ══════════════════════════════════════════════════════════════════════════
   1.  OTP  EMAIL
══════════════════════════════════════════════════════════════════════════ */
export async function sendOTPEmail(email, name, otp, type = 'EMAIL_VERIFY') {

  const cfg = {
    EMAIL_VERIFY: {
      subject : '🔐 Verify your Vivah Dwar account',
      preview : `Your verification OTP is ${otp} — valid 10 min`,
      badge   : '✉️ Email Verification',
      desc    : 'Enter the OTP below to verify your email address and activate your Vivah Dwar account.',
    },
    PASSWORD_RESET: {
      subject : '🔑 Reset your Vivah Dwar password',
      preview : `Password reset OTP: ${otp}`,
      badge   : '🔑 Password Reset',
      desc    : 'Use this OTP to reset your password. If you did not request this, please ignore this email.',
    },
    LOGIN_OTP: {
      subject : '🔓 Your Vivah Dwar login OTP',
      preview : `Login OTP: ${otp}`,
      badge   : '🔓 Login OTP',
      desc    : 'Use this OTP to complete your login. Never share it with anyone.',
    },
  };

  const c = cfg[type] || cfg.EMAIL_VERIFY;

  const inner = `
    <!-- badge -->
    <div style="display:inline-block;background:rgba(200,164,92,.12);
                border:1px solid rgba(200,164,92,.35);border-radius:30px;
                padding:6px 16px;font-size:12px;color:${gold};
                font-weight:700;letter-spacing:.5px;margin-bottom:22px;">
      ${c.badge}
    </div>

    ${hi(name)}

    <p style="margin:0 0 30px;font-size:14px;color:${tBody};line-height:1.75;">
      ${c.desc}
    </p>

    <!-- OTP card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 30px;">
    <tr><td style="background:${sect};
                   border:1px solid ${gold};border-radius:18px;
                   padding:32px 24px;text-align:center;">
      <div style="font-size:11px;color:${tSub};text-transform:uppercase;
                  letter-spacing:4px;margin-bottom:14px;">Your One-Time Password</div>
      <div style="font-size:52px;font-weight:900;color:${gold};
                  letter-spacing:16px;font-family:'Courier New',monospace;
                  line-height:1;">${otp}</div>
      <div style="margin:18px auto 0;width:50px;height:1px;background:${border};"></div>
      <div style="margin-top:12px;font-size:12px;color:${tSub};">
        ⏱&nbsp; Valid for <strong style="color:${tBody};">10 minutes</strong>
      </div>
    </td></tr>
    </table>

    <!-- security note -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="background:rgba(200,164,92,.06);
                   border-left:3px solid ${gold};
                   border-radius:0 10px 10px 0;
                   padding:14px 18px;">
      <p style="margin:0;font-size:12px;color:${tSub};line-height:1.65;">
        🔒 <strong style="color:${tBody};">Never share this OTP</strong> with anyone.
        Vivah Dwar will never ask for your OTP via call, SMS, or chat.
      </p>
    </td></tr>
    </table>
  `;

  await transporter.sendMail({ from: FROM, to: email, subject: c.subject, html: wrap(c.preview, inner), attachments: [LOGO_ATTACHMENT] });
}

/* ══════════════════════════════════════════════════════════════════════════
   2.  WELCOME  EMAIL
══════════════════════════════════════════════════════════════════════════ */
export async function sendWelcomeEmail(email, name) {

  const steps = [
    { n:'1', title:'Profile Under Review',  desc:'Our team is manually verifying your profile. This usually takes 24–48 hours.' },
    { n:'2', title:'Get Your Verified Badge', desc:'Once approved you\'ll receive a ✅ verified badge visible to all members.' },
    { n:'3', title:'Start Matching!',        desc:'Browse thousands of verified profiles and connect with your perfect match.' },
  ];

  const inner = `
    <!-- hero line -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;line-height:1;margin-bottom:12px;">💕</div>
      <div style="font-size:22px;font-weight:800;color:${tHead};">
        Welcome to Vivah Dwar!
      </div>
      <div style="font-size:13px;color:${tSub};margin-top:6px;">
        Your journey to finding the perfect match begins here.
      </div>
    </div>

    ${hi(name)}

    <p style="margin:0 0 28px;font-size:14px;color:${tBody};line-height:1.75;">
      Thank you for registering on <strong style="color:${gold};">Vivah Dwar</strong>.
      Your account has been created and is currently under review by our verification team.
    </p>

    <!-- steps -->
    ${steps.map((s, i) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${i < steps.length-1 ? '16px' : '0'};">
    <tr>
      <td width="44" valign="top">
        <div style="width:36px;height:36px;border-radius:50%;
                    background:linear-gradient(135deg,${gold},${goldD});
                    text-align:center;line-height:36px;
                    font-size:14px;font-weight:900;color:#1C0F0A;">
          ${s.n}
        </div>
      </td>
      <td style="padding-left:14px;padding-top:4px;">
        <div style="font-size:14px;font-weight:700;color:${tHead};margin-bottom:3px;">${s.title}</div>
        <div style="font-size:12px;color:${tSub};line-height:1.6;">${s.desc}</div>
      </td>
    </tr>
    </table>
    ${i < steps.length-1 ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 0 22px;">
      <tr><td width="1" style="border-left:2px dashed ${border};height:14px;"></td></tr>
    </table>` : ''}`).join('')}

    ${divider}

    <div style="text-align:center;">
      ${btn(`${APP_URL}/login`, 'Go to My Account →')}
      <p style="margin:16px 0 0;font-size:12px;color:${tSub};">
        We'll email you as soon as your profile is approved.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: FROM, to: email,
    subject: '💕 Welcome to Vivah Dwar — Your journey begins!',
    html: wrap(`Welcome ${name}! Your profile is under review.`, inner),
    attachments: [LOGO_ATTACHMENT],
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   3.  ADMIN VERIFICATION  EMAIL
══════════════════════════════════════════════════════════════════════════ */
export async function sendAdminVerificationEmail(email, name, trialDays = 1) {

  const inner = `
    ${hi(name)}

    <p style="margin:0 0 26px;font-size:14px;color:${tBody};line-height:1.75;">
      Great news! Your Vivah Dwar profile has been
      <strong style="color:#22C55E;">successfully verified</strong> by our team.
      You can now access all features and start connecting with matches.
    </p>

    <!-- verified card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
    <tr><td style="background:${sect};border:1px solid ${border};
                   border-radius:16px;padding:28px;text-align:center;">
      <div style="font-size:52px;line-height:1;margin-bottom:10px;">✅</div>
      <div style="font-size:20px;font-weight:800;color:${tHead};margin-bottom:6px;">
        Profile Verified!
      </div>
      <div style="font-size:13px;color:${tSub};">
        Your profile now shows a verified badge to all members.
      </div>
    </td></tr>
    </table>

    ${trialDays > 0 ? `
    <!-- trial gift -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
    <tr><td style="background:linear-gradient(135deg,rgba(200,164,92,.14),rgba(200,164,92,.04));
                   border:1px solid ${gold};border-radius:16px;padding:26px;text-align:center;">
      <div style="font-size:11px;color:${tSub};text-transform:uppercase;
                  letter-spacing:3px;margin-bottom:8px;">Special Gift For You</div>
      <div style="font-size:32px;font-weight:900;color:${gold};margin-bottom:6px;">
        🎁 ${trialDays}-Day Free Trial
      </div>
      <div style="font-size:13px;color:${tBody};">
        Full premium access — unlimited chat, view contacts, advanced filters &amp; more!
      </div>
    </td></tr>
    </table>` : ''}

    <div style="text-align:center;">
      ${btn(`${APP_URL}/login`, 'Start Finding Matches →')}
    </div>
  `;

  await transporter.sendMail({
    from: FROM, to: email,
    subject: '✅ Your Vivah Dwar profile is verified!',
    html: wrap(`${name}, your profile is now verified — ${trialDays > 0 ? `enjoy your ${trialDays}-day free trial!` : 'start matching now!'}`, inner),
    attachments: [LOGO_ATTACHMENT],
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   4.  PREMIUM ACTIVATION  EMAIL
══════════════════════════════════════════════════════════════════════════ */
export async function sendPremiumActivationEmail(email, name, plan, expiry) {

  const expiryStr = new Date(expiry).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const allFeatures = {
    SILVER:   ['50 Interests / month', 'View Contact Details', 'Basic Search Filters', 'Email Support'],
    GOLD:     ['Unlimited Interests', 'View Contact Details', 'Advanced Filters', 'Read Receipts', 'Priority Support'],
    PLATINUM: ['Everything in Gold', 'Unlimited Chat', 'Profile Boost', 'AI Match Score', 'Dedicated Manager'],
  };
  const features = allFeatures[(plan || 'GOLD').toUpperCase()] || allFeatures.GOLD;

  const inner = `
    <!-- hero -->
    <div style="text-align:center;margin-bottom:30px;">
      <div style="font-size:48px;line-height:1;margin-bottom:10px;">⭐</div>
      <div style="font-size:22px;font-weight:800;color:${gold};">
        ${plan} Plan Activated!
      </div>
    </div>

    ${hi(name)}

    <p style="margin:0 0 26px;font-size:14px;color:${tBody};line-height:1.75;">
      Congratulations! Your <strong style="color:${gold};">${plan} Plan</strong> is now active.
      Enjoy premium features and find your perfect match faster!
    </p>

    <!-- plan card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
    <tr><td style="background:linear-gradient(135deg,${sect},${card});
                   border:1px solid ${gold};border-radius:18px;padding:28px;">

      <!-- plan header row -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
      <tr>
        <td>
          <div style="font-size:11px;color:${tSub};text-transform:uppercase;
                      letter-spacing:2px;margin-bottom:4px;">Active Plan</div>
          <div style="font-size:22px;font-weight:900;color:${gold};">⭐ ${plan}</div>
        </td>
        <td align="right" valign="top">
          <div style="font-size:11px;color:${tSub};text-transform:uppercase;
                      letter-spacing:2px;margin-bottom:4px;">Valid Until</div>
          <div style="font-size:13px;font-weight:700;color:${tHead};">${expiryStr}</div>
        </td>
      </tr>
      </table>

      <!-- divider -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
      <tr><td style="height:1px;background:${border};"></td></tr>
      </table>

      <!-- features -->
      ${features.map(f => `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
      <tr>
        <td width="22">
          <div style="width:18px;height:18px;border-radius:50%;
                      background:rgba(200,164,92,.15);border:1px solid ${gold};
                      text-align:center;line-height:18px;font-size:10px;color:${gold};">✦</div>
        </td>
        <td style="padding-left:10px;font-size:13px;color:${tBody};">${f}</td>
      </tr>
      </table>`).join('')}

    </td></tr>
    </table>

    <div style="text-align:center;">
      ${btn(`${APP_URL}/dashboard`, 'Go to Dashboard →')}
    </div>
  `;

  await transporter.sendMail({
    from: FROM, to: email,
    subject: `⭐ ${plan} Plan Activated — Vivah Dwar`,
    html: wrap(`Your ${plan} plan is now active on Vivah Dwar! Valid until ${expiryStr}.`, inner),
    attachments: [LOGO_ATTACHMENT],
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   5.  VIDEO KYC INVITE  EMAIL
══════════════════════════════════════════════════════════════════════════ */
export async function sendKycInviteEmail(email, name, kycLink) {
  const inner = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;line-height:1;margin-bottom:12px;">🎥</div>
      <div style="font-size:22px;font-weight:800;color:${tHead};">Video KYC Verification</div>
      <div style="font-size:13px;color:${tSub};margin-top:6px;">
        Your identity verification call is ready
      </div>
    </div>

    <p style="margin:0 0 20px;font-size:14px;color:${tBody};line-height:1.75;">
      Hi <strong style="color:${gold};">${name}</strong>,<br/>
      Our verification team has scheduled a <strong style="color:${tHead};">Video KYC call</strong>
      to complete your identity verification. Please click the button below to join the secure video call.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr><td style="background:${sect};border:1px solid ${border};border-radius:16px;padding:24px;">
      <p style="margin:0 0 8px;font-size:12px;color:${tSub};text-transform:uppercase;letter-spacing:2px;">What to expect</p>
      ${[
        '📹 A live video call with our verification officer',
        '🪪 Keep your ID document (Aadhaar/PAN/Passport) ready',
        '📸 Admin may capture a photo of your document during the call',
        '✅ Verification completes in under 5 minutes',
      ].map(s => `<p style="margin:6px 0;font-size:13px;color:${tBody};">${s}</p>`).join('')}
    </td></tr>
    </table>

    <div style="text-align:center;margin-bottom:20px;">
      <a href="${kycLink}" style="display:inline-block;background:linear-gradient(135deg,${gold},${goldD});
         color:#1C0F0A;font-weight:800;font-size:15px;padding:14px 36px;
         border-radius:50px;text-decoration:none;letter-spacing:0.5px;">
        🎥 Join Video KYC Call →
      </a>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="background:rgba(200,164,92,.06);border-left:3px solid ${gold};
                   border-radius:0 10px 10px 0;padding:14px 18px;">
      <p style="margin:0;font-size:12px;color:${tSub};line-height:1.65;">
        🔒 This link is <strong style="color:${tBody};">unique to you</strong> and expires in 24 hours.
        Do not share it with anyone. If you did not request this, please ignore this email.
      </p>
    </td></tr>
    </table>
  `;

  await transporter.sendMail({
    from: FROM, to: email,
    subject: '🎥 Video KYC Verification — Vivah Dwar',
    html: wrap(`${name}, your Video KYC call is ready. Click to join.`, inner),
    attachments: [LOGO_ATTACHMENT],
  });
}
