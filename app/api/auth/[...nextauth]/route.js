import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, execute } from '@/lib/db';
import { recordRegistrationGeo, recordLoginGeo, getClientIPFromHeaders } from '@/lib/geoTracking';
import { randomUUID } from 'crypto';
import https from 'https';
import { getPortalAccessForUser } from '@/lib/portalAccess';
import { isDeveloperBypassEmail } from '@/lib/developerAccess';

// Force IPv6 for Google OAuth — server has IPv6 connectivity but IPv4 is unreachable
const ipv6Agent = new https.Agent({ family: 6 });

/** Session length when "Remember me" is checked vs not */
const SESSION_REMEMBER_SEC = 60 * 60 * 24 * 30; // 30 days
const SESSION_DEFAULT_SEC = 60 * 60 * 24; // 1 day

const PROFILE_REQUIRED = ['gender', 'dob', 'height', 'religion', 'education', 'profession', 'country', 'city', 'aboutMe'];

/** Load DB user into JWT after Google OAuth (OAuth profile alone lacks role/portal flags). */
async function applyDbUserToToken(token, email) {
  const dbUser = await queryOne(
    'SELECT id, name, email, role, isActive, isPremium, premiumPlan, isVerified, adminVerified, needsPassword, freeTrialExpiry FROM `user` WHERE email = ?',
    [String(email).trim().toLowerCase()]
  );
  if (!dbUser) return token;

  let profileIncomplete = false;
  if (dbUser.role !== 'ADMIN') {
    const profile = await queryOne(
      'SELECT gender, dob, height, religion, education, profession, country, city, aboutMe FROM profile WHERE userId = ?',
      [dbUser.id]
    );
    profileIncomplete = PROFILE_REQUIRED.some(f => !profile?.[f]);
  }

  const portalAccess = await getPortalAccessForUser({ email: dbUser.email, role: dbUser.role });
  const trialActive = dbUser.freeTrialExpiry && new Date(dbUser.freeTrialExpiry) > new Date();

  token.id = dbUser.id;
  token.sub = dbUser.id;
  token.role = dbUser.role;
  token.isPremium = !!dbUser.isPremium;
  token.premiumPlan = dbUser.premiumPlan || null;
  token.freeTrialActive = !!trialActive;
  token.freeTrialExpiry = dbUser.freeTrialExpiry ? dbUser.freeTrialExpiry.toISOString() : null;
  token.isVerified = !!dbUser.isVerified;
  token.adminVerified = !!dbUser.adminVerified;
  token.needsPassword = !!dbUser.needsPassword;
  token.isNewUser = profileIncomplete;
  token.portalAccessGranted = portalAccess.granted;
  return token;
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      httpOptions: {
        timeout: 15000,
        agent: ipv6Agent, // force IPv6 — server's IPv4 is unreachable but IPv6 works
      },
    }),
    // ── Family Login Provider ──────────────────────────────────────────
    CredentialsProvider({
      id: 'family-login',
      name: 'Family Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const { ensureFeatureTables } = await import('@/lib/ensureFeatureTables.js');
        await ensureFeatureTables();
        const fa = await queryOne(
          'SELECT * FROM familyaccess WHERE email = ? AND isActive = 1',
          [credentials.email.trim().toLowerCase()]
        );
        if (!fa) return null;
        const valid = await bcrypt.compare(credentials.password, fa.password);
        if (!valid) return null;

        const owner = await queryOne(
          'SELECT id, name, email, role, isActive, isPremium, premiumPlan, isVerified, adminVerified, freeTrialExpiry FROM `user` WHERE id = ?',
          [fa.ownerUserId]
        );
        if (!owner?.isActive) return null;

        const trialActive = owner.freeTrialExpiry && new Date(owner.freeTrialExpiry) > new Date();
        const portalAccess = await getPortalAccessForUser({ email: fa.email, role: 'FAMILY' });
        return {
          id: owner.id,
          email: fa.email,
          name: `${fa.memberName} (${fa.relationship || 'Family'})`,
          role: 'FAMILY',
          isPremium: !!owner.isPremium,
          premiumPlan: owner.premiumPlan || null,
          freeTrialActive: !!trialActive,
          freeTrialExpiry: owner.freeTrialExpiry ? owner.freeTrialExpiry.toISOString() : null,
          isVerified: !!owner.isVerified,
          adminVerified: !!owner.adminVerified,
          familyAccessId: fa.id,
          ownerName: owner.name,
          rememberMe: false,
          portalAccessGranted: portalAccess.granted,
        };
      },
    }),
    // ── QR Code Login Provider ─────────────────────────────────────────
    CredentialsProvider({
      id: 'qr-login',
      name: 'QR Login',
      credentials: {
        qrToken: { label: 'QR Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.qrToken) return null;
        try {
          const decoded = jwt.verify(credentials.qrToken, process.env.NEXTAUTH_SECRET);
          if (!decoded.qrLogin) return null;

          const user = await queryOne(
            'SELECT id, email, name, role, isActive, isPremium, premiumPlan, isVerified, adminVerified, freeTrialExpiry FROM `user` WHERE id = ?',
            [decoded.id]
          );
          if (!user || !user.isActive) return null;

          const trialActive = user.freeTrialExpiry && new Date(user.freeTrialExpiry) > new Date();
          const portalAccess = await getPortalAccessForUser({ email: user.email, role: user.role });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isPremium: !!user.isPremium,
            premiumPlan: user.premiumPlan || null,
            freeTrialActive: !!trialActive,
            freeTrialExpiry: user.freeTrialExpiry ? user.freeTrialExpiry.toISOString() : null,
            isVerified: !!user.isVerified,
            adminVerified: !!user.adminVerified,
            needsPassword: false,
            isNewUser: false,
            portalAccessGranted: portalAccess.granted,
          };
        } catch (err) {
          console.error('QR login auth error:', err.message);
          return null;
        }
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        remember: { label: 'Remember Me', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const rememberMe = credentials.remember === 'true' || credentials.remember === true;
        try {
          const user = await queryOne(
            'SELECT id, email, name, password, role, isActive, isPremium, premiumPlan, isVerified, adminVerified, freeTrialExpiry FROM `user` WHERE email = ?',
            [credentials.email]
          );
          if (!user || !user.password) return null;
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;
          if (!user.isActive) throw new Error('Account suspended by admin');

          const isDevBypass = await isDeveloperBypassEmail(user.email);

          // ── Profile completion check (non-admin only) ──────────────────
          if (user.role !== 'ADMIN' && !isDevBypass) {
            const profile = await queryOne('SELECT gender, dob, height, religion, education, profession, country, city, aboutMe FROM profile WHERE userId = ?', [user.id]);
            const REQUIRED = ['gender','dob','height','religion','education','profession','country','city','aboutMe'];
            const missing = REQUIRED.filter(f => !profile?.[f]);
            if (missing.length > 0) {
              throw new Error(`PROFILE_INCOMPLETE:${credentials.email}`);
            }
          }

          if (user.role !== 'ADMIN' && !user.adminVerified && !isDevBypass) throw new Error('PENDING_APPROVAL');
          const trialActive = user.freeTrialExpiry && new Date(user.freeTrialExpiry) > new Date();
          const portalAccess = await getPortalAccessForUser({ email: user.email, role: user.role });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isPremium: !!user.isPremium,
            premiumPlan: user.premiumPlan || null,
            freeTrialActive: !!trialActive,
            freeTrialExpiry: user.freeTrialExpiry ? user.freeTrialExpiry.toISOString() : null,
            isVerified: !!user.isVerified,
            adminVerified: !!user.adminVerified,
            needsPassword: false,
            isNewUser: false,
            rememberMe,
            portalAccessGranted: portalAccess.granted,
          };
        } catch (err) {
          console.error('Auth error:', err.message);
          throw err;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: SESSION_REMEMBER_SEC,
    updateAge: SESSION_DEFAULT_SEC,
  },

  // Required behind Hostinger / reverse proxy — fixes "State cookie was missing"
  trustHost: true,

  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://') ?? process.env.NODE_ENV === 'production',

  cookies: {
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
        maxAge: 60 * 15,
      },
    },
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
        maxAge: 60 * 15,
      },
    },
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true;

      try {
        const now = new Date();
        const dbUser = await queryOne(
          'SELECT id, name, email, role, isActive, isPremium, premiumPlan, isVerified, adminVerified, needsPassword, freeTrialExpiry FROM `user` WHERE email = ?',
          [user.email]
        );

        if (!dbUser) {
          // ── Brand new Google user ──
          const userId = randomUUID();
          const profileId = randomUUID();
          const now = new Date();

          await execute(
            `INSERT INTO \`user\` (id, name, email, password, phone, role, isActive, isVerified, adminVerified, verificationBadge, isPremium, profileBoost, phoneVerified, loginOtpEnabled, emailVerified, createdAt, updatedAt, needsPassword)
             VALUES (?, ?, ?, NULL, NULL, 'USER', 1, 1, 0, 0, 0, 0, 0, 0, NOW(), ?, ?, 0)`,
            [userId, user.name || '', user.email, now, now]
          );

          await execute(
            `INSERT INTO profile (id, userId, gender, profileComplete, maritalStatus, smoking, drinking, hidePhone, hidePhoto, createdAt, updatedAt)
             VALUES (?, ?, NULL, 10, 'NEVER_MARRIED', 'NO', 'NO', 0, 0, ?, ?)`,
            [profileId, userId, now, now]
          );

          const { tryAutoAssignEarlyBirdOnSignup } = await import('@/lib/earlyBird');
          let earlyBird = { assigned: false };
          try {
            earlyBird = await tryAutoAssignEarlyBirdOnSignup(userId);
          } catch (e) {
            console.error('Early bird assign error:', e.message);
          }

          user.id = userId;
          user.role = 'USER';
          user.isVerified = true;
          user.adminVerified = false;
          user.isPremium = !!earlyBird.assigned;
          user.premiumPlan = earlyBird.assigned ? earlyBird.planId : null;
          user.isNewUser = true;
          const portalAccessNew = await getPortalAccessForUser({ email: user.email, role: 'USER' });
          user.portalAccessGranted = portalAccessNew.granted;

          const ip = await getClientIPFromHeaders();
          recordRegistrationGeo(userId, null, { platform: 'web-google' }, { ipOverride: ip }).catch(e =>
            console.error('[google signup] geo log error:', e.message)
          );

          return `/onboarding?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`;
        }

        // ── Existing user ──────────────────────────────────────────────
        if (!dbUser.isActive) return '/login?error=AccountSuspended';

        const isDevBypass = await isDeveloperBypassEmail(dbUser.email);
        const trialActive = dbUser.freeTrialExpiry && new Date(dbUser.freeTrialExpiry) > new Date();

        // Check profile completeness
        let isNewUser = false;
        if (dbUser.role !== 'ADMIN' && !isDevBypass) {
          const profile = await queryOne(
            'SELECT gender, dob, height, religion, education, profession, country, city, aboutMe FROM profile WHERE userId = ?',
            [dbUser.id]
          );
          const REQUIRED = ['gender','dob','height','religion','education','profession','country','city','aboutMe'];
          isNewUser = REQUIRED.some(f => !profile?.[f]);
        }

        // If profile incomplete, send back to onboarding
        if (isNewUser && dbUser.role !== 'ADMIN' && !isDevBypass) {
          user.id = dbUser.id;
          user.role = dbUser.role;
          user.isVerified = !!dbUser.isVerified;
          user.adminVerified = !!dbUser.adminVerified;
          user.isPremium = false;
          user.isNewUser = true;
          const portalAccessIncomplete = await getPortalAccessForUser({ email: dbUser.email, role: dbUser.role });
          user.portalAccessGranted = portalAccessIncomplete.granted;
          return `/onboarding?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`;
        }

        // Profile complete but not yet admin approved — show pending screen
        if (!dbUser.adminVerified && dbUser.role !== 'ADMIN' && !isDevBypass) {
          return '/login?error=PENDING_APPROVAL';
        }

        user.id            = dbUser.id;
        user.role          = dbUser.role;
        user.isPremium     = !!dbUser.isPremium;
        user.premiumPlan   = dbUser.premiumPlan || null;
        user.isVerified    = !!dbUser.isVerified;
        user.adminVerified = !!dbUser.adminVerified;
        user.needsPassword = !!dbUser.needsPassword;
        user.isNewUser     = false;
        user.freeTrialActive = !!trialActive;
        user.freeTrialExpiry = dbUser.freeTrialExpiry ? dbUser.freeTrialExpiry.toISOString() : null;

        const ip = await getClientIPFromHeaders();
        recordLoginGeo(dbUser.id, null, { platform: 'web-google' }, { ipOverride: ip }).catch(e =>
          console.error('[google login] geo log error:', e.message)
        );

        if (dbUser.role === 'ADMIN') return '/admin';
        const portalAccess = await getPortalAccessForUser({ email: dbUser.email, role: dbUser.role });
        user.portalAccessGranted = portalAccess.granted;
        // Let callbackUrl (/profile-launch) handle redirect; return true so JWT is always created
        return true;
      } catch (err) {
        console.error('Google signIn error:', err.message, err.stack);
        return '/login?error=ServerError';
      }
    },

    async jwt({ token, user, account, trigger, session }) {
      if (user?.email && account?.provider === 'google') {
        try {
          token = await applyDbUserToToken(token, user.email);
        } catch (e) {
          console.error('jwt google hydrate error:', e.message);
        }
      }
      if (user) {
        if (user.id) token.id = user.id;
        if (user.role) token.role = user.role;
        if (user.isPremium !== undefined) token.isPremium = user.isPremium;
        if (user.premiumPlan !== undefined) token.premiumPlan = user.premiumPlan;
        if (user.freeTrialActive !== undefined) token.freeTrialActive = user.freeTrialActive;
        if (user.freeTrialExpiry !== undefined) token.freeTrialExpiry = user.freeTrialExpiry || null;
        if (user.isVerified !== undefined) token.isVerified = user.isVerified;
        if (user.adminVerified !== undefined) token.adminVerified = user.adminVerified;
        if (user.needsPassword !== undefined) token.needsPassword = user.needsPassword;
        if (user.isNewUser !== undefined) token.isNewUser = user.isNewUser;
        token.rememberMe = !!user.rememberMe;
        if (user.familyAccessId) token.familyAccessId = user.familyAccessId;
        if (user.ownerName) token.ownerName = user.ownerName;
        if (user.portalAccessGranted !== undefined) {
          token.portalAccessGranted = user.portalAccessGranted;
        } else if (token.portalAccessGranted === undefined) {
          token.portalAccessGranted = true;
        }
        const maxAgeSec = token.rememberMe ? SESSION_REMEMBER_SEC : SESSION_DEFAULT_SEC;
        token.exp = Math.floor(Date.now() / 1000) + maxAgeSec;
      }
      if (trigger === 'update' && session) {
        if (session.isPremium     !== undefined) token.isPremium     = session.isPremium;
        if (session.freeTrialActive !== undefined) token.freeTrialActive = session.freeTrialActive;
        if (session.freeTrialExpiry !== undefined) token.freeTrialExpiry = session.freeTrialExpiry;
        if (session.isVerified    !== undefined) token.isVerified    = session.isVerified;
        if (session.needsPassword !== undefined) token.needsPassword = session.needsPassword;
        if (session.isNewUser     !== undefined) token.isNewUser     = session.isNewUser;
      }
      delete token.picture;
      delete token.image;
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id             = token.id;
        session.user.role           = token.role;
        session.user.isPremium      = token.isPremium;
        session.user.premiumPlan    = token.premiumPlan;
        session.user.freeTrialActive = token.freeTrialActive;
        session.user.freeTrialExpiry = token.freeTrialExpiry || null;
        session.user.isVerified     = token.isVerified;
        session.user.adminVerified  = token.adminVerified;
        session.user.needsPassword  = token.needsPassword || false;
        session.user.isNewUser      = token.isNewUser || false;
        session.user.familyAccessId = token.familyAccessId || null;
        session.user.ownerName      = token.ownerName || null;
        session.user.isFamilyLogin  = token.role === 'FAMILY';
        session.user.portalAccessGranted = token.portalAccessGranted === true;
      }
      delete session.user.image;
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allow relative paths and same-origin URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
    },
  },

  pages: { signIn: '/login', error: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
