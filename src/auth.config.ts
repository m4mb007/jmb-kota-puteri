import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnLogin = nextUrl.pathname === '/login';
      const isOnRegister = nextUrl.pathname === '/register';
      
      console.log('[AUTH CONFIG] authorized callback:', { 
        isLoggedIn, 
        pathname: nextUrl.pathname 
      });
      
      if (isOnDashboard) {
        // Require authentication for dashboard pages
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if ((isOnLogin || isOnRegister) && isLoggedIn) {
        // If already logged in and trying to access login/register, redirect to dashboard
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
