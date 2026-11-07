'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LogIn,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { PushRushLogo } from '@/components/ui/PushRushLogo';

export default function LoginPage() {
  const router = useRouter();
  const { refreshProfile, pushToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResetSent(false);

    const sb = getSupabaseBrowserClient();
    if (!sb) {
      setErrorMsg('Supabase backend is not configured.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      await refreshProfile();
      pushToast({
        kind: 'info',
        title: 'Welcome back!',
        subtitle: 'Signed in—your cloud stats and leaderboards are active.',
      });
      router.push('/dashboard');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setErrorMsg('Enter your email address above first, then click Forgot Password.');
      return;
    }
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    setErrorMsg(null);
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/settings`,
    });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setResetSent(true);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-16">
      <div className="rounded-3xl border border-rush-border bg-rush-surface/92 p-6 sm:p-8 space-y-6 shadow-[0_0_40px_rgba(0,229,255,0.12)]">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <PushRushLogo size="md" />
          </div>
          <h1 className="font-display font-black text-2xl text-rush-text pt-1">
            Player Sign In
          </h1>
          <p className="text-xs sm:text-sm text-rush-muted">
            Access your cloud XP, achievements, and global PUSH RUSH rankings.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-3.5 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resetSent && (
            <div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/10 p-3.5 flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Password reset instructions sent to {email}!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-rush-border bg-rush-card px-3.5 py-2.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-display font-bold uppercase tracking-wider text-rush-muted">
                Password
              </label>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-[11px] font-semibold text-cyan-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-rush-border bg-rush-card pl-3.5 pr-10 py-2.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password visibility"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-rush-muted hover:text-rush-text"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-display font-black py-3.5 text-sm flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,229,255,0.35)] transition"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Signing In...' : 'SIGN IN TO ARENA'}
          </button>
        </form>

        <div className="pt-3 border-t border-rush-border space-y-3 text-center">
          <p className="text-xs text-rush-muted">
            New to PUSH RUSH?{' '}
            <Link href="/register" className="font-bold text-cyan-400 hover:underline">
              Create a Free Account
            </Link>
          </p>
          <Link
            href="/play/classic"
            className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-purple-400 hover:text-purple-300"
          >
            <Zap className="w-3.5 h-3.5" />
            Continue Playing as Guest
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
