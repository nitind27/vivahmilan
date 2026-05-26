import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, execute } from '@/lib/db';
import { recordRegistrationGeo, recordLoginGeo, getClientIPFromHeaders } from '@/lib/geoTracking';
import { randomUUID } from 'crypto';
import https from 'https';

// Force IPv6 for Google OAuth — server has IPv6 connectivity but IPv4 is unreachable
const ipv6Agent = new https.Agent({ family: 6 });

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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const user = await queryOne(
            'SELECT id, email, name, password, role, isActive, isPremium, premiumPlan, isVerified, adminVerified, freeTrialExpiry FROM `user` WHERE email = ?',
            [credentials.email]
          );
          if (!user || !user.password) return null;
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;
          if (!user.isActive) throw new Error('Account suspended by admin');

          // ── Profile completion check (non-admin only) ──────────────────
          if (user.role !== 'ADMIN') {
            const profile = await queryOne('SELECT gender, dob, height, religion, education, profession, country, city, aboutMe FROM profile WHERE userId = ?', [user.id]);
            const REQUIRED = ['gender','dob','height','religion','education','profession','country','city','aboutMe'];
            const missing = REQUIRED.filter(f => !profile?.[f]);
            if (missing.length > 0) {
              throw new Error(`PROFILE_INCOMPLETE:${credentials.email}`);
            }
          }

          if (user.role !== 'ADMIN' && !user.adminVerified) throw new Error('PENDING_APPROVAL');
          const trialActive = user.freeTrialExpiry && new Date(user.freeTrialExpiry) > new Date();
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
          };
        } catch (err) {
          console.error('Auth error:', err.message);
          throw err;
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },

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

          // Early Bird Auto-Assignment
          try {
            const ebConfigRow = await queryOne("SELECT value FROM siteconfig WHERE `key` = 'early_bird_settings'");
            if (ebConfigRow && ebConfigRow.value) {
              const ebConfig = JSON.parse(ebConfigRow.value);
              if (ebConfig.enabled && ebConfig.claimed < ebConfig.limit) {
                const endDate = new Date(Date.now() + (ebConfig.durationDays || 30) * 86400000);
                await execute(
                  "INSERT INTO subscription (id, userId, plan, status, amount, currency, paymentId, startDate, endDate, createdAt) VALUES (?, ?, ?, 'ACTIVE', 0, 'INR', 'EARLY_BIRD', NOW(), ?, NOW())",
                  [randomUUID(), userId, ebConfig.planId, endDate]
                );
                await execute(
                  "UPDATE \`user\` SET isPremium = 1, premiumPlan = ?, premiumExpiry = ? WHERE id = ?",
                  [ebConfig.planId, endDate, userId]
                );
                ebConfig.claimed += 1;
                await execute("UPDATE siteconfig SET value = ? WHERE `key` = 'early_bird_settings'", [JSON.stringify(ebConfig)]);
              }
            }
          } catch (e) {
            console.error('Early bird assign error:', e);
          }

          user.id = userId;
          user.role = 'USER';
          user.isVerified = true;
          user.adminVerified = false;
          user.isPremium = false;
          user.isNewUser = true;

          const ip = await getClientIPFromHeaders();
          recordRegistrationGeo(userId, null, { platform: 'web-google' }, { ipOverride: ip }).catch(e =>
            console.error('[google signup] geo log error:', e.message)
          );

          return `/onboarding?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`;
        }

        // ── Existing user ──────────────────────────────────────────────
        if (!dbUser.isActive) return '/login?error=AccountSuspended';

        const trialActive = dbUser.freeTrialExpiry && new Date(dbUser.freeTrialExpiry) > new Date();

        // Check profile completeness
        let isNewUser = false;
        if (dbUser.role !== 'ADMIN') {
          const profile = await queryOne(
            'SELECT gender, dob, height, religion, education, profession, country, city, aboutMe FROM profile WHERE userId = ?',
            [dbUser.id]
          );
          const REQUIRED = ['gender','dob','height','religion','education','profession','country','city','aboutMe'];
          isNewUser = REQUIRED.some(f => !profile?.[f]);
        }

        // If profile incomplete, send back to onboarding
        if (isNewUser && dbUser.role !== 'ADMIN') {
          user.id = dbUser.id;
          user.role = dbUser.role;
          user.isVerified = !!dbUser.isVerified;
          user.adminVerified = !!dbUser.adminVerified;
          user.isPremium = false;
          user.isNewUser = true;
          return `/onboarding?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`;
        }

        // Profile complete but not yet admin approved — show pending screen
        if (!dbUser.adminVerified && dbUser.role !== 'ADMIN') {
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

        return dbUser.role === 'ADMIN' ? '/admin' : true;
      } catch (err) {
        console.error('Google signIn error:', err.message, err.stack);
        return '/login?error=ServerError';
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id            = user.id;
        token.role          = user.role;
        token.isPremium     = user.isPremium;
        token.premiumPlan   = user.premiumPlan;
        token.freeTrialActive = user.freeTrialActive;
        token.freeTrialExpiry = user.freeTrialExpiry || null;
        token.isVerified    = user.isVerified;
        token.adminVerified = user.adminVerified;
        token.needsPassword = user.needsPassword || false;
        token.isNewUser     = user.isNewUser || false;
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
