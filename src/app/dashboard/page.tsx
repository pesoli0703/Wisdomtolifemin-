'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Gauge,
  History,
  Sparkles,
  Target,
  Trophy,
  UserPlus,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { LEVEL_TIERS } from '@/lib/constants/modes';
import { computeLevelProgress } from '@/lib/scoring/engine';
import {
  fetchTodayDailyChallenges,
  fetchUserAchievements,
  fetchUserGameHistory,
} from '@/lib/supabase/operations';
import { DailyChallengeItem, GameMatchRecord } from '@/types/game';
import { ModeIcon } from '@/components/ui/ModeIcon';

export default function PlayerDashboardPage() {
  const {
    user,
    profile,
    guestState,
    gameModes,
    achievementsCatalog,
    personalBests,
  } = useApp();

  const [history, setHistory] = useState<GameMatchRecord[]>([]);
  const [unlockedSlugs, setUnlockedSlugs] = useState<string[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const dChals = await fetchTodayDailyChallenges(user?.id ?? null);
      if (user) {
        const [hist, achs] = await Promise.all([
          fetchUserGameHistory(user.id, 25),
          fetchUserAchievements(user.id),
        ]);
        if (active) {
          setHistory(hist);
          setUnlockedSlugs(achs.map((a) => a.slug));
          setDailyChallenges(dChals);
          setLoading(false);
        }
      } else {
        if (active) {
          setHistory(guestState.history);
          setUnlockedSlugs(guestState.unlockedAchievements.map((a) => a.slug));
          setDailyChallenges(dChals);
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [user, guestState]);

  const xp = user && profile ? profile.xp : guestState.xp;
  const levelInfo = computeLevelProgress(xp);
  const gamesPlayed = user && profile ? profile.games_played : guestState.gamesPlayed;
  const totalScore = user && profile ? profile.total_score : guestState.totalScore;
  const playTimeMs = user && profile ? profile.total_play_time_ms : guestState.totalPlayTimeMs;
  const bestReaction = user && profile ? profile.best_reaction_ms : guestState.bestReactionMs;
  const longestStreak = user && profile ? profile.longest_streak : guestState.longestStreak;
  const dailyStreak = user && profile ? profile.daily_streak : guestState.dailyStreak;

  const recentReactionTrend = history
    .filter((h) => h.avgReactionMs !== null)
    .slice(0, 14)
    .reverse();

  const maxTrendMs =
    recentReactionTrend.length > 0
      ? Math.max(...recentReactionTrend.map((r) => r.avgReactionMs || 500), 500)
      : 600;

  const formatMinutes = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Guest Account Sync Callout */}
      {!user && (
        <div className="rounded-3xl border border-cyan-400/40 bg-gradient-to-r from-cyan-950/70 via-slate-950 to-purple-950/70 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              Guest Local Mode Active
            </span>
            <p className="text-xs sm:text-sm text-slate-200">
              Your stats are saved locally on this device. Create a free account anytime to sync
              records and compete on the Global Leaderboard!
            </p>
          </div>
          <Link
            href="/register"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-cyan-400 text-slate-950 font-display font-bold text-xs px-4 py-2.5"
          >
            <UserPlus className="w-4 h-4" />
            Save Progress to Cloud
          </Link>
        </div>
      )}

      {/* Player Command Header + Level Progress */}
      <div className="rounded-3xl border border-rush-border bg-rush-surface/90 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user && profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 flex items-center justify-center font-display font-black text-2xl text-white shadow-[0_0_24px_rgba(0,229,255,0.3)]">
                {(user && profile ? profile.username : guestState.guestName)
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display font-black text-2xl sm:text-3xl text-rush-text">
                  {user && profile ? profile.display_name || profile.username : guestState.guestName}
                </h1>
                <span className="rounded-full bg-purple-500/20 border border-purple-400/40 px-3 py-0.5 text-xs font-display font-bold text-purple-300">
                  Lv.{levelInfo.level} • {levelInfo.title}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-rush-muted mt-1">
                Daily Streak: <strong className="text-amber-400">{dailyStreak} day(s)</strong> •
                Total Play Time: <strong className="text-rush-text">{formatMinutes(playTimeMs)}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/play/classic"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-display font-black text-xs sm:text-sm px-5 py-3 shadow-[0_0_20px_rgba(0,229,255,0.35)]"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              Play Match
            </Link>
            {user && (
              <Link
                href="/profile"
                className="rounded-2xl border border-rush-border bg-rush-card px-4 py-3 text-xs sm:text-sm font-display font-bold text-rush-text hover:border-cyan-400/50"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* XP Bar + Rank Milestones */}
        <div className="space-y-2.5 pt-2 border-t border-rush-border">
          <div className="flex items-center justify-between text-xs">
            <span className="font-display font-bold text-cyan-400">
              XP Earned: {levelInfo.currentXp.toLocaleString()} XP
            </span>
            <span className="font-mono text-rush-muted">
              {levelInfo.xpNeededForNext.toLocaleString()} XP to Level {levelInfo.level + 1} (
              {levelInfo.nextXp.toLocaleString()} XP)
            </span>
          </div>
          <div className="h-3.5 rounded-full bg-slate-800 overflow-hidden p-0.5">
            <div
              style={{ width: `${levelInfo.progressPercent}%` }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-amber-400 transition-all duration-500"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {LEVEL_TIERS.map((t) => {
              const reached = xp >= t.minXp;
              return (
                <span
                  key={t.level}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-display font-bold border ${
                    reached
                      ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300'
                      : 'border-rush-border bg-rush-card/50 text-rush-muted opacity-60'
                  }`}
                >
                  Lv.{t.level} {t.title}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5 Core KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-rush-border bg-rush-surface/85 p-4">
          <Trophy className="w-5 h-5 text-amber-400 mb-2" />
          <p className="font-mono font-black text-xl sm:text-2xl text-rush-text">
            {Number(totalScore).toLocaleString()}
          </p>
          <p className="text-xs text-rush-muted">Career Points</p>
        </div>

        <div className="rounded-2xl border border-rush-border bg-rush-surface/85 p-4">
          <Gauge className="w-5 h-5 text-cyan-400 mb-2" />
          <p className="font-mono font-black text-xl sm:text-2xl text-cyan-400">
            {bestReaction ? `${bestReaction}ms` : '—'}
          </p>
          <p className="text-xs text-rush-muted">Best Reaction</p>
        </div>

        <div className="rounded-2xl border border-rush-border bg-rush-surface/85 p-4">
          <Flame className="w-5 h-5 text-orange-400 mb-2" />
          <p className="font-mono font-black text-xl sm:text-2xl text-rush-text">
            {longestStreak}x
          </p>
          <p className="text-xs text-rush-muted">Longest Streak</p>
        </div>

        <div className="rounded-2xl border border-rush-border bg-rush-surface/85 p-4">
          <Target className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="font-mono font-black text-xl sm:text-2xl text-rush-text">
            {gamesPlayed}
          </p>
          <p className="text-xs text-rush-muted">Games Completed</p>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-rush-border bg-rush-surface/85 p-4">
          <Award className="w-5 h-5 text-purple-400 mb-2" />
          <p className="font-mono font-black text-xl sm:text-2xl text-rush-text">
            {unlockedSlugs.length} / {achievementsCatalog.length}
          </p>
          <p className="text-xs text-rush-muted">Badges Unlocked</p>
        </div>
      </div>

      {/* Analytics + Daily Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reaction-Time Analytics */}
        <div className="lg:col-span-7 rounded-3xl border border-rush-border bg-rush-surface/85 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-rush-text flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Reaction-Time Analytics
              </h2>
              <p className="text-xs text-rush-muted">
                Average reaction speed across your recent matches (lower milliseconds = faster!)
              </p>
            </div>
          </div>

          {recentReactionTrend.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-rush-border py-12 text-center space-y-2">
              <p className="text-sm font-semibold text-rush-text">No reaction telemetry yet</p>
              <p className="text-xs text-rush-muted">
                Complete a match in any mode to visualize your reflex speed trend!
              </p>
              <Link
                href="/play/classic"
                className="inline-block rounded-xl bg-cyan-400 text-slate-950 font-display font-bold text-xs px-4 py-2 mt-1"
              >
                Play First Match
              </Link>
            </div>
          ) : (
            <div className="h-44 flex items-end gap-2 pt-6 px-2 rounded-2xl bg-slate-950/75 border border-slate-800 p-4">
              {recentReactionTrend.map((m, idx) => {
                const ms = m.avgReactionMs || 400;
                const hPct = Math.max(18, Math.min(100, Math.round((ms / maxTrendMs) * 100)));
                return (
                  <div key={m.id || idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[10px] font-mono text-cyan-300">{ms}</span>
                    <div
                      style={{ height: `${hPct}%` }}
                      title={`${m.mode.toUpperCase()}: ${ms}ms`}
                      className={`w-full rounded-t-lg ${
                        ms <= 260
                          ? 'bg-emerald-400'
                          : ms <= 380
                            ? 'bg-cyan-400'
                            : 'bg-purple-400'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Mode Personal Records Grid */}
          <div className="pt-2 space-y-2.5">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-rush-muted">
              Personal Records by Mode
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {gameModes.map((m) => (
                <Link
                  key={m.slug}
                  href={`/play/${m.slug}`}
                  className="rounded-2xl border border-rush-border bg-rush-card/75 hover:border-cyan-400/50 p-3 transition"
                >
                  <div className="flex items-center gap-1.5 text-xs font-display font-bold text-rush-text truncate">
                    <span style={{ color: m.accentColor }}>
                      <ModeIcon name={m.iconName} className="w-3.5 h-3.5" />
                    </span>
                    <span className="truncate">{m.name.replace(' Mode', '')}</span>
                  </div>
                  <p className="font-mono font-bold text-base text-cyan-400 mt-1">
                    {(personalBests[m.slug] ?? 0).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Daily Challenges + Recent History */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-rush-border bg-rush-surface/85 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-rush-text flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Daily Challenges
              </h2>
              <span className="text-xs font-mono text-rush-muted">UTC Today</span>
            </div>

            <div className="space-y-2.5">
              {dailyChallenges.map((ch) => {
                const key = `${ch.challengeDate}:${ch.slot}`;
                const gProg = guestState.dailyProgress[key];
                const prog = user ? (ch.progressValue ?? 0) : (gProg?.progressValue ?? 0);
                const done = user ? Boolean(ch.isCompleted) : Boolean(gProg?.isCompleted);
                const pct = Math.min(100, Math.round((prog / Math.max(1, ch.targetValue)) * 100));

                return (
                  <div
                    key={ch.id}
                    className={`rounded-2xl border p-3.5 space-y-2 ${
                      done
                        ? 'border-emerald-400/50 bg-emerald-500/10'
                        : 'border-rush-border bg-rush-card/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-xs text-rush-text flex items-center gap-1.5">
                        {done && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {ch.title}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        +{ch.xpReward} XP
                      </span>
                    </div>
                    <p className="text-[11px] text-rush-muted">{ch.description}</p>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-rush-border bg-rush-surface/85 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-rush-text flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                Recent Matches
              </h2>
              <Link
                href="/history"
                className="text-xs font-display font-bold text-cyan-400 hover:underline flex items-center gap-1"
              >
                Full Log <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <p className="text-xs text-rush-muted py-4 text-center">Loading match log...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-rush-muted py-4 text-center">
                No games played yet—launch any mode to start your log!
              </p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 4).map((h) => (
                  <div
                    key={h.id}
                    className="rounded-xl border border-rush-border bg-rush-card/70 px-3.5 py-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-display font-bold text-rush-text capitalize">
                        {h.mode} • {h.difficulty}
                      </p>
                      <p className="text-[11px] text-rush-muted">
                        Accuracy {h.accuracy}%{h.avgReactionMs ? ` • ${h.avgReactionMs}ms` : ''}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-sm text-cyan-400">
                      {h.score.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
