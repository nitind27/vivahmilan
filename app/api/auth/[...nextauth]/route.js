import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
            'SELECT id, email, name, password, role, isActive, isPremium, isVerified, adminVerified, freeTrialExpiry, needsPassword FROM `user` WHERE email = ?',
            [credentials.email]
          );
          if (!user || !user.password) return null;
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;
          if (!user.isActive) throw new Error('Account suspended by admin');
          if (user.role !== 'ADMIN' && !user.adminVerified) throw new Error('PENDING_APPROVAL');
          const trialActive = user.freeTrialExpiry && new Date(user.freeTrialExpiry) > new Date();
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isPremium: !!user.isPremium,
            freeTrialActive: !!trialActive,
            freeTrialExpiry: user.freeTrialExpiry ? user.freeTrialExpiry.toISOString() : null,
            isVerified: !!user.isVerified,
            adminVerified: !!user.adminVerified,
            needsPassword: !!user.needsPassword,
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
        // Ensure needsPassword column exists
        try {
          await execute(`ALTER TABLE \`user\` ADD COLUMN IF NOT EXISTS needsPassword TINYINT(1) DEFAULT 0`);
        } catch {}

        const now = new Date();
        const dbUser = await queryOne('SELECT * FROM `user` WHERE email = ?', [user.email]);

        if (!dbUser) {
          // ── New Google user: create user + profile, then redirect to complete profile ──
          const userId    = randomUUID();
          const profileId = randomUUID();

          await execute(
            `INSERT INTO \`user\`
               (id, name, email, role, isActive, isVerified, adminVerified,
                verificationBadge, isPremium, profileBoost, phoneVerified,
                loginOtpEnabled, needsPassword, createdAt, updatedAt)
             VALUES (?, ?, ?, 'USER', 1, 0, 0, 0, 0, 0, 0, 0, 1, ?, ?)`,
            [userId, user.name || user.email.split('@')[0], user.email, now, now]
          );

          await execute(
            `INSERT INTO profile
               (id, userId, profileComplete, maritalStatus, smoking, drinking,
                hidePhone, hidePhoto, createdAt, updatedAt)
             VALUES (?, ?, 10, 'NEVER_MARRIED', 'NO', 'NO', 0, 0, ?, ?)`,
            [profileId, userId, now, now]
          );

          // Don't create session — redirect to profile completion page
          const encodedEmail = encodeURIComponent(user.email);
          const encodedName  = encodeURIComponent(user.name || '');
          return `/register/complete?email=${encodedEmail}&name=${encodedName}`;
        }

        // ── Existing user ───────────────────────────────────────────────
        if (!dbUser.isActive) return '/login?error=AccountSuspended';

        // Not yet approved — redirect to pending page (don't return false)
        if (dbUser.role !== 'ADMIN' && !dbUser.adminVerified) {
          return '/login?error=PENDING_APPROVAL';
        }

        user.id            = dbUser.id;
        user.role          = dbUser.role;
        user.isPremium     = !!dbUser.isPremium;
        user.isVerified    = !!dbUser.isVerified;
        user.adminVerified = !!dbUser.adminVerified;
        user.needsPassword = !!dbUser.needsPassword;
        user.isNewUser     = false;
        const trialActive  = dbUser.freeTrialExpiry && new Date(dbUser.freeTrialExpiry) > new Date();
        user.freeTrialActive = !!trialActive;
        user.freeTrialExpiry = dbUser.freeTrialExpiry ? dbUser.freeTrialExpiry.toISOString() : null;
        return true;
      } catch (err) {
        console.error('Google signIn error:', err);
        // Return redirect instead of false to avoid AccessDenied error page
        return '/login?error=ServerError';
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id            = user.id;
        token.role          = user.role;
        token.isPremium     = user.isPremium;
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
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },

  pages: { signIn: '/login', error: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
