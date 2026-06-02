/**
 * Advanced rule-based support agent — semantic keyword scoring, no external AI.
 * Covers full Vivah Dwar / Milan Matrimony website features.
 */

import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_HOURS,
  OFFICE_ADDRESS,
} from '@/lib/siteContact';

const SITE = 'Vivah Dwar';

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

export function detectLang(text) {
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  return 'en';
}

/** @typedef {{ id: string, topics: string[], phrases?: string[], title: Record<string,string>, answer: Record<string,string>, links?: {label:string,href:string}[], followUps?: {label:string,text:string}[] }} Article */

/** @type {Article[]} */
const ARTICLES = [
  {
    id: 'greeting',
    topics: ['hi', 'hello', 'hey', 'help', 'start', 'namaste', 'helo', 'madad', 'सहायता', 'नमस्ते'],
    phrases: ['good morning', 'good evening'],
    title: { en: 'Welcome', hi: 'स्वागत' },
    answer: {
      en: `👋 Hello! I'm your **${SITE} Support Agent**.\n\n**Pick a topic (type number or tap below):**\n1️⃣ Register · 2️⃣ Login · 3️⃣ Premium\n4️⃣ Profile · 5️⃣ Matches · 6️⃣ Chat\n7️⃣ Verification · 8️⃣ Payment · 9️⃣ Live Agent\n\n🌐 **English & Hindi** — custom questions welcome!\n💡 *"interest kaise bheje?"* · *"kundali pdf download"* · *"family login setup"*`,
      hi: `👋 नमस्ते! मैं **${SITE} Support Agent** हूँ।\n\n**Topic चुनें (number या tap):**\n1️⃣ रजिस्टर · 2️⃣ लॉगिन · 3️⃣ प्रीमियम\n4️⃣ प्रोफाइल · 5️⃣ मैच · 6️⃣ चैट\n7️⃣ वेरिफिकेशन · 8️⃣ पेमेंट · 9️⃣ Live Agent\n\n🌐 **Hindi & English** — kuch bhi pucho!\n💡 *"premium plan kaise le?"* · *"profile approve nahi hui"*`,
    },
    followUps: [
      { label: '📝 Register', text: 'how to register' },
      { label: '⭐ Premium', text: 'premium plans' },
      { label: '💑 Matches', text: 'how to find matches' },
      { label: '🧑‍💼 Human agent', text: 'talk to agent' },
    ],
  },
  {
    id: 'register',
    topics: ['register', 'signup', 'sign', 'account', 'create', 'join', 'रजिस्टर', 'अकाउंट', 'बनाएं', 'registration'],
    phrases: ['create account', 'new account', 'sign up'],
    title: { en: 'Registration', hi: 'रजिस्ट्रेशन' },
    answer: {
      en: `📝 **How to Register**\n\n1. Open [Register](/register)\n2. Enter **name, email, password**, mobile & gender\n3. Verify mobile with **SMS OTP** (valid mobile number required)\n4. Verify email with **OTP** sent to your inbox\n5. Complete **onboarding** (profile + photo + ID)\n6. Submit for **admin review** (usually 24–48 hours)\n7. After approval → login and start matching!`,
      hi: `📝 **How to Register**\n\n1. Open [Register](/register)\n2. Enter name, email, password, mobile & gender\n3. Verify mobile with **SMS OTP**\n4. Verify email OTP\n5. Complete onboarding and admin review`,
    },
    links: [{ label: 'Go to Register', href: '/register' }],
    followUps: [{ label: 'Login help', text: 'how to login' }, { label: 'Profile setup', text: 'complete profile' }],
  },
  {
    id: 'login',
    topics: ['login', 'log', 'signin', 'password', 'google', 'qr', 'family', 'लॉगिन', 'पासवर्ड'],
    phrases: ['log in', 'sign in', 'cant login', 'cannot login', 'family login'],
    title: { en: 'Login', hi: 'लॉगिन' },
    answer: {
      en: `🔐 **Login Options**\n\n**Member login:** [Login](/login) → email + password, or **Google**\n\n**Family login:** [Login](/login) → **Family Login** tab → parents can browse profiles read-only (no interest/chat)\n\n**QR login:** Login page → scan with mobile app\n\n**Forgot password?** → [Reset](/forgot-password)\n\n⚠️ Account must be **admin approved** before login works. "Pending Approval" = wait up to 24h.`,
      hi: `🔐 **लॉगिन विकल्प**\n\n**Member:** [Login](/login) → email + password या **Google**\n\n**Family login:** Family tab → parents read-only browse (interest/chat नहीं)\n\n**QR login:** Mobile app से scan\n\n**पासवर्ड भूले?** → [Reset](/forgot-password)\n\n⚠️ **Admin approval** जरूरी — Pending = 24 घंटे wait।`,
    },
    links: [{ label: 'Login', href: '/login' }, { label: 'Forgot Password', href: '/forgot-password' }],
  },
  {
    id: 'profile',
    topics: ['profile', 'edit', 'complete', 'about', 'photo', 'document', 'onboarding', 'प्रोफाइल', 'फोटो', 'about me'],
    phrases: ['edit profile', 'complete profile', 'about me', 'upload photo', 'profile setup'],
    title: { en: 'Profile Setup', hi: 'प्रोफाइल' },
    answer: {
      en: `👤 **Profile Setup**\n\n1. [Dashboard](/dashboard) → **Edit Profile**\n2. Fill: basic info, religion, location, career, family, partner prefs\n3. **About Me:** minimum **50 words**, max 4000 words\n4. Upload **profile photo** + **family/lifestyle photo**\n5. Upload **ID document** (Aadhaar/PAN/Passport) for verification\n6. Optional: **intro video**, **kundali** (birth details)\n7. Submit for review when 100% complete\n\n💡 Better profile = better matches + free trial eligibility.`,
      hi: `👤 **प्रोफाइल सेटअप**\n\n1. [Dashboard](/dashboard) → **Edit Profile**\n2. बेसिक, धर्म, location, career, family, partner prefs भरें\n3. **About Me:** कम से कम **50 शब्द**, अधिकतम 4000\n4. **फोटो** + **family photo** upload\n5. **ID document** upload\n6. Optional: **intro video**, **kundali**\n7. 100% complete → review submit\n\n💡 अच्छी profile = बेहतर matches।`,
    },
    links: [{ label: 'Edit Profile', href: '/profile/edit' }, { label: 'Dashboard', href: '/dashboard' }],
  },
  {
    id: 'premium',
    topics: ['premium', 'plan', 'gold', 'silver', 'platinum', 'free', 'upgrade', 'subscription', 'प्रीमियम', 'प्लान', 'trial'],
    phrases: ['premium plan', 'upgrade plan', 'free trial', 'how much', 'pricing'],
    title: { en: 'Premium Plans', hi: 'प्रीमियम' },
    answer: {
      en: `⭐ **Premium Plans**\n\nView live pricing on [Premium](/premium) — plans include **FREE, SILVER, GOLD, PLATINUM**.\n\n**Common benefits by tier:**\n• See contact details\n• More / unlimited interests\n• Chat with matches (Gold+)\n• Profile boost, AI match score\n• Who viewed my profile\n• Kundali PDF report (selected plans)\n\n🆓 **Free trial** may activate after admin approves your complete profile.\n\n💳 Pay via **Cashfree** (UPI, cards, net banking). Use coupon codes on checkout.`,
      hi: `⭐ **प्रीमियम प्लान**\n\n[Premium](/premium) पर live price देखें — **FREE, SILVER, GOLD, PLATINUM**.\n\n**फायदे:**\n• Contact details\n• ज्यादा / unlimited interests\n• Chat (Gold+)\n• Profile boost, AI score\n• Who viewed me\n• Kundali PDF (selected plans)\n\n🆓 Profile approve + complete → **free trial** possible.\n\n💳 **Cashfree** payment, coupon code use करें।`,
    },
    links: [{ label: 'View Plans', href: '/premium' }],
    followUps: [{ label: 'Payment help', text: 'how to pay' }, { label: 'Refund', text: 'refund policy' }],
  },
  {
    id: 'payment',
    topics: ['pay', 'payment', 'cashfree', 'upi', 'coupon', 'checkout', 'card', 'पेमेंट', 'कूपन'],
    phrases: ['make payment', 'apply coupon', 'payment failed'],
    title: { en: 'Payment', hi: 'पेमेंट' },
    answer: {
      en: `💳 **Payment Guide**\n\n1. Go to [Premium](/premium) → choose plan & duration\n2. Click **Get Plan** → [Checkout](/payment/checkout)\n3. Apply **coupon code** if you have one\n4. Pay with UPI / card / net banking (Cashfree)\n5. Success page confirms activation\n\n❌ Payment failed? Wait 10 min, check bank SMS, retry. Duplicate charge? Email support with payment ID.\n\n📄 [Refund Policy](/refund)`,
      hi: `💳 **पेमेंट गाइड**\n\n1. [Premium](/premium) → plan चुनें\n2. **Checkout** → coupon लगाएं\n3. UPI / card से pay (Cashfree)\n4. Success page पर confirm\n\n❌ Fail? 10 min wait, retry। Duplicate? payment ID के साथ support contact।\n\n📄 [Refund Policy](/refund)`,
    },
    links: [{ label: 'Premium', href: '/premium' }],
  },
  {
    id: 'matches',
    topics: ['match', 'matches', 'search', 'find', 'bride', 'groom', 'browse', 'filter', 'मैच', 'खोज'],
    phrases: ['find matches', 'search profile', 'saved search', 'kundali filter'],
    title: { en: 'Find Matches', hi: 'मैच खोजें' },
    answer: {
      en: `💑 **Finding Matches**\n\n• [Matches](/matches) — recommended profiles\n• [Search](/search) — advanced filters (age, religion, city, education…)\n• **Kundali filters:** rashi, nakshatra, manglik, has kundali\n• **Save search** + email/push alerts when new profiles match\n• **Shortlist** profiles → [Compare](/compare) up to 4 side-by-side\n• **Recently viewed** on dashboard\n\n🔍 Tip: complete profile + clear partner preferences = better results.`,
      hi: `💑 **मैच खोजें**\n\n• [Matches](/matches) — recommended\n• [Search](/search) — filters (age, religion, city…)\n• **Kundali filters:** rashi, nakshatra, manglik\n• **Save search** + alerts\n• **Shortlist** → [Compare](/compare)\n• Dashboard पर recently viewed\n\n🔍 पूरी profile + partner prefs = better matches।`,
    },
    links: [{ label: 'Search', href: '/search' }, { label: 'Matches', href: '/matches' }],
  },
  {
    id: 'interest',
    topics: ['interest', 'send', 'accept', 'reject', 'withdraw', 'like', 'इंटरेस्ट', 'रुचि'],
    phrases: ['send interest', 'accept interest', 'interest limit'],
    title: { en: 'Interests', hi: 'इंटरेस्ट' },
    answer: {
      en: `💌 **Interests (Proposals)**\n\n1. Open any profile → **Send Interest** (optional personal message / templates)\n2. They get notified → **Accept** or **Decline**\n3. If accepted → chat unlocks (premium/trial)\n4. Track all at [Interests](/interests)\n5. **Withdraw** pending interest anytime\n\n📊 Free users have daily/monthly limits; premium plans increase or remove limits.\n\n👨‍👩‍👧 **Family login** cannot send interests — owner account only.`,
      hi: `💌 **इंटरेस्ट**\n\n1. Profile → **Send Interest** (message optional)\n2. सामने वाले को notify → Accept/Decline\n3. Accept → chat (premium/trial)\n4. [Interests](/interests) पर track\n5. Pending **withdraw** कर सकते हैं\n\n📊 Free limit होता है; premium पर ज्यादा/unlimited.\n\n👨‍👩‍👧 Family login interest नहीं भेज सकता।`,
    },
    links: [{ label: 'My Interests', href: '/interests' }],
  },
  {
    id: 'chat',
    topics: ['chat', 'message', 'messaging', 'talk', 'conversation', 'चैट', 'मैसेज'],
    phrases: ['how to chat', 'send message', 'cant chat', 'cannot chat'],
    title: { en: 'Chat', hi: 'चैट' },
    answer: {
      en: `💬 **Chat & Messaging**\n\n• Chat opens after **interest is accepted**\n• Requires **Premium** or active **free trial**\n• Go to [Chat](/chat) — text, photos, documents, location\n• Enable **browser notifications** for instant alerts\n\n❓ Can't chat? Check: premium active? interest accepted? not blocked?`,
      hi: `💬 **चैट**\n\n• **Interest accept** के बाद chat\n• **Premium** या **free trial** जरूरी\n• [Chat](/chat) — text, photo, document\n• **Notifications** allow करें\n\n❓ Chat नहीं? Premium? interest accept? block तो नहीं?`,
    },
    links: [{ label: 'Open Chat', href: '/chat' }, { label: 'Upgrade', href: '/premium' }],
  },
  {
    id: 'kundali',
    topics: ['kundali', 'guna', 'milan', 'horoscope', 'rashi', 'nakshatra', 'manglik', 'pdf', 'कुंडली', 'गुण'],
    phrases: ['kundali match', 'guna milan', 'download pdf', 'kundali pdf', 'pdf download kaise', 'how to download pdf'],
    title: { en: 'Kundali Match', hi: 'कुंडली' },
    answer: {
      en: `⚖️ **Kundali Match & PDF Download**\n\n**Step 1 — Your kundali**\n• [Edit Profile](/profile/edit) → birth date, time, place → save → your kundali generates\n\n**Step 2 — Open a profile**\n• Go to any profile that also has kundali → scroll to **Kundali Match Report**\n• See Guna Milan score (out of 36)\n\n**Step 3 — Download PDF**\n• Top-right of report → **EN / हि** choose language\n• Click **PDF** button → file downloads to your phone/PC\n• If you see **"PDF — Premium"** → upgrade plan with **Kundali PDF** feature at [Premium](/premium)\n\n**Requirements:**\n✅ Logged in · ✅ Your kundali generated · ✅ Partner has kundali · ✅ Premium plan with \`kundaliMatchPdf\` permission\n\n📊 Ashtakoot (36 gunas). Filter by rashi in [Search](/search).`,
      hi: `⚖️ **कुंडली PDF Download — Step by Step**\n\n**Step 1:** [Edit Profile](/profile/edit) → जन्म date, time, place → save → apni kundali banao\n\n**Step 2:** Kisi profile par jao (jinke paas kundali ho) → **Kundali Match Report** dekho\n\n**Step 3:** Report ke top-right par **PDF** button dabao\n• **EN / हि** se language choose karo\n• PDF phone/PC par download hogi\n• Agar **"PDF — Premium"** dikhe → [Premium](/premium) upgrade karo (Kundali PDF wala plan)\n\n**Zaroori:** Login · Apni kundali · Partner kundali · Premium plan`,
    },
    links: [{ label: 'Edit Profile', href: '/profile/edit' }],
  },
  {
    id: 'verification',
    topics: ['verify', 'verification', 'badge', 'document', 'aadhaar', 'pan', 'safe', 'security', 'वेरिफ', 'सुरक्षा'],
    phrases: ['verified badge', 'upload id', 'profile approval', 'pending approval'],
    title: { en: 'Verification & Safety', hi: 'वेरिफिकेशन' },
    answer: {
      en: `🛡️ **Verification & Safety**\n\n**Profile verification:**\n• Upload ID in profile edit → admin reviews 24–48h\n• Get ✅ verified badge\n\n**Safety:**\n• Never share OTP, passwords, or money\n• Meet in public places first\n• [Report Abuse](/report-abuse) for fake profiles\n• Block users from their profile\n• [Safety tips](/safety)\n\n⏳ **Pending approval?** New accounts need admin review before full access.`,
      hi: `🛡️ **वेरिफिकेशन**\n\n• ID upload → admin review → ✅ badge\n• OTP/password/पैसा share न करें\n• [Report Abuse](/report-abuse)\n• Profile से block\n• [Safety](/safety)\n\n⏳ **Pending approval** = admin review wait।`,
    },
    links: [{ label: 'Safety', href: '/safety' }, { label: 'Report', href: '/report-abuse' }],
  },
  {
    id: 'settings',
    topics: ['settings', 'privacy', 'hide', 'phone', 'block', 'notification', 'family access', 'सेटिंग', 'प्राइवेसी'],
    phrases: ['hide phone', 'family login setup', 'email alerts', 'saved search alert'],
    title: { en: 'Settings & Privacy', hi: 'सेटिंग्स' },
    answer: {
      en: `⚙️ **Settings & Privacy**\n\n[Settings](/settings):\n• Hide phone / photos from non-premium\n• Notification preferences\n• **Family login** — add up to 3 family members (read-only browse)\n• Premium renewal email reminders\n• Refer & earn, share success story\n\n**Blocked users:** [Blocked](/blocked)\n**Password:** Settings → Change Password`,
      hi: `⚙️ **सेटिंग्स**\n\n[Settings](/settings):\n• Phone/photo hide\n• Notifications\n• **Family login** (3 members, read-only)\n• Renewal reminders\n• Refer & story\n\n**Blocked:** [Blocked](/blocked)`,
    },
    links: [{ label: 'Settings', href: '/settings' }],
  },
  {
    id: 'views',
    topics: ['view', 'viewed', 'who viewed', 'profile view', 'देखा'],
    phrases: ['who viewed my profile', 'profile views'],
    title: { en: 'Profile Views', hi: 'Profile Views' },
    answer: {
      en: `👁️ **Who Viewed My Profile**\n\n• Premium feature on selected plans\n• Go to [Views](/views) to see who viewed you\n• Dashboard shows recent view count\n• Enable notifications for profile view alerts\n\nUpgrade at [Premium](/premium) if locked.`,
      hi: `👁️ **किसने देखा**\n\n• Premium feature\n• [Views](/views) पर list\n• Dashboard पर count\n• Notifications on करें\n\nLocked? [Premium](/premium) upgrade।`,
    },
    links: [{ label: 'Who Viewed Me', href: '/views' }],
  },
  {
    id: 'refer',
    topics: ['refer', 'referral', 'earn', 'invite', 'रेफर'],
    phrases: ['refer and earn', 'referral code'],
    title: { en: 'Refer & Earn', hi: 'Refer & Earn' },
    answer: {
      en: `🎁 **Refer & Earn**\n\n1. Go to [Refer](/refer) or Settings\n2. Copy your unique **referral link**\n3. Share with friends — when they register, you get credit tracked\n4. Admin panel tracks referrals\n\nShare: \`yoursite.com/register?ref=YOUR_CODE\``,
      hi: `🎁 **Refer & Earn**\n\n1. [Refer](/refer) → link copy\n2. दोस्तों को share\n3. Register पर track होगा\n\nLink: \`register?ref=CODE\``,
    },
    links: [{ label: 'Refer & Earn', href: '/refer' }],
  },
  {
    id: 'stories',
    topics: ['story', 'stories', 'success', 'share', 'शादी', 'कहानी'],
    phrases: ['success story', 'share story', 'wedding story'],
    title: { en: 'Success Stories', hi: 'Success Stories' },
    answer: {
      en: `💒 **Success Stories**\n\n• Share yours: [Share Story](/share-story) — photo optional\n• Admin approves → published on [Stories](/stories)\n• Inspire other members!\n\nPending? Usually reviewed within a few days.`,
      hi: `💒 **Success Stories**\n\n• [Share Story](/share-story) — photo optional\n• Admin approve → [Stories](/stories)\n• अपनी कहानी share करें!`,
    },
    links: [{ label: 'Share Story', href: '/share-story' }, { label: 'Read Stories', href: '/stories' }],
  },
  {
    id: 'navigation',
    topics: ['navigate', 'where', 'page', 'menu', 'dashboard', 'homepage', 'link', 'कहाँ', 'पेज', 'guide'],
    phrases: ['how to use website', 'where is', 'how does this work', 'site map', 'website guide'],
    title: { en: 'Website Guide', hi: 'Website Guide' },
    answer: {
      en: `🗺️ **Website Quick Map**\n\n| Page | Purpose |\n|------|--------|\n| [Home](/) | Landing & pricing |\n| [Dashboard](/dashboard) | Your hub, stats, quick links |\n| [Search](/search) | Find profiles |\n| [Matches](/matches) | Recommendations |\n| [Interests](/interests) | Sent/received proposals |\n| [Chat](/chat) | Messages |\n| [Shortlist](/shortlist) | Saved profiles |\n| [Premium](/premium) | Upgrade plan |\n| [Help](/help) | Full FAQ |\n| [Contact](/contact) | Email support |\n\nAsk me anything specific!`,
      hi: `🗺️ **साइट मैप**\n\n• [Dashboard](/dashboard) — home hub\n• [Search](/search) — profiles खोजें\n• [Matches](/matches) — recommendations\n• [Interests](/interests) — proposals\n• [Chat](/chat) — messages\n• [Premium](/premium) — upgrade\n• [Help](/help) — FAQ\n\nकुछ specific पूछें!`,
    },
    links: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Help Center', href: '/help' }],
  },
  {
    id: 'shortlist',
    topics: ['shortlist', 'bookmark', 'save', 'favorite', 'compare', 'शॉर्टलिस्ट'],
    phrases: ['add to shortlist', 'compare profiles', 'save profile'],
    title: { en: 'Shortlist & Compare', hi: 'Shortlist' },
    answer: {
      en: `🔖 **Shortlist & Compare**\n\n• Tap ❤️ on any profile → saved to [Shortlist](/shortlist)\n• Compare up to **4 profiles** side-by-side at [Compare](/compare)\n• Great for deciding between final choices!\n• Shortlist from profile page or match cards`,
      hi: `🔖 **Shortlist & Compare**\n\n• Profile पर ❤️ → [Shortlist](/shortlist)\n• [Compare](/compare) — 4 profiles ek saath\n• Final choice ke liye best feature!`,
    },
    links: [{ label: 'My Shortlist', href: '/shortlist' }, { label: 'Compare', href: '/compare' }],
  },
  {
    id: 'video',
    topics: ['video', 'intro', 'upload video', 'वीडियो'],
    phrases: ['intro video', 'profile video', 'video upload'],
    title: { en: 'Intro Video', hi: 'Intro Video' },
    answer: {
      en: `🎬 **Intro Video**\n\n1. Go to [Edit Profile](/profile/edit)\n2. Upload a short **intro video** (MP4/WebM)\n3. Visitors see it on your profile\n4. Makes your profile stand out!\n\n💡 Keep it professional — 30–60 seconds works best.`,
      hi: `🎬 **Intro Video**\n\n1. [Edit Profile](/profile/edit) → video upload\n2. Profile par dikhega\n3. Professional 30–60 sec video best hai!`,
    },
    links: [{ label: 'Edit Profile', href: '/profile/edit' }],
  },
  {
    id: 'family',
    topics: ['family', 'parent', 'mummy', 'papa', 'parivar', 'परिवार'],
    phrases: ['family login setup', 'add family member', 'parents login'],
    title: { en: 'Family Login', hi: 'Family Login' },
    answer: {
      en: `👨‍👩‍👧 **Family Login**\n\n1. Login as profile owner → [Settings](/settings)\n2. **Family Access** → add up to 3 members (name + email + password)\n3. They login via [Login](/login) → **Family Login** tab\n4. **Read-only:** browse profiles only — no interest, no chat\n\nPerfect for parents to help search!`,
      hi: `👨‍👩‍👧 **Family Login**\n\n1. Owner → [Settings](/settings) → Family Access\n2. 3 members add karo\n3. [Login](/login) → Family tab\n4. Sirf browse — interest/chat nahi\n\nParents ke liye perfect!`,
    },
    links: [{ label: 'Settings', href: '/settings' }],
  },
  {
    id: 'otp',
    topics: ['otp', 'email verify', 'verification code', 'code', 'ईमेल'],
    phrases: ['otp not received', 'email otp', 'verify email'],
    title: { en: 'Email OTP', hi: 'OTP' },
    answer: {
      en: `📧 **OTP Verification**\n\n**Mobile (registration):** SMS code sent to your verified mobile number.\n\n**Email:** OTP sent to your registered email — check **Spam/Junk**, wait 2–3 min, use Resend.\n\nStill stuck? [Contact](/contact) or type **"talk to agent"**.`,
      hi: `📧 **OTP Verification**\n\n**Mobile:** SMS code during registration.\n**Email:** Check spam folder and resend if needed.\n[Contact](/contact) for help.`,
    },
    followUps: [{ label: '🧑‍💼 Live Agent', text: 'talk to agent' }],
  },
  {
    id: 'pending',
    topics: ['pending', 'approval', 'approve', 'wait', 'reject', 'इंतजार'],
    phrases: ['profile pending', 'admin approval', 'not approved yet', 'approval pending'],
    title: { en: 'Profile Approval', hi: 'Approval' },
    answer: {
      en: `⏳ **Profile Approval Status**\n\n• New profiles need **admin review** (usually 24 hours)\n• Complete **100% profile** + photo + ID for faster approval\n• You'll get email when approved\n• "Pending Approval" on login = still under review\n\nEnsure About Me has **50+ words** and all required fields filled.`,
      hi: `⏳ **Profile Approval**\n\n• Admin review **24 घंटे** tak\n• 100% profile + photo + ID complete karo\n• Email aayega approve par\n• About Me **50+ words** zaroori`,
    },
    followUps: [{ label: 'Complete profile', text: 'complete profile' }],
  },
  {
    id: 'forgot',
    topics: ['forgot', 'reset', 'recover', 'bhool', 'भूल'],
    phrases: ['forgot password', 'reset password', 'password reset'],
    title: { en: 'Forgot Password', hi: 'Password Reset' },
    answer: {
      en: `🔑 **Reset Password**\n\n1. Go to [Forgot Password](/forgot-password)\n2. Enter your registered **email**\n3. Check inbox for reset link\n4. Set new password → login\n\nLink expires in 24 hours. Check spam folder.`,
      hi: `🔑 **Password Reset**\n\n1. [Forgot Password](/forgot-password)\n2. Email daalo\n3. Reset link check karo\n4. Naya password set karo`,
    },
    links: [{ label: 'Reset Password', href: '/forgot-password' }],
  },
  {
    id: 'savedsearch',
    topics: ['saved', 'alert', 'notification search', 'email alert'],
    phrases: ['saved search', 'search alert', 'new match alert'],
    title: { en: 'Saved Search Alerts', hi: 'Saved Search' },
    answer: {
      en: `🔔 **Saved Search Alerts**\n\n1. [Search](/search) → set filters (age, city, religion, kundali…)\n2. Click **Save Search**\n3. Get **email + push** when new profiles match\n4. Manage saved searches from search page\n\nNever miss a new perfect match!`,
      hi: `🔔 **Saved Search**\n\n1. [Search](/search) → filters set karo\n2. **Save Search** dabao\n3. Naye match par email/push alert\n4. Perfect match miss mat karo!`,
    },
    links: [{ label: 'Search', href: '/search' }],
  },
  {
    id: 'contact',
    topics: ['contact', 'email', 'phone', 'call', 'support email'],
    phrases: ['contact support', 'email support', 'customer care number'],
    title: { en: 'Contact Us', hi: 'Contact' },
    answer: {
      en: `📞 **Contact Support**\n\n• Phone: **${SUPPORT_PHONE_DISPLAY}** (${SUPPORT_HOURS})\n• Email: **${SUPPORT_EMAIL}**\n• Office: **${OFFICE_ADDRESS.short}**\n• [Contact Page](/contact)\n• [Help Center](/help) — full FAQ\n• Live agent: type **"talk to agent"** here`,
      hi: `📞 **Contact Support**\n\n• Phone: **${SUPPORT_PHONE_DISPLAY}** (${SUPPORT_HOURS})\n• Email: **${SUPPORT_EMAIL}**\n• Office: **${OFFICE_ADDRESS.short}**\n• [Contact Page](/contact)\n• [Help Center](/help)\n• Type **"talk to agent"** for live help`,
    },
    links: [{ label: 'Contact', href: '/contact' }, { label: 'Help', href: '/help' }],
  },
  {
    id: 'agent',
    topics: ['agent', 'human', 'support', 'staff', 'person', 'call', 'एजेंट', 'इंसान'],
    phrases: ['talk to human', 'live agent', 'real person', 'customer care', 'talk to agent'],
    title: { en: 'Human Agent', hi: 'Human Agent' },
    answer: {
      en: `🧑‍💼 **Connecting to Human Support...**\n\nI'm transferring you to our team. Please describe your issue below — an agent will respond here shortly.\n\n📞 Phone: **${SUPPORT_PHONE_DISPLAY}**\n📧 Email: **${SUPPORT_EMAIL}**\n📋 Or visit [Contact](/contact)`,
      hi: `🧑‍💼 **Connecting to Human Support...**\n\nPlease describe your issue below — an agent will respond here shortly.\n\n📞 Phone: **${SUPPORT_PHONE_DISPLAY}**\n📧 Email: **${SUPPORT_EMAIL}**\n📋 [Contact](/contact)`,
    },
  },
  {
    id: 'refund',
    topics: ['refund', 'cancel', 'money back', 'रिफंड'],
    phrases: ['get refund', 'cancel subscription'],
    title: { en: 'Refund', hi: 'Refund' },
    answer: {
      en: `↩️ **Refund Policy**\n\n• 7-day window for eligible cases\n• Technical failure / duplicate payment → full refund\n• Read full policy: [Refund](/refund)\n• Email: **${SUPPORT_EMAIL}** with payment ID\n\nNote: Plans are one-time duration, not auto-debit.`,
      hi: `↩️ **Refund Policy**\n\n• 7-day window for eligible cases\n• Technical failure / duplicate payment → full refund\n• [Refund Policy](/refund)\n• Email: **${SUPPORT_EMAIL}** with payment ID`,
    },
    links: [{ label: 'Refund Policy', href: '/refund' }],
  },
];

