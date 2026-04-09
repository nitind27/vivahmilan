import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

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
          const user = await prisma.user.findUnique({ where: { email: credentials.email } });
          if (!user || !user.password) return null;
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;
          if (!user.isActive) throw new Error('Account suspended by admin');
          await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
          return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role, isPremium: user.isPremium, isVerified: user.isVerified };
        } catch (err) {
          console.error('Auth error:', err.message);
          throw err;
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) { token.id = user.id; token.role = user.role; token.isPremium = user.isPremium; token.isVerified = user.isVerified; }
      if (trigger === 'update' && session) { token.isPremium = session.isPremium; token.isVerified = session.isVerified; }
      return token;
    },
    async session({ session, token }) {
      if (token) { session.user.id = token.id; session.user.role = token.role; session.user.isPremium = token.isPremium; session.user.isVerified = token.isVerified; }
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
