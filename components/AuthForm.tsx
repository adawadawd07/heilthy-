'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, LogIn, UserPlus } from 'lucide-react';
import { t } from '@/lib/translations';

type Mode = 'login' | 'signup';

const USERNAME_MIN = 3;
const PASSWORD_MIN = 6;

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';

  function switchMode(target: Mode) {
    setMode(target);
    setError('');
    setConfirm('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (isSignup && password !== confirm) {
      setError(t('passwordsMismatch'));
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, username, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || t('unexpectedError'));
        setBusy(false);
        return;
      }

      // Full navigation so the server re-reads the new session cookie.
      router.replace(next.startsWith('/') ? next : '/');
      router.refresh();
    } catch {
      setError(t('unexpectedError'));
      setBusy(false);
    }
  }

  const canSubmit =
    username.trim().length >= USERNAME_MIN &&
    password.length >= PASSWORD_MIN &&
    (!isSignup || confirm.length >= PASSWORD_MIN);

  return (
    <div className="rounded-3xl border border-[#1E293B] bg-[#0F172A]/90 p-6 shadow-2xl shadow-black/40 backdrop-blur">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-[#0B1A14] p-1">
        {(
          [
            { id: 'login', label: t('login') },
            { id: 'signup', label: t('signup') },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchMode(tab.id)}
            className={`rounded-xl py-2.5 text-sm font-bold transition ${
              mode === tab.id
                ? 'bg-[#16B981] text-white shadow'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-5 space-y-1 text-center">
        <h2 className="text-xl font-bold text-[#F8FAFC]">
          {isSignup ? t('createAccount') : t('welcomeBack')}
        </h2>
        <p className="text-xs text-[#94A3B8]">
          {isSignup ? t('signupSubtitle') : t('loginSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="username" className="block text-sm font-bold text-[#94A3B8]">
            {t('username')}
          </label>
          <input
            id="username"
            name="username"
            dir="ltr"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="my_username"
            className="w-full rounded-xl border border-[#1E293B] bg-[#0B1A14] p-3 text-start text-[#F8FAFC] outline-none transition focus:border-[#16B981]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-bold text-[#94A3B8]">
            {t('password')}
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              dir="ltr"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full rounded-xl border border-[#1E293B] bg-[#0B1A14] p-3 pe-11 text-start text-[#F8FAFC] outline-none transition focus:border-[#16B981]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#94A3B8] transition hover:text-[#F8FAFC]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {isSignup && (
          <div className="space-y-1.5">
            <label htmlFor="confirm" className="block text-sm font-bold text-[#94A3B8]">
              {t('confirmPassword')}
            </label>
            <input
              id="confirm"
              name="confirm"
              dir="ltr"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••"
              className="w-full rounded-xl border border-[#1E293B] bg-[#0B1A14] p-3 text-start text-[#F8FAFC] outline-none transition focus:border-[#16B981]"
            />
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-800/60 bg-red-950/40 px-3 py-2.5 text-sm font-bold text-red-300"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#16B981] to-[#22C55E] py-3.5 font-bold text-white shadow-lg shadow-emerald-950/40 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isSignup ? (
            <UserPlus className="h-5 w-5" />
          ) : (
            <LogIn className="h-5 w-5" />
          )}
          {isSignup ? t('signup') : t('login')}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-[#94A3B8]">
        {isSignup ? t('haveAccount') : t('noAccount')}{' '}
        <button
          type="button"
          onClick={() => switchMode(isSignup ? 'login' : 'signup')}
          className="font-bold text-[#22C55E] underline-offset-4 hover:underline"
        >
          {isSignup ? t('login') : t('signup')}
        </button>
      </p>
    </div>
  );
}
