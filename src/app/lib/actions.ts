'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { redirect } from 'next/navigation';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    console.log('[AUTH ACTION] Attempting sign in...');
    await signIn('credentials', {
      phone: formData.get('phone'),
      password: formData.get('password'),
      redirectTo: '/dashboard',
    });
    console.log('[AUTH ACTION] Sign in successful');
  } catch (error) {
    const isNextRedirect =
      error instanceof Error &&
      (error.message === 'NEXT_REDIRECT' ||
        (typeof (error as { digest?: string }).digest === 'string' &&
          (error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')));
    if (isNextRedirect) {
      // Expected for successful sign-in when redirecting.
      throw error;
    }

    console.log('[AUTH ACTION] Error caught:', error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    // NextAuth throws NEXT_REDIRECT on successful login, so we need to rethrow
    throw error;
  }
}

const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
  role: z.enum(['OWNER', 'TENANT', 'STAFF', 'JMB']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export async function registerUser(
  prevState: { message?: string; errors?: Record<string, string[]> } | undefined,
  formData: FormData,
) {
  // Validate form data
  const validatedFields = RegisterSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    role: formData.get('role'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to register. Please check the form.',
    };
  }

  const { name, phone, email, password, role } = validatedFields.data;

  try {
    console.log('[REGISTER] Attempting to register user:', { name, phone, email, role });
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existingUser) {
      console.log('[REGISTER] User already exists:', existingUser.phone);
      if (existingUser.phone === phone) {
        return {
          message: 'Phone number already registered',
        };
      }
      if (existingUser.email === email) {
        return {
          message: 'Email already registered',
        };
      }
    }

    // Hash password
    console.log('[REGISTER] Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('[REGISTER] Password hashed successfully');

    // Create user
    console.log('[REGISTER] Creating user in database...');
    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        password: hashedPassword,
        role,
      },
    });
    
    console.log('[REGISTER] User created successfully:', newUser.id, newUser.phone);

    // Redirect to login page after successful registration
  } catch (error) {
    console.error('[REGISTER] Registration error:', error);
    return {
      message: 'An error occurred during registration. Please try again.',
    };
  }

  redirect('/login');
}
