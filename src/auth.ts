import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function getUser(phone: string) {
  try {
    console.log('[AUTH] Fetching user with phone:', phone);
    const user = await prisma.user.findUnique({ where: { phone } });
    console.log('[AUTH] Query result:', user ? 'User found' : 'User not found');
    return user;
  } catch (error) {
    console.error('[AUTH] Failed to fetch user:', error);
    return null;
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log('[AUTH] Attempting authentication with credentials:', { phone: credentials?.phone });
        
        const parsedCredentials = z
          .object({ phone: z.string().min(1), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          console.log('[AUTH] Validation failed:', parsedCredentials.error);
          return null;
        }

        const { phone, password } = parsedCredentials.data;
        const user = await getUser(phone);
        
        if (!user) {
          console.log('[AUTH] User not found for phone:', phone);
          return null;
        }
        
        console.log('[AUTH] User found:', user.name, 'checking password...');
        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (passwordsMatch) {
          console.log('[AUTH] Password match successful');
          return user;
        }
        
        console.log('[AUTH] Password mismatch');
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as any;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
