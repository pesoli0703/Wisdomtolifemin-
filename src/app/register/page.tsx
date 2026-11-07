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
  ShieldCheck,
  UserPlus,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { PushRushLogo } from '@/components/ui/PushRushLogo';

export default function RegisterPage() {
  const router = useRouter();
  const { guestState, refreshProfile, pushToast } = useApp();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [syncGuestMatches, setSyncGuestMatches] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedUser = username.trim();
    if (!/^[A-Za-z0-9_-]{3,24}$/.test(trimmedUser)) {
      setErrorMsg(
        'Username must be 3–24 characters using only letters, numbers, underscores, or hyphens.'
      );
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    const sb = getSupabaseBrowserClient();
    if (!sb) {
      setErrorMsg('Supabase backend is not configured. Check your environment variables.');
      return;
    }

    setSubmitting(true);
    try {
      // Check username availability first
      const { data: existingUser } = await sb
        .from('pr_profiles')
        .select('id')
        .ilike('username', trimmedUser)
        .maybeSingle();

      if (existingUser) {
        setErrorMsg(`Username "${trimmedUser}" is already taken. Try another handle!`);
        setSubmitting(false);
        return;
      }

      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            pr_username: trimmedUser,
            username: trimmedUser,
            display_name: displayName.trim() || trimmedUser,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          setErrorMsg(
            'This email already has an active account! Please use the Sign In page (or Forgot Password if you need a reset).'
          );
        } else {
          setErrorMsg(error.message);
        }
        setSubmitting(false);
        return;
      }

      if (data.session) {
        await sb.rpc('pr_ensure_profile', { p_preferred_username: trimmedUser });

        // Optionally sync up to 5 recent guest matches to the new cloud account
        if (syncGuestMatches && guestState.history.slice(0, 5).length > 0) {
          const toSync = guestState.history.slice(0, 5).reverse();
          for (const g of toSync) {
            await sb.rpc('pr_record_validated_game', {
              p_mode: g.mode,
              p_difficulty: g.difficulty,
              p_duration_bucket: g.durationBucket ?? null,
              p_grid_size: g.gridSize === 12 ? 12 : 9,
              p_correct_taps: Math.floor(g.correctTaps),
              p_wrong_taps: Math.floor(g.wrongTaps),
              p_missed_taps: Math.floor(g.missedTaps),
              p_avg_reaction_ms: g.avgReactionMs !== null ? Math.round(g.avgReactionMs) : null,
              p_best_reaction_ms: g.bestReactionMs !== null ? Math.round(g.bestReactionMs) : null,
              p_longest_streak: Math.floor(g.longestStreak),
              p_level_reached: Math.max(1, Math.floor(g.levelReached || 1)),
              p_survival_time_ms: Math.max(0, Math.floor(g.survivalTimeMs || 0)),
              p_play_time_ms: Math.max(500, Math.floor(g.playTimeMs)),
              p_time_remaining_ms: Math.max(0, Math.floor(g.timeRemainingMs || 0)),
              p_is_multiplayer_win: Boolean(g.isMultiplayerWin),
              p_reaction_samples: (g.reactionSamples || []).slice(0, 100),
              p_metadata: g.metadata ?? {},
            });
          }
        }

        await refreshProfile();
        pushToast({
          kind: 'info',
          title: `Welcome to PUSH RUSH, ${trimmedUser}!`,
          subtitle: 'Your player profile is active and ready for global leaderboards.',
        });
        router.push('/dashboard');
      } else {
        setConfirmationSent(true);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-14">
      <div className="rounded-3xl border border-rush-border bg-rush-surface/92 p-6 sm:p-8 space-y-6 shadow-[0_0_40px_rgba(0,229,255,0.12)]">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <PushRushLogo size="md" />
          </div>
          <h1 className="font-display font-black text-2xl text-rush-text pt-1">
            Create Player Account
          </h1>
          <p className="text-xs sm:text-sm text-rush-muted">
            Unlock verified global leaderboards, cloud XP progression, and custom avatars.
          </p>
        </div>

        {confirmationSent ? (
          <div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/10 p-5 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h2 className="font-display font-bold text-lg text-rush-text">
              Check Your Email Inbox
            </h2>
            <p className="text-xs text-rush-muted leading-relaxed">
              We sent a confirmation link to <strong>{email}</strong>. Confirm your email, then log
              in to start climbing the global ranks!
            </p>
            <Link
              href="/login"
              className="inline-block rounded-xl bg-cyan-400 text-slate-950 font-display font-bold text-xs px-5 py-2.5"
            >
              Proceed to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {errorMsg && (
              <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-3.5 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1.5">
                Player Username *
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={24}
                placeholder="e.g. LightningFox"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-rush-border bg-rush-card px-3.5 py-2.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
              />
              <p className="text-[11px] text-rush-muted mt-1">
                3–24 letters, numbers, underscores, or hyphens. Shown on leaderboards.
              </p>
            </div>

            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1.5">
                Display Name (Optional)
              </label>
              <input
                type="text"
                maxLength={32}
                placeholder="e.g. Alex Carter"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-rush-border bg-rush-card px-3.5 py-2.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1.5">
                Email Address *
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
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
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

            {guestState.gamesPlayed > 0 && (
              <label className="flex items-start gap-2.5 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncGuestMatches}
                  onChange={(e) => setSyncGuestMatches(e.target.checked)}
                  className="mt-0.5 accent-cyan-400"
                />
                <span className="text-xs text-rush-text">
                  Import my recent Guest games ({guestState.gamesPlayed} local match
                  {guestState.gamesPlayed === 1 ? '' : 'es'}) into my new account!
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-display font-black py-3.5 text-sm flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,229,255,0.35)] transition"
            >
              <UserPlus className="w-4 h-4" />
              {submitting ? 'Creating Account...' : 'CREATE FREE ACCOUNT'}
            </button>
          </form>
        )}

        <div className="pt-3 border-t border-rush-border space-y-3 text-center">
          <p className="text-xs text-rush-muted">
            Already have a PUSH RUSH account?{' '}
            <Link href="/login" className="font-bold text-cyan-400 hover:underline">
              Log In Here
            </Link>
          </p>
          <Link
            href="/play/classic"
            className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-purple-400 hover:text-purple-300"
          >
            <Zap className="w-3.5 h-3.5" />
            Skip & Play Instantly as Guest
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <p className="text-[11px] text-rush-muted flex items-center justify-center gap-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Protected by Supabase Auth & Row Level Security
          </p>
        </div>
      </div>
    </div>
  );
}