const AGENT_IDS = new Set(['agent']);

function scoreArticle(query, article) {
  const q = query.toLowerCase().trim();
  const tokens = tokenize(q);
  if (!tokens.length) return 0;

  let score = 0;

  for (const phrase of article.phrases || []) {
    if (q.includes(phrase.toLowerCase())) score += 12;
  }

  for (const topic of article.topics) {
    const tl = topic.toLowerCase();
    if (q.includes(tl)) score += 6;
    for (const tok of tokens) {
      if (tl.includes(tok) || tok.includes(tl)) score += 2;
    }
  }

  for (const tok of tokens) {
    const enTitle = (article.title.en || '').toLowerCase();
    const hiTitle = (article.title.hi || '').toLowerCase();
    if (enTitle.includes(tok) || hiTitle.includes(tok)) score += 1;
    const body = ((article.answer.en || '') + (article.answer.hi || '')).toLowerCase();
    if (body.includes(tok)) score += 1;
  }

  // Hinglish helpers
  const hinglish = ['kaise', 'kese', 'kyu', 'kyun', 'nahi', 'nahin', 'problem', 'issue', 'help', 'madad', 'chahiye'];
  for (const h of hinglish) {
    if (q.includes(h)) {
      for (const topic of article.topics) {
        if (q.includes(topic)) score += 3;
      }
    }
  }

  const numMap = {
    '1': 'register', '2': 'login', '3': 'premium', '4': 'profile',
    '5': 'matches', '6': 'chat', '7': 'verification', '8': 'payment', '9': 'agent',
  };
  if (numMap[q] === article.id) score += 20;

  if (article.id === 'family' && q.includes('family')) score += 10;
  if (article.id === 'pending' && (q.includes('pending') || q.includes('approve'))) score += 8;

  return score;
}

