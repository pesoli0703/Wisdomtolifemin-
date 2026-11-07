'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Gamepad2,
  Gauge,
  Info,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { soundEngine } from '@/lib/audio/soundEngine';
import { computeLevelProgress } from '@/lib/scoring/engine';
import {
  fetchLeaderboard,
  fetchPlatformStats,
  fetchTodayDailyChallenges,
} from '@/lib/supabase/operations';
import { DailyChallengeItem, LeaderboardEntry } from '@/types/game';
import { ModeIcon } from '@/components/ui/ModeIcon';
import { PushRushLogo } from '@/components/ui/PushRushLogo';

const SAMPLE_TESTIMONIALS = [
  {
    quote:
      'Classic Speed Mode cut my average tap reaction from 340ms down to 205ms in two weeks. Playing on my iPhone during commutes is addictive!',
    handle: 'Sample Preview • @ReflexSprinter',
    role: 'Teen Competitive Player',
  },
  {
    quote:
      'Multiplayer Battle on our iPad has become our family after-dinner ritual. The split-screen duel is genuinely fair and super responsive.',
    handle: 'Sample Preview • @CoachAdeyemi',
    role: 'Parent & Brain-Training Fan',
  },
  {
    quote:
      'Colour Rush Stroop rounds and Memory Rush are my go-to warmups before esports scrims. Zero input lag and crystal-clear score breakdowns.',
    handle: 'Sample Preview • @NeonValkyrie',
    role: 'PC & Mobile Gamer',
  },
];

