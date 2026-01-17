'use client';

import { useActionState } from 'react';
import { registerUser } from '@/app/lib/actions';
import Link from 'next/link';

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerUser,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-gray-900"
          htmlFor="name"
        >
          Nama Penuh
        </label>
        <input
          className="peer block w-full rounded-md border border-gray-200 py-[9px] px-3 text-sm outline-2 placeholder:text-gray-500"
          id="name"
          type="text"
          name="name"
          placeholder="Masukkan nama penuh"
          required
        />
        {state?.errors?.name && (
          <p className="text-sm text-red-500">{state.errors.name[0]}</p>
        )}
      </div>

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
          placeholder="Contoh: 0123456789"
          required
        />
        {state?.errors?.phone && (
          <p className="text-sm text-red-500">{state.errors.phone[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-gray-900"
          htmlFor="email"
        >
          Email (Pilihan)
        </label>
        <input
          className="peer block w-full rounded-md border border-gray-200 py-[9px] px-3 text-sm outline-2 placeholder:text-gray-500"
          id="email"
          type="email"
          name="email"
          placeholder="contoh@email.com"
        />
        {state?.errors?.email && (
          <p className="text-sm text-red-500">{state.errors.email[0]}</p>
        )}
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
          placeholder="Minimum 6 karakter"
          required
          minLength={6}
        />
        {state?.errors?.password && (
          <p className="text-sm text-red-500">{state.errors.password[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-gray-900"
          htmlFor="confirmPassword"
        >
          Sahkan Password
        </label>
        <input
          className="peer block w-full rounded-md border border-gray-200 py-[9px] px-3 text-sm outline-2 placeholder:text-gray-500"
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          placeholder="Masukkan semula password"
          required
          minLength={6}
        />
        {state?.errors?.confirmPassword && (
          <p className="text-sm text-red-500">{state.errors.confirmPassword[0]}</p>
        )}
      </div>

      <div
        className="flex h-8 items-end space-x-1"
        aria-live="polite"
        aria-atomic="true"
      >
        {state?.message && (
          <p className="text-sm text-red-500">{state.message}</p>
        )}
      </div>

      <button
        className="mt-4 w-full rounded-md bg-blue-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50"
        aria-disabled={isPending}
        disabled={isPending}
      >
        {isPending ? 'Mendaftar...' : 'Daftar'}
      </button>

      <div className="text-center text-sm text-gray-600">
        Sudah mempunyai akaun?{' '}
        <Link href="/login" className="text-blue-500 hover:text-blue-400 font-medium">
          Log masuk di sini
        </Link>
      </div>
    </form>
  );
}

