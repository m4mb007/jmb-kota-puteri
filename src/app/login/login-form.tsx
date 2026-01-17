'use client';

import { useActionState } from 'react';
import { authenticate } from '@/app/lib/actions';
import Link from 'next/link';

export default function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-gray-900"
          htmlFor="phone"
        >
          Nombor Telefon
        </label>
        <input
          className="peer block w-full rounded-md border border-gray-200 py-[9px] px-3 text-sm outline-2 placeholder:text-gray-500"
          id="phone"
          type="text"
          name="phone"
          placeholder="Masukkan nombor telefon"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-gray-900"
          htmlFor="password"
        >
          Password
        </label>
        <input
          className="peer block w-full rounded-md border border-gray-200 py-[9px] px-3 text-sm outline-2 placeholder:text-gray-500"
          id="password"
          type="password"
          name="password"
          placeholder="Enter password"
          required
          minLength={6}
        />
      </div>
      <div
        className="flex h-8 items-end space-x-1"
        aria-live="polite"
        aria-atomic="true"
      >
        {errorMessage && (
          <p className="text-sm text-red-500">{errorMessage}</p>
        )}
      </div>
      <button
        className="mt-4 w-full rounded-md bg-blue-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50"
        aria-disabled={isPending}
        disabled={isPending}
      >
        Log in
      </button>
      
      <div className="text-center text-sm text-gray-600">
        Belum mempunyai akaun?{' '}
        <Link href="/register" className="text-blue-500 hover:text-blue-400 font-medium">
          Daftar di sini
        </Link>
      </div>
    </form>
  );
}