export default function HomePage() {
  const { user, profile, guestState, gameModes, personalBests, preferences } = useApp();

  const [stats, setStats] = useState<{
    registeredPlayers: number;
    totalGamesPlayed: number;
    gamesToday: number;
    fastestReactionMs: number | null;
    avgReactionMs: number | null;
  }>({
    registeredPlayers: 0,
    totalGamesPlayed: 0,
    gamesToday: 0,
    fastestReactionMs: null,
    avgReactionMs: null,
  });
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallengeItem[]>([]);
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Interactive Hero Single-Pad Reflex Tester
  const [reflexState, setReflexState] = useState<'idle' | 'waiting' | 'now' | 'result' | 'early'>(
    'idle'
  );
  const [reflexMs, setReflexMs] = useState<number | null>(null);
  const reflexTimerRef = useRef<number | null>(null);
  const reflexStartRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchPlatformStats(),
      fetchTodayDailyChallenges(user?.id ?? null),
      fetchLeaderboard('all_time', 'all', 5),
    ])
      .then(([st, dc, lb]) => {
        if (!mounted) return;
        setStats(st);
        setDailyChallenges(dc);
        setTopPlayers(lb);
        setLoadingData(false);
      })
      .catch(() => {
        if (mounted) setLoadingData(false);
      });

    return () => {
      mounted = false;
      if (reflexTimerRef.current) window.clearTimeout(reflexTimerRef.current);
    };
  }, [user?.id]);

  const handleMiniReflexTap = () => {
    soundEngine.unlockFromUserGesture();
    if (reflexState === 'idle' || reflexState === 'result' || reflexState === 'early') {
      soundEngine.play('tap');
      setReflexState('waiting');
      const delay = 1100 + Math.floor(Math.random() * 1900);
      reflexTimerRef.current = window.setTimeout(() => {
        reflexStartRef.current = performance.now();
        soundEngine.play('padTone', 2);
        setReflexState('now');
      }, delay);
    } else if (reflexState === 'waiting') {
      if (reflexTimerRef.current) window.clearTimeout(reflexTimerRef.current);
      soundEngine.play('wrong');
      setReflexState('early');
    } else if (reflexState === 'now') {
      const ms = Math.max(85, Math.round(performance.now() - reflexStartRef.current));
      soundEngine.play('correct', 3);
      setReflexMs(ms);
      setReflexState('result');
    }
  };

  const playerXp = user && profile ? profile.xp : guestState.xp;
  const levelInfo = computeLevelProgress(playerXp);
  const playerGames = user && profile ? profile.games_played : guestState.gamesPlayed;
  const playerFastest = user && profile ? profile.best_reaction_ms : guestState.bestReactionMs;

  return (
    <div className="space-y-16 sm:space-y-24 pb-10">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-6 sm:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1.5 text-xs font-display font-bold tracking-wider uppercase text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              8 Playable Modes • Instant Guest Play • Zero Registration Gate
            </div>

            <div className="flex justify-center lg:justify-start">
              <PushRushLogo size="lg" />
            </div>

            <h1 className="font-display font-black text-3xl sm:text-5xl xl:text-6xl tracking-tight leading-[1.08] text-rush-text">
              Think Fast. Tap Faster.{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                Beat the Clock.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-rush-muted max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Step into the ultimate online reaction-speed and brain-training arena. Ignite
              millisecond reflexes on iPhone, Android, tablet, or desktop, conquer daily challenges,
              and climb server-verified global leaderboards.
            </p>

            {/* Primary Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-1">
              <Link
                href="/play/classic"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-display font-black text-base sm:text-lg px-8 py-4 shadow-[0_0_35px_rgba(0,229,255,0.5)] transition transform hover:-translate-y-0.5 active:scale-95"
              >
                <Zap className="w-5 h-5 fill-slate-950" />
                PLAY NOW
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/games"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-rush-border bg-rush-surface/90 hover:border-purple-400/60 text-rush-text font-display font-bold text-sm sm:text-base px-6 py-4 transition"
              >
                <Gamepad2 className="w-5 h-5 text-purple-400" />
                Explore All 8 Modes
              </Link>
            </div>

            {/* Instant Personal Status Strip */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xl mx-auto lg:mx-0 pt-2">
              <div className="rounded-2xl border border-rush-border bg-rush-surface/75 p-3">
                <p className="text-[11px] uppercase tracking-wider text-rush-muted">Your Rank</p>
                <p className="font-display font-bold text-sm sm:text-base text-cyan-400 truncate">
                  Lv.{levelInfo.level} {levelInfo.title}
                </p>
              </div>
              <div className="rounded-2xl border border-rush-border bg-rush-surface/75 p-3">
                <p className="text-[11px] uppercase tracking-wider text-rush-muted">Best Reflex</p>
                <p className="font-mono font-bold text-sm sm:text-base text-emerald-400">
                  {playerFastest ? `${playerFastest}ms` : 'Tap to test!'}
                </p>
              </div>
              <div className="rounded-2xl border border-rush-border bg-rush-surface/75 p-3">
                <p className="text-[11px] uppercase tracking-wider text-rush-muted">Matches</p>
                <p className="font-mono font-bold text-sm sm:text-base text-amber-400">
                  {playerGames} Played
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Official Artwork + Live Interactive Reflex Tester */}
          <div className="lg:col-span-5 space-y-4">
            <motion.div
              initial={preferences.reducedMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
              className="relative rounded-3xl border border-cyan-400/35 bg-slate-950/90 p-3 shadow-[0_0_50px_rgba(0,229,255,0.2)] overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/push-rush-hero.webp"
                alt="PUSH RUSH — Think Fast. Tap Faster. Beat the Clock!"
                className="w-full h-auto rounded-2xl object-cover"
              />

              {/* Live 1-Tap Instant Reflex Check Widget */}
              <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/95 p-3.5 flex items-center justify-between gap-3 text-white">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-display font-bold uppercase tracking-widest text-cyan-300 block">
                    Instant Warmup Pad
                  </span>
                  <p className="text-xs text-slate-300">
                    {reflexState === 'idle' && 'Tap the pad, wait for NEON GREEN, then strike!'}
                    {reflexState === 'waiting' && 'Hold steady... wait for NEON GREEN...'}
                    {reflexState === 'now' && '⚡ TAP NOW! TAP NOW!'}
                    {reflexState === 'early' && 'Too early! Tap to try again.'}
                    {reflexState === 'result' && `Verified Reflex: ${reflexMs}ms! Tap to retry.`}
                  </p>
                </div>

                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleMiniReflexTap();
                  }}
                  className={`rush-pad shrink-0 w-16 h-16 rounded-full border-2 font-display font-black text-xs transition transform active:scale-90 flex items-center justify-center ${
                    reflexState === 'now'
                      ? 'bg-emerald-400 border-white text-slate-950 shadow-[0_0_28px_rgba(34,197,94,0.9)] scale-105'
                      : reflexState === 'waiting'
                        ? 'bg-amber-500/25 border-amber-400 text-amber-300 animate-pulse'
                        : reflexState === 'early'
                          ? 'bg-rose-500/30 border-rose-400 text-rose-200'
                          : 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-200 text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.45)]'
                  }`}
                >
                  {reflexState === 'now'
                    ? 'TAP!'
                    : reflexState === 'waiting'
                      ? 'WAIT'
                      : reflexState === 'result'
                        ? `${reflexMs}ms`
                        : 'TEST'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PLATFORM STATISTICS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-rush-border bg-rush-surface/80 p-5 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display font-black text-xl sm:text-2xl text-rush-text">
                {loadingData ? '—' : stats.totalGamesPlayed.toLocaleString()}
              </p>
              <p className="text-xs text-rush-muted">Verified Cloud Games</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display font-black text-xl sm:text-2xl text-rush-text">
                {loadingData ? '—' : stats.registeredPlayers.toLocaleString()}
              </p>
              <p className="text-xs text-rush-muted">Registered Competitors</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display font-black text-xl sm:text-2xl text-rush-text">
                {stats.fastestReactionMs ? `${stats.fastestReactionMs}ms` : '8 Modes'}
              </p>
              <p className="text-xs text-rush-muted">
                {stats.fastestReactionMs ? 'Fastest Global Reaction' : 'Millisecond Precision'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/15 border border-orange-400/30 flex items-center justify-center text-orange-400 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display font-black text-xl sm:text-2xl text-rush-text">
                {loadingData ? '—' : stats.gamesToday.toLocaleString()}
              </p>
              <p className="text-xs text-rush-muted">Matches Played Today</p>
            </div>
          </div>
        </div>
      </section>

      {/* ALL 8 GAME MODES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-display font-bold uppercase tracking-widest text-cyan-400">
              8 Distinct Reflex & Cognitive Arenas
            </span>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-rush-text mt-1">
              Choose Your Game Mode
            </h2>
          </div>
          <Link
            href="/games"
            className="inline-flex items-center gap-1.5 text-sm font-display font-bold text-cyan-400 hover:text-cyan-300"
          >
            Open Full Arena Selector
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gameModes
            .filter((m) => m.isEnabled)
            .map((mode) => {
              const best = personalBests[mode.slug] ?? 0;
              return (
                <div
                  key={mode.slug}
                  className="group rounded-3xl border border-rush-border bg-rush-surface/85 hover:border-cyan-400/60 p-5 flex flex-col justify-between gap-4 transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,229,255,0.12)]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        style={{ borderColor: `${mode.accentColor}55` }}
                        className="w-11 h-11 rounded-2xl bg-slate-950 border flex items-center justify-center text-white"
                      >
                        <span style={{ color: mode.accentColor }}>
                          <ModeIcon name={mode.iconName} className="w-5 h-5" />
                        </span>
                      </div>
                      {mode.isFeatured && (
                        <span className="rounded-full bg-cyan-500/15 border border-cyan-400/35 px-2.5 py-0.5 text-[10px] font-display font-bold uppercase tracking-wider text-cyan-400">
                          Featured
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] font-display font-bold uppercase tracking-wider text-rush-muted">
                        {mode.tagline}
                      </p>
                      <h3 className="font-display font-extrabold text-lg text-rush-text mt-0.5">
                        {mode.name}
                      </h3>
                    </div>

                    <p className="text-xs text-rush-muted leading-relaxed line-clamp-3">
                      {mode.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-rush-border flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-rush-muted">
                      Best: <strong className="text-rush-text">{best.toLocaleString()}</strong>
                    </span>
                    <Link
                      href={`/play/${mode.slug}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-cyan-500/15 group-hover:bg-cyan-400 group-hover:text-slate-950 border border-cyan-400/40 px-3.5 py-1.5 text-xs font-display font-bold text-cyan-400 transition"
                    >
                      Play
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* DAILY CHALLENGES & TOP PLAYERS LEADERBOARD PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Challenges */}
        <div className="lg:col-span-7 rounded-3xl border border-rush-border bg-rush-surface/85 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-emerald-400">
                <Calendar className="w-3.5 h-3.5" />
                Live UTC Daily Rotation
              </span>
              <h2 className="font-display font-black text-xl sm:text-2xl text-rush-text mt-0.5">
                Today&apos;s Daily Challenges
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="text-xs font-display font-bold text-cyan-400 hover:underline"
            >
              View Progress →
            </Link>
          </div>

          <div className="space-y-3">
            {dailyChallenges.map((ch) => {
              const localKey = `${ch.challengeDate}:${ch.slot}`;
              const guestProg = guestState.dailyProgress[localKey];
              const prog = user ? (ch.progressValue ?? 0) : (guestProg?.progressValue ?? 0);
              const done = user ? Boolean(ch.isCompleted) : Boolean(guestProg?.isCompleted);
              const pct = Math.min(100, Math.round((prog / Math.max(1, ch.targetValue)) * 100));

              return (
                <div
                  key={ch.id}
                  className={`rounded-2xl border p-4 space-y-2.5 ${
                    done
                      ? 'border-emerald-400/50 bg-emerald-500/10'
                      : 'border-rush-border bg-rush-card/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-sm sm:text-base text-rush-text">
                          {ch.title}
                        </h3>
                        {done && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-rush-muted mt-0.5">{ch.description}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-400/15 border border-amber-400/40 px-2.5 py-1 text-xs font-mono font-bold text-amber-400">
                      +{ch.xpReward} XP
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                      />
                    </div>
                    <span className="text-xs font-mono text-rush-muted shrink-0">
                      {Math.min(prog, ch.targetValue)} / {ch.targetValue}
                    </span>
                    <Link
                      href={ch.mode ? `/play/${ch.mode}` : '/games'}
                      className="shrink-0 rounded-lg bg-cyan-500/15 border border-cyan-400/40 px-2.5 py-1 text-xs font-display font-bold text-cyan-400 hover:bg-cyan-400 hover:text-slate-950 transition"
                    >
                      Go
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Players Global Leaderboard */}
        <div className="lg:col-span-5 rounded-3xl border border-rush-border bg-rush-surface/85 p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-amber-400">
                  <Crown className="w-3.5 h-3.5" />
                  Database-Verified Rankings
                </span>
                <h2 className="font-display font-black text-xl sm:text-2xl text-rush-text mt-0.5">
                  Top Global Players
                </h2>
              </div>
              <Link
                href="/leaderboard"
                className="text-xs font-display font-bold text-cyan-400 hover:underline"
              >
                Full Board →
              </Link>
            </div>

            {loadingData ? (
              <div className="py-12 text-center text-xs text-rush-muted">
                Loading live global standings...
              </div>
            ) : topPlayers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-rush-border bg-rush-card/50 p-6 text-center space-y-3">
                <Trophy className="w-9 h-9 text-amber-400 mx-auto" />
                <h3 className="font-display font-bold text-sm text-rush-text">
                  The #1 Global Throne Is Wide Open!
                </h3>
                <p className="text-xs text-rush-muted leading-relaxed">
                  Only real, server-verified registered player scores appear here—never fake bots.
                  Create a free account and set the inaugural world record!
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Link
                    href="/register"
                    className="rounded-xl bg-amber-400 text-slate-950 font-display font-bold text-xs px-4 py-2"
                  >
                    Claim #1 Spot
                  </Link>
                  <Link
                    href="/play/classic"
                    className="rounded-xl border border-rush-border text-rush-text font-display font-bold text-xs px-4 py-2"
                  >
                    Practice First
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {topPlayers.map((entry) => (
                  <Link
                    key={entry.userId}
                    href={`/profile/${entry.username}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-rush-border bg-rush-card/75 hover:border-cyan-400/50 p-3 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg font-display font-black text-xs flex items-center justify-center shrink-0 ${
                          entry.rank === 1
                            ? 'bg-amber-400 text-slate-950'
                            : entry.rank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : entry.rank === 3
                                ? 'bg-orange-400 text-slate-950'
                                : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{entry.rank}
                      </span>
                      {entry.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={entry.avatarUrl}
                          alt={entry.username}
                          className="w-8 h-8 rounded-full object-cover border border-cyan-400/40 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-display font-bold text-xs flex items-center justify-center shrink-0">
                          {entry.username.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-display font-bold text-sm text-rush-text truncate">
                          {entry.username}
                        </p>
                        <p className="text-[11px] text-rush-muted">
                          Lv.{entry.level} {entry.levelTitle}
                          {entry.bestReactionMs ? ` • ${entry.bestReactionMs}ms` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-sm text-cyan-400">
                        {entry.totalScore.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-rush-muted">Total Pts</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-rush-text">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Anti-cheat server validation protects every global score.</span>
            </div>
            <Link
              href="/leaderboard"
              className="shrink-0 text-xs font-display font-bold text-cyan-400 underline"
            >
              Rankings
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED CHALLENGES & HOW TO PLAY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Featured Challenges */}
        <div className="space-y-5">
          <div>
            <span className="text-xs font-display font-bold uppercase tracking-widest text-purple-400">
              Curated Skill Gauntlets
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-rush-text mt-1">
              Featured Challenges
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-cyan-400/35 bg-gradient-to-br from-slate-950 via-blue-950/60 to-slate-950 p-6 text-white space-y-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/20 px-3 py-0.5 text-[10px] font-display font-bold text-cyan-300">
                <Clock className="w-3 h-3" /> SUB-220MS CLUB
              </span>
              <h3 className="font-display font-extrabold text-xl">Lightning Hands Trial</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Launch a 30-second Classic Speed sprint and record a single verified tap reaction of
                220ms or faster to unlock the coveted Lightning Hands badge.
              </p>
              <Link
                href="/play/classic"
                className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-cyan-300 pt-1 hover:underline"
              >
                Attempt Challenge <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-3xl border border-purple-400/35 bg-gradient-to-br from-slate-950 via-purple-950/60 to-slate-950 p-6 text-white space-y-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-400/20 px-3 py-0.5 text-[10px] font-display font-bold text-purple-300">
                <Swords className="w-3 h-3" /> COUCH RIVALRY
              </span>
              <h3 className="font-display font-extrabold text-xl">1v1 Split-Screen Duel</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Grab a friend and battle simultaneously on one phone, tablet, or keyboard. Win 3
                head-to-head duels to earn the Winning Streak achievement!
              </p>
              <Link
                href="/play/multiplayer"
                className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-purple-300 pt-1 hover:underline"
              >
                Start 2-Player Battle <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-3xl border border-amber-400/35 bg-gradient-to-br from-slate-950 via-amber-950/40 to-slate-950 p-6 text-white space-y-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-3 py-0.5 text-[10px] font-display font-bold text-amber-300">
                <Award className="w-3 h-3" /> SEASONAL ROADMAP
              </span>
              <h3 className="font-display font-extrabold text-xl">Global Arena Cups (Free)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                All 8 core PUSH RUSH modes are 100% free with zero paywalls. Upcoming Seasonal
                Tournaments & Private Squad Rooms are in preview!
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-amber-300 pt-1 hover:underline"
              >
                Explore Platform Roadmap <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* How to Play Section */}
        <div className="rounded-3xl border border-rush-border bg-rush-surface/80 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs font-display font-bold uppercase tracking-widest text-cyan-400">
                3-Step Quickstart
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-rush-text mt-1">
                How PUSH RUSH Works
              </h2>
            </div>
            <Link
              href="/instructions"
              className="text-xs font-display font-bold text-cyan-400 hover:underline"
            >
              Read Full Tutorials & Scoring Formula →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-rush-border bg-rush-card/70 p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 font-display font-black flex items-center justify-center">
                01
              </div>
              <h3 className="font-display font-bold text-base text-rush-text">
                Pick Mode & Difficulty
              </h3>
              <p className="text-xs text-rush-muted leading-relaxed">
                Choose from 8 reflex, memory, chromatic, numerical, survival, or 2-player arenas—from
                Beginner (1.0x) up to Expert (2.0x multiplier).
              </p>
            </div>
            <div className="rounded-2xl border border-rush-border bg-rush-card/70 p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 font-display font-black flex items-center justify-center">
                02
              </div>
              <h3 className="font-display font-bold text-base text-rush-text">
                React in Milliseconds
              </h3>
              <p className="text-xs text-rush-muted leading-relaxed">
                Tap illuminated circular pads via touch or keyboard. Consecutive clean hits build
                streak bonuses while wrong taps deduct penalty points.
              </p>
            </div>
            <div className="rounded-2xl border border-rush-border bg-rush-card/70 p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 font-display font-black flex items-center justify-center">
                03
              </div>
              <h3 className="font-display font-bold text-base text-rush-text">
                Level Up & Rank Globally
              </h3>
              <p className="text-xs text-rush-muted leading-relaxed">
                Earn XP from Beginner to PUSH RUSH Champion, unlock 16 achievement badges, and post
                server-validated scores on Daily to All-Time leaderboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION — CLEARLY IDENTIFIED SAMPLE CONTENT PER SPEC */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 px-3 py-1 text-[11px] font-display font-bold uppercase tracking-wider text-amber-400">
              <Info className="w-3.5 h-3.5" />
              Sample Community Preview (Illustrative Until Verified Player Reviews Accumulate)
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-rush-text mt-2">
              Built for Every Generation of Reflex Athletes
            </h2>
          </div>
          <Link
            href="/contact"
            className="text-xs font-display font-bold text-cyan-400 hover:underline"
          >
            Submit Your Real Feedback →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_TESTIMONIALS.map((item, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-rush-border bg-rush-surface/80 p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <span className="inline-block rounded-md bg-rush-card border border-rush-border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-rush-muted">
                  Sample Testimonial
                </span>
                <p className="text-sm text-rush-text leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
              </div>
              <div className="border-t border-rush-border pt-3">
                <p className="font-display font-bold text-xs text-cyan-400">{item.handle}</p>
                <p className="text-[11px] text-rush-muted">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-cyan-400/40 bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 p-7 sm:p-10 text-center text-white space-y-4 shadow-[0_0_50px_rgba(0,229,255,0.18)]">
          <Target className="w-10 h-10 text-cyan-300 mx-auto" />
          <h2 className="font-display font-black text-2xl sm:text-4xl">
            Ready to Test Your True Reaction Speed?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Jump straight into a 30-second Classic Speed sprint right now—no signup required—or
            create a free player account to lock in global leaderboard rankings.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/play/classic"
              className="rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-black px-7 py-3.5 text-sm sm:text-base shadow-[0_0_25px_rgba(0,229,255,0.45)] transition"
            >
              LAUNCH CLASSIC SPEED
            </Link>
            {!user && (
              <Link
                href="/register"
                className="rounded-2xl border border-white/25 bg-white/10 hover:bg-white/15 text-white font-display font-bold px-6 py-3.5 text-sm sm:text-base transition"
              >
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
