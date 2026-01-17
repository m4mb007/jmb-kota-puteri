'use client';

import { useActionState } from 'react';
import { authenticate } from '@/app/lib/actions';
import { Phone, Lock, Loader2 } from 'lucide-react';

export default function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label
          className="text-sm font-semibold text-slate-700 ml-1"
          htmlFor="phone"
        >
          Nombor Telefon
        </label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <Phone className="w-4 h-4" />
          </div>
          <input
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
            id="phone"
            type="text"
            name="phone"
            placeholder="012 345 6789"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center ml-1">
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor="password"
          >
            Password
          </label>
          <a href="#" className="text-xs font-medium text-blue-600 hover:underline">
            Lupa Password?
          </a>
        </div>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <Lock className="w-4 h-4" />
          </div>
          <input
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
            id="password"
            type="password"
            name="password"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
      </div>

      <div
        className="min-h-[20px]"
        aria-live="polite"
        aria-atomic="true"
      >
        {errorMessage && (
          <p className="text-sm font-medium text-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {errorMessage}
          </p>
        )}
      </div>

      <button
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sila tunggu...
          </>
        ) : (
          'Log Masuk'
        )}
      </button>
    </form>
  );
}
