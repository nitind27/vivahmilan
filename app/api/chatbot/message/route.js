import { NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import { randomUUID } from 'crypto';

// ── Multilingual knowledge base ───────────────────────────────────────────────
const KB = {
  en: {
    greeting: `👋 Hello! Welcome to **Vivah Milan** support.\n\nI can help you with:\n1️⃣ How to Register\n2️⃣ How to Login\n3️⃣ Premium Plans & Benefits\n4️⃣ Profile Setup\n5️⃣ Finding Matches\n6️⃣ Chat & Interests\n7️⃣ Verification & Safety\n8️⃣ Payment & Refund\n9️⃣ Talk to a human agent\n\nType a number or ask anything!`,
    register: `📝 **How to Register on Vivah Milan:**\n\n1. Go to [Register](/register) page\n2. Enter your **Name, Email, Password** and Phone\n3. Select your **Gender**\n4. Click **Create Account**\n5. Check your email for **OTP verification**\n6. Enter the 6-digit OTP to verify\n7. Wait for **Admin Approval** (usually within 24 hours)\n8. Once approved, you can login and complete your profile!\n\n💡 Tip: Use a valid email — OTP is sent there.`,
    login: `🔐 **How to Login:**\n\n1. Go to [Login](/login) page\n2. Enter your **Email & Password**\n3. Or click **Continue with Google** for Google login\n4. If you forgot password, click **Forgot Password**\n\n⚠️ Note: Your account must be **admin approved** before you can login. If you see "Pending Approval", please wait 24 hours.\n\nForgot password? → [Reset here](/forgot-password)`,
    premium: `⭐ **Premium Plans:**\n\n🥈 **Silver - ₹749/month**\n• 50 interests per day\n• See contact details\n• See who viewed your profile\n\n🥇 **Gold - ₹1,499/month**\n• Unlimited interests\n• Chat with matches\n• Profile boost\n• See who viewed\n\n💎 **Platinum - ₹2,999/month**\n• Everything in Gold\n• AI Match Score\n• Dedicated support\n\n🆓 **Free Trial** available after profile completion!\n\nUpgrade at [Premium](/premium) page.`,
    profile: `👤 **Setting Up Your Profile:**\n\n1. Login and go to [Dashboard](/dashboard)\n2. Click **Edit Profile**\n3. Fill in: Age, Height, Religion, Education, Profession, Location\n4. Add **Partner Preferences**\n5. Upload your **Photos** (at least 1 required)\n6. Upload **ID Document** for verification badge\n7. Complete 100% profile for better matches!\n\n💡 Complete profile gets **Free Trial** automatically.`,
    matches: `💑 **Finding Matches:**\n\n1. Go to [Matches](/matches) page\n2. Browse **Bride/Groom/NRI** categories\n3. Use [Search](/search) for advanced filters:\n   • Age, Height, Religion\n   • Education, Profession\n   • Location (Country/State/City)\n4. Click **Send Interest** on any profile\n5. If they accept → you can chat (Gold/Platinum)\n6. **Shortlist** profiles you like\n\n🔍 Better profile = Better matches!`,
    chat: `💬 **Chat & Interests:**\n\n**Interests:**\n• Send interest from any profile\n• They get notified and can Accept/Reject\n• FREE: 5 interests/day\n• Silver: 50/day, Gold/Platinum: Unlimited\n\n**Chat:**\n• Available for **Gold & Platinum** members\n• Go to [Chat](/chat) page\n• Send text, images, documents\n• Share live location\n\n📱 Enable notifications for instant alerts!`,
    verification: `🛡️ **Verification & Safety:**\n\n**Profile Verification:**\n1. Go to Dashboard → Upload ID Document\n2. Admin reviews within 24-48 hours\n3. Get ✅ Verified Badge on your profile\n\n**Safety Tips:**\n• Never share personal financial info\n• Meet in public places first\n• Report suspicious profiles\n• Use [Report Abuse](/report-abuse) if needed\n• Block users from their profile\n\n🔒 Your data is encrypted and secure.`,
    payment: `💳 **Payment & Refund:**\n\n**Payment Methods:**\n• Credit/Debit Cards\n• UPI (GPay, PhonePe)\n• Net Banking, Wallets\n• EMI Options\n\n**Refund Policy:**\n• 7-day refund window\n• Technical issues → Full refund\n• Duplicate payment → Full refund\n• Change of mind → Not eligible\n\nFor refunds: Email **refunds@vivahmilan.com**\nFull policy: [Refund Policy](/refund)`,
    agent: `🧑‍💼 **Connecting you to a human agent...**\n\nPlease wait while we connect you to our support team. An agent will join this chat shortly.\n\nYou can type your issue below and the agent will respond.`,
    fallback: `🤔 I didn't quite understand that. Here's what I can help with:\n\n1️⃣ Register  2️⃣ Login  3️⃣ Premium\n4️⃣ Profile  5️⃣ Matches  6️⃣ Chat\n7️⃣ Verification  8️⃣ Payment  9️⃣ Agent\n\nType a number or keyword!`,
  },
  hi: {
    greeting: `👋 नमस्ते! **Vivah Milan** सपोर्ट में आपका स्वागत है।\n\nमैं इनमें मदद कर सकता हूँ:\n1️⃣ रजिस्टर कैसे करें\n2️⃣ लॉगिन कैसे करें\n3️⃣ प्रीमियम प्लान\n4️⃣ प्रोफाइल सेटअप\n5️⃣ मैच कैसे खोजें\n6️⃣ चैट और इंटरेस्ट\n7️⃣ वेरिफिकेशन और सुरक्षा\n8️⃣ पेमेंट और रिफंड\n9️⃣ एजेंट से बात करें\n\nनंबर टाइप करें या कुछ भी पूछें!`,
    register: `📝 **Vivah Milan पर रजिस्टर कैसे करें:**\n\n1. [Register](/register) पेज पर जाएं\n2. **नाम, ईमेल, पासवर्ड** और फोन डालें\n3. अपना **लिंग** चुनें\n4. **Account बनाएं** पर क्लिक करें\n5. ईमेल पर **OTP** चेक करें\n6. 6 अंकों का OTP डालें\n7. **Admin Approval** का इंतजार करें (24 घंटे)\n8. अप्रूव होने के बाद लॉगिन करें!\n\n💡 सही ईमेल डालें — OTP वहीं आएगा।`,
    login: `🔐 **लॉगिन कैसे करें:**\n\n1. [Login](/login) पेज पर जाएं\n2. **ईमेल और पासवर्ड** डालें\n3. या **Google से लॉगिन** करें\n4. पासवर्ड भूल गए? **Forgot Password** पर क्लिक करें\n\n⚠️ नोट: लॉगिन के लिए **Admin Approval** जरूरी है। "Pending Approval" दिखे तो 24 घंटे इंतजार करें।\n\nपासवर्ड रीसेट: [यहाँ क्लिक करें](/forgot-password)`,
    premium: `⭐ **प्रीमियम प्लान:**\n\n🥈 **Silver - ₹749/महीना**\n• 50 इंटरेस्ट/दिन\n• कॉन्टैक्ट डिटेल देखें\n• प्रोफाइल व्यूअर देखें\n\n🥇 **Gold - ₹1,499/महीना**\n• अनलिमिटेड इंटरेस्ट\n• चैट करें\n• प्रोफाइल बूस्ट\n\n💎 **Platinum - ₹2,999/महीना**\n• Gold सब कुछ\n• AI मैच स्कोर\n\n🆓 प्रोफाइल पूरी करने पर **Free Trial** मिलता है!\n\n[Premium](/premium) पेज पर अपग्रेड करें।`,
    profile: `👤 **प्रोफाइल कैसे बनाएं:**\n\n1. लॉगिन करें → [Dashboard](/dashboard) जाएं\n2. **Edit Profile** पर क्लिक करें\n3. उम्र, धर्म, शिक्षा, पेशा, शहर भरें\n4. **Partner Preferences** डालें\n5. **फोटो** अपलोड करें\n6. **ID Document** अपलोड करें\n7. 100% प्रोफाइल = बेहतर मैच!\n\n💡 पूरी प्रोफाइल पर Free Trial मिलता है।`,
    matches: `💑 **मैच कैसे खोजें:**\n\n1. [Matches](/matches) पेज पर जाएं\n2. Bride/Groom/NRI कैटेगरी देखें\n3. [Search](/search) में फिल्टर लगाएं:\n   • उम्र, धर्म, शिक्षा\n   • शहर, देश\n4. **Interest भेजें**\n5. Accept होने पर चैट करें\n6. पसंद आए तो **Shortlist** करें`,
    chat: `💬 **चैट और इंटरेस्ट:**\n\n**Interest:**\n• किसी भी प्रोफाइल से भेजें\n• FREE: 5/दिन, Silver: 50/दिन\n• Gold/Platinum: अनलिमिटेड\n\n**Chat:**\n• Gold और Platinum के लिए\n• [Chat](/chat) पेज पर जाएं\n• टेक्स्ट, फोटो, डॉक्यूमेंट भेजें\n• Live Location शेयर करें`,
    verification: `🛡️ **वेरिफिकेशन और सुरक्षा:**\n\n**वेरिफिकेशन:**\n1. Dashboard → ID Document अपलोड करें\n2. Admin 24-48 घंटे में रिव्यू करेगा\n3. ✅ Verified Badge मिलेगा\n\n**सुरक्षा टिप्स:**\n• पैसे की जानकारी कभी न दें\n• पहली मुलाकात सार्वजनिक जगह पर\n• संदिग्ध प्रोफाइल रिपोर्ट करें\n• [Report Abuse](/report-abuse) का उपयोग करें`,
    payment: `💳 **पेमेंट और रिफंड:**\n\n**पेमेंट तरीके:**\n• Credit/Debit Card\n• UPI (GPay, PhonePe)\n• Net Banking, Wallet\n\n**रिफंड:**\n• 7 दिन के अंदर रिक्वेस्ट करें\n• Technical issue → पूरा रिफंड\n• Duplicate payment → पूरा रिफंड\n\nरिफंड के लिए: **refunds@vivahmilan.com**\n[Refund Policy](/refund) देखें`,
    agent: `🧑‍💼 **आपको एक एजेंट से जोड़ा जा रहा है...**\n\nकृपया प्रतीक्षा करें। हमारी सपोर्ट टीम जल्द ही इस चैट में शामिल होगी।\n\nनीचे अपनी समस्या टाइप करें।`,
    fallback: `🤔 मुझे समझ नहीं आया। मैं इनमें मदद कर सकता हूँ:\n\n1️⃣ रजिस्टर  2️⃣ लॉगिन  3️⃣ प्रीमियम\n4️⃣ प्रोफाइल  5️⃣ मैच  6️⃣ चैट\n7️⃣ वेरिफिकेशन  8️⃣ पेमेंट  9️⃣ एजेंट\n\nनंबर या कीवर्ड टाइप करें!`,
  },
};

// ── Language detection ────────────────────────────────────────────────────────
function detectLang(text) {
  // Hindi unicode range
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  return 'en';
}

// ── Intent matching ───────────────────────────────────────────────────────────
function getIntent(text, lang) {
  const t = text.toLowerCase().trim();

  // Number shortcuts
  if (t === '1' || /regist|sign.?up|account bana|रजिस्टर|अकाउंट/.test(t)) return 'register';
  if (t === '2' || /login|log.?in|sign.?in|लॉगिन|साइन इन/.test(t)) return 'login';
  if (t === '3' || /premium|plan|gold|silver|platinum|price|cost|subscription|प्रीमियम|प्लान|कीमत/.test(t)) return 'premium';
  if (t === '4' || /profile|setup|complete|edit|photo|प्रोफाइल|फोटो/.test(t)) return 'profile';
  if (t === '5' || /match|find|search|bride|groom|मैच|खोज|दुल्हन|दूल्हा/.test(t)) return 'matches';
  if (t === '6' || /chat|message|interest|talk|बात|चैट|मैसेज/.test(t)) return 'chat';
  if (t === '7' || /verif|safe|secure|id|document|badge|वेरिफ|सुरक्षा/.test(t)) return 'verification';
  if (t === '8' || /pay|refund|money|cashfree|upi|पेमेंट|रिफंड|पैसे/.test(t)) return 'payment';
  if (t === '9' || /agent|human|support|help|staff|एजेंट|इंसान|सपोर्ट/.test(t)) return 'agent';
  if (/hi|hello|hey|helo|namaste|नमस्ते|हेलो/.test(t)) return 'greeting';

  return 'fallback';
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { sessionId, message, userId } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const now = new Date();
    let sid = sessionId;

    // Create session if new
    if (!sid) {
      sid = randomUUID();
      const lang = detectLang(message);
      await execute(
        `INSERT INTO support_session (id, userId, status, language, createdAt, updatedAt) VALUES (?, ?, 'bot', ?, ?, ?)`,
        [sid, userId || null, lang, now, now]
      );
    }

    // Get session
    const session = await queryOne('SELECT * FROM support_session WHERE id = ?', [sid]);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Save user message
    await execute(
      `INSERT INTO support_message (id, sessionId, sender, content, createdAt) VALUES (?, ?, 'user', ?, ?)`,
      [randomUUID(), sid, message.trim(), now]
    );

    // If live agent session, don't auto-respond
    if (session.status === 'live') {
      return NextResponse.json({ sessionId: sid, status: 'live', botReply: null });
    }

    // If ended
    if (session.status === 'ended') {
      return NextResponse.json({ sessionId: sid, status: 'ended', botReply: null });
    }

    // Detect language from message
    const lang = detectLang(message);
    const kb = KB[lang] || KB.en;

    // Update session language
    await execute('UPDATE support_session SET language = ?, updatedAt = ? WHERE id = ?', [lang, now, sid]);

    const intent = getIntent(message, lang);
    let botReply = kb[intent] || kb.fallback;
    let newStatus = 'bot';

    // If agent requested, update status
    if (intent === 'agent') {
      newStatus = 'live';
      await execute('UPDATE support_session SET status = ?, updatedAt = ? WHERE id = ?', ['live', now, sid]);
    }

    // Save bot reply
    await execute(
      `INSERT INTO support_message (id, sessionId, sender, content, createdAt) VALUES (?, ?, 'bot', ?, ?)`,
      [randomUUID(), sid, botReply, now]
    );

    return NextResponse.json({ sessionId: sid, status: newStatus, botReply, intent });
  } catch (err) {
    console.error('Chatbot error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET: fetch messages for a session
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  const messages = await query(
    'SELECT * FROM support_message WHERE sessionId = ? ORDER BY createdAt ASC',
    [sessionId]
  );
  const session = await queryOne('SELECT * FROM support_session WHERE id = ?', [sessionId]);
  return NextResponse.json({ messages, session });
}
