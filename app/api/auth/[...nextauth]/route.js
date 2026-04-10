import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/db';

export const authOptions = {
  // Remove adapter for JWT strategy — not needed and causes conflicts
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
          const user = await queryOne('SELECT id, email, name, password, role, isActive, isPremium, isVerified, adminVerified, freeTrialExpiry FROM `user` WHERE email = ?', [credentials.email]);
          if (!user || !user.password) return null;
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;
          if (!user.isActive) throw new Error('Account suspended by admin');
          // Block login until admin approves (skip for ADMIN role)
          if (user.role !== 'ADMIN' && !user.adminVerified) throw new Error('PENDING_APPROVAL');
          // Free trial check — kept separate from isPremium
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
          };} catch (err) {
          console.error('Auth error:', err.message);
          throw err;
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isPremium = user.isPremium;
        token.freeTrialActive = user.freeTrialActive;
        token.freeTrialExpiry = user.freeTrialExpiry || null;
        token.isVerified = user.isVerified;
      }
      if (trigger === 'update' && session) {
        token.isPremium = session.isPremium;
        token.freeTrialActive = session.freeTrialActive;
        token.freeTrialExpiry = session.freeTrialExpiry || null;
        token.isVerified = session.isVerified;
      }
      // Remove image/picture from token to prevent header too large error
      delete token.picture;
      delete token.image;
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isPremium = token.isPremium;
        session.user.freeTrialActive = token.freeTrialActive;
        session.user.freeTrialExpiry = token.freeTrialExpiry || null;
        session.user.isVerified = token.isVerified;
      }
      // Don't put image in session — fetch it from /api/profile instead
      delete session.user.image;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Let the login page handle role-based redirect via query param
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
  pages: { signIn: '/login', error: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
