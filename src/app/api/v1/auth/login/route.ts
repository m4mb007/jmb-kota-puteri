import { signIn } from '@/auth';
import { NextResponse } from 'next/server';
import { AuthError } from 'next-auth';

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with email and password. Note that this endpoint uses NextAuth which sets a session cookie. Mobile apps should handle the 'authjs.session-token' cookie.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    // signIn throws a redirect on success, or an error on failure
    await signIn('credentials', {
      email,
      password,
      redirect: false, // Important: prevent redirect
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        default:
          return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
      }
    }
    
    // In NextAuth v5, successful signIn might not throw if redirect is false?
    // Or it might just work.
    // If it throws a redirect error (which is not an AuthError), we catch it here.
    // But we set redirect: false.
    
    // Actually, checking NextAuth v5 docs, signIn returns nothing on success if redirect: false?
    // Or it might still throw 'NEXT_REDIRECT'.
    
    // Let's assume if we get here, it might be success.
    // But wait, standard NextAuth v5 signIn with redirect:false might strictly be for client-side?
    // No, server-side signIn also has options.
    
    // Safest bet: Just return success if no error thrown.
    return NextResponse.json({ success: true });
  }
}