function findMatches(query, limit = 3) {
  return ARTICLES.map((a) => ({ article: a, score: scoreArticle(query, a) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function buildFallback(query, lang, matches) {
  if (matches.length >= 2) {
    const lines = matches.map(({ article }) => {
      const title = article.title[lang] || article.title.en;
      const snippet = (article.answer[lang] || article.answer.en).split('\n')[0].slice(0, 80);
      return `• **${title}** — ${snippet}…`;
    });
    return {
      reply: lang === 'hi'
        ? `🔍 **"${query}"** से related topics:\n\n${lines.join('\n')}\n\nकिसी topic पर detail चाहिए तो वो keyword लिखें।`
        : `🔍 Topics related to **"${query}"**:\n\n${lines.join('\n')}\n\nType a topic name for full details, or try [Help Center](/help).`,
      intent: 'search_results',
      followUps: matches.slice(0, 4).map(({ article }) => ({
        label: article.title[lang] || article.title.en,
        text: article.topics[0],
      })),
    };
  }

  return {
    reply: lang === 'hi'
      ? `🤔 मुझे exact match नहीं मिला।\n\n[Help Center](/help) देखें या नीचे topic चुनें:\n\n📝 Register · 🔐 Login · ⭐ Premium · 💑 Matches · 💬 Chat · 🧑‍💼 Agent`
      : `🤔 I couldn't find an exact match for **"${query}"**.\n\nTry [Help Center](/help) or pick a topic:\n\n📝 Register · 🔐 Login · ⭐ Premium · 💑 Matches · 💬 Chat · 🧑‍💼 Agent`,
    intent: 'fallback',
    followUps: [
      { label: '📝 Register', text: 'register' },
      { label: '⭐ Premium', text: 'premium' },
      { label: '🗺️ Site map', text: 'website guide' },
      { label: '🧑‍💼 Agent', text: 'agent' },
    ],
  };
}

/**
 * @param {string} query
 * @param {{ lang?: string, userName?: string, isPremium?: boolean }} ctx
 */
export function processSupportQuery(query, ctx = {}) {
  const lang = ctx.lang || detectLang(query);
  const q = (query || '').trim();

  if (!q) {
    const g = ARTICLES.find((a) => a.id === 'greeting');
    return {
      reply: personalize(g.answer[lang] || g.answer.en, ctx),
      intent: 'greeting',
      followUps: g.followUps || [],
      actions: g.links || [],
      confidence: 1,
      transferToAgent: false,
    };
  }

  if (/^(hi+|hello+|hey+|namaste|help|start)$/i.test(q) || q === '?' || q === 'help me') {
    const g = ARTICLES.find((a) => a.id === 'greeting');
    return {
      reply: personalize(g.answer[lang] || g.answer.en, ctx),
      intent: 'greeting',
      followUps: g.followUps || [],
      actions: [],
      confidence: 1,
      transferToAgent: false,
    };
  }

  const matches = findMatches(q, 5);
  const best = matches[0];

  if (!best || best.score < 2) {
    const fb = buildFallback(q, lang, matches);
    return { ...fb, actions: [], confidence: 0, transferToAgent: false };
  }

  const { article, score } = best;
  const confidence = Math.min(1, score / 20);

  if (AGENT_IDS.has(article.id)) {
    return {
      reply: personalize(article.answer[lang] || article.answer.en, ctx),
      intent: 'agent',
      followUps: [],
      actions: article.links || [],
      confidence: 1,
      transferToAgent: true,
    };
  }

  let reply = article.answer[lang] || article.answer.en;

  if (confidence < 0.5 && matches[1] && matches[1].score >= 3) {
    const also = matches[1].article.title[lang] || matches[1].article.title.en;
    reply += lang === 'hi'
      ? `\n\n💡 **Related:** ${also} — "${matches[1].article.topics[0]}" type करें।`
      : `\n\n💡 **Related:** ${also} — type "${matches[1].article.topics[0]}" for more.`;
  }

  reply = personalize(reply, ctx);

  return {
    reply,
    intent: article.id,
    followUps: article.followUps || [],
    actions: article.links || [],
    confidence,
    transferToAgent: false,
  };
}

function personalize(text, ctx) {
  let out = text;
  if (ctx.userName) {
    out = out.replace('Hello!', `Hello **${ctx.userName.split(' ')[0]}**!`);
    out = out.replace('नमस्ते!', `नमस्ते **${ctx.userName.split(' ')[0]}**!`);
  }
  if (ctx.isPremium) {
    out += '\n\n⭐ _You have an active premium plan — enjoy all unlocked features!_';
  }
  return out;
}

export function getGreetingText(lang = 'en', ctx = {}) {
  const g = ARTICLES.find((a) => a.id === 'greeting');
  return personalize(g.answer[lang] || g.answer.en, ctx);
}

export const ESCALATE_PROMPT = {
  en: '\n\n---\n🧑‍💼 **Need personal help?** Your issue seems custom. Tap **Connect Live Agent** below — our team will assist you directly.',
  hi: '\n\n---\n🧑‍💼 **Personal help chahiye?** Aapka issue custom lag raha hai. Neeche **Connect Live Agent** dabayein — team aapki madad karegi.',
};

export function getDefaultFollowUps(lang = 'en') {
  const g = ARTICLES.find((a) => a.id === 'greeting');
  return g?.followUps || [];
}

export function getNumberedMenu(lang = 'en') {
  const items = [
    { n: '1', label: lang === 'hi' ? 'रजिस्टर' : 'Register', text: 'register' },
    { n: '2', label: lang === 'hi' ? 'लॉगिन' : 'Login', text: 'login' },
    { n: '3', label: lang === 'hi' ? 'प्रीमियम' : 'Premium', text: 'premium' },
    { n: '4', label: lang === 'hi' ? 'प्रोफाइल' : 'Profile', text: 'profile' },
    { n: '5', label: lang === 'hi' ? 'मैच' : 'Matches', text: 'matches' },
    { n: '6', label: lang === 'hi' ? 'चैट' : 'Chat', text: 'chat' },
    { n: '7', label: lang === 'hi' ? 'वेरिफाई' : 'Verify', text: 'verification' },
    { n: '8', label: lang === 'hi' ? 'पेमेंट' : 'Payment', text: 'payment' },
    { n: '9', label: lang === 'hi' ? 'एजेंट' : 'Agent', text: 'agent' },
  ];
  return items;
}

/** Page-aware tips based on current URL */
export function getContextualTips(pathname, lang = 'en') {
  const p = pathname || '/';
  const tips = {
    '/dashboard': {
      en: '📍 You\'re on **Dashboard**. Ask about matches, interests, profile completion, or premium upgrade.',
      hi: '📍 **Dashboard** par ho. Matches, interests, profile ya premium ke baare mein pucho.',
      quick: ['how to find matches', 'send interest', 'premium plans'],
    },
    '/premium': {
      en: '📍 Viewing **Premium Plans**. Ask about benefits, payment, coupons, free trial, or refund.',
      hi: '📍 **Premium** page par ho. Benefits, payment, coupon, trial pucho.',
      quick: ['premium plans', 'how to pay', 'free trial'],
    },
    '/search': {
      en: '📍 **Search** page — use kundali filters, save search alerts. Ask me how!',
      hi: '📍 **Search** — kundali filter, save search alerts. Pucho kaise!',
      quick: ['saved search alert', 'kundali filter', 'find matches'],
    },
    '/matches': {
      en: '📍 **Matches** — browse recommendations. Ask about sending interest or shortlist.',
      hi: '📍 **Matches** — interest bhejna ya shortlist ke baare mein pucho.',
      quick: ['send interest', 'shortlist', 'premium plans'],
    },
    '/profile/edit': {
      en: '📍 **Edit Profile** — About Me needs 50+ words. Ask about photos, kundali, video intro.',
      hi: '📍 **Edit Profile** — About Me 50+ words. Photo, kundali, video pucho.',
      quick: ['about me', 'kundali match', 'intro video'],
    },
    '/interests': {
      en: '📍 **Interests** — track sent/received proposals. Ask about accept, withdraw, or chat.',
      hi: '📍 **Interests** — accept, withdraw, chat ke baare mein pucho.',
      quick: ['send interest', 'chat', 'withdraw interest'],
    },
    '/chat': {
      en: '📍 **Chat** — messaging needs premium/trial. Ask if chat not working.',
      hi: '📍 **Chat** — premium chahiye. Problem ho to pucho.',
      quick: ['cant chat', 'premium plans', 'send interest'],
    },
    '/settings': {
      en: '📍 **Settings** — privacy, family login, notifications. Ask anything!',
      hi: '📍 **Settings** — family login, privacy pucho.',
      quick: ['family login setup', 'hide phone', 'notification'],
    },
  };
  const key = Object.keys(tips).find((k) => p === k || p.startsWith(k + '/'));
  if (!key) return null;
  const t = tips[key];
  return {
    tip: t[lang] || t.en,
    quick: (t.quick || []).map((text) => {
      const match = findMatches(text, 1)[0];
      const label = match?.article?.title[lang] || match?.article?.title.en || text;
      return { label, text };
    }),
  };
}

/** Autocomplete suggestions while typing */
export function searchSuggestions(query, lang = 'en', limit = 6) {
  const q = (query || '').trim();
  if (q.length < 2) return [];
  const matches = findMatches(q, limit);
  return matches.map(({ article }) => ({
    label: article.title[lang] || article.title.en,
    text: article.phrases?.[0] || article.topics[0],
    id: article.id,
  }));
}

export function formatLivePlans(plans, lang = 'en') {
  if (!plans?.length) return '';
  const lines = plans
    .filter((p) => p.plan !== 'FREE')
    .slice(0, 4)
    .map((p) => `• **${p.plan}** — ₹${Number(p.price).toLocaleString('en-IN')}/${p.durationDays || 30} days`);
  if (!lines.length) return '';
  return lang === 'hi'
    ? `\n\n💰 **Live Plans:**\n${lines.join('\n')}\n\n[Premium](/premium) par details dekhein.`
    : `\n\n💰 **Live Plans (from site):**\n${lines.join('\n')}\n\nSee full details on [Premium](/premium).`;
}

export function getPopularQuestions(lang = 'en') {
  const ids = [
    'register', 'premium', 'matches', 'interest', 'chat', 'kundali',
    'verification', 'family', 'shortlist', 'pending', 'navigation',
  ];
  return ids.map((id) => {
    const a = ARTICLES.find((x) => x.id === id);
    return { label: a.title[lang] || a.title.en, text: a.topics[0] };
  });
}

export function getQuickCategories(lang = 'en') {
  return [
    { icon: '📝', label: lang === 'hi' ? 'रजिस्टर' : 'Register', text: 'register' },
    { icon: '🔐', label: lang === 'hi' ? 'लॉगिन' : 'Login', text: 'login' },
    { icon: '⭐', label: lang === 'hi' ? 'प्रीमियम' : 'Premium', text: 'premium' },
    { icon: '👤', label: lang === 'hi' ? 'प्रोफाइल' : 'Profile', text: 'complete profile' },
    { icon: '💑', label: lang === 'hi' ? 'मैच' : 'Matches', text: 'matches' },
    { icon: '💌', label: lang === 'hi' ? 'इंटरेस्ट' : 'Interest', text: 'send interest' },
    { icon: '💬', label: lang === 'hi' ? 'चैट' : 'Chat', text: 'chat' },
    { icon: '⚖️', label: lang === 'hi' ? 'कुंडली' : 'Kundali', text: 'kundali match' },
    { icon: '👨‍👩‍👧', label: lang === 'hi' ? 'Family' : 'Family', text: 'family login setup' },
    { icon: '🔖', label: lang === 'hi' ? 'Shortlist' : 'Shortlist', text: 'shortlist' },
    { icon: '🎬', label: lang === 'hi' ? 'Video' : 'Video', text: 'intro video' },
    { icon: '🗺️', label: lang === 'hi' ? 'Guide' : 'Guide', text: 'website guide' },
    { icon: '🧑‍💼', label: lang === 'hi' ? 'एजेंट' : 'Agent', text: 'agent' },
  ];
}
