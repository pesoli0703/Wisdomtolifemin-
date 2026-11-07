'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { fetchUserAchievements } from '@/lib/supabase/operations';
import { ModeIcon } from '@/components/ui/ModeIcon';

export default function AchievementsPage() {
  const { user, profile, guestState, achievementsCatalog, personalBests } = useApp();
  const [unlockedMap, setUnlockedMap] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchUserAchievements(user.id).then((rows) => {
        const map: Record<string, string> = {};
        rows.forEach((r) => {
          map[r.slug] = r.unlockedAt;
        });
        setUnlockedMap(map);
      });
    } else {
      const map: Record<string, string> = {};
      guestState.unlockedAchievements.forEach((u) => {
        map[u.slug] = u.unlockedAt;
      });
      setUnlockedMap(map);
    }
  }, [user, guestState.unlockedAchievements]);

  const unlockedCount = Object.keys(unlockedMap).length;
  const totalCount = achievementsCatalog.length;

  const filtered = achievementsCatalog.filter((a) => {
    if (category === 'all') return true;
    if (category === 'unlocked') return Boolean(unlockedMap[a.slug]);
    return a.category === category;
  });

  const estimateProgress = (metric: string, target: number): number => {
    const games = user && profile ? profile.games_played : guestState.gamesPlayed;
    const streak = user && profile ? profile.longest_streak : guestState.longestStreak;
    const mpWins = user && profile ? profile.multiplayer_wins : guestState.multiplayerWins;
    const maxScore = Math.max(0, ...Object.values(personalBests).map((v) => v ?? 0));

    switch (metric) {
      case 'games_played':
        return Math.min(target, games);
      case 'single_score':
        return Math.min(target, maxScore);
      case 'longest_streak':
        return Math.min(target, streak);
      case 'multiplayer_wins':
        return Math.min(target, mpWins);
      case 'target_score':
        return Math.min(target, personalBests.target ?? 0);
      case 'colour_score':
        return Math.min(target, personalBests.colour ?? 0);
      case 'numbers_score':
        return Math.min(target, personalBests.numbers ?? 0);
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 px-3 py-1 text-xs font-display font-bold uppercase tracking-wider text-amber-400">
            <Award className="w-3.5 h-3.5" />
            Hall of Honors
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-rush-text">
            Achievements & Rewards
          </h1>
          <p className="text-sm text-rush-muted max-w-2xl">
            Unlock badges across speed, precision, memory, survival, and 1v1 duels to earn bonus XP
            toward PUSH RUSH Champion rank.
          </p>
        </div>

        <div className="rounded-2xl border border-rush-border bg-rush-surface/85 px-5 py-3 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <div>
            <p className="font-display font-black text-lg text-rush-text">
              {unlockedCount} / {totalCount} Unlocked
            </p>
            <p className="text-[11px] text-rush-muted">
              {Math.round((unlockedCount / Math.max(1, totalCount)) * 100)}% Completion
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Badges' },
          { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
          { id: 'milestone', label: 'Milestones' },
          { id: 'speed', label: 'Speed' },
          { id: 'accuracy', label: 'Accuracy' },
          { id: 'mode', label: 'Mode Mastery' },
          { id: 'social', label: 'Multiplayer' },
          { id: 'daily', label: 'Daily' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategory(tab.id)}
            className={`rounded-xl px-3.5 py-2 text-xs font-display font-bold transition ${
              category === tab.id
                ? 'bg-cyan-400 text-slate-950'
                : 'border border-rush-border bg-rush-surface text-rush-muted hover:text-rush-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((ach) => {
          const unlockedAt = unlockedMap[ach.slug];
          const isUnlocked = Boolean(unlockedAt);
          const prog = isUnlocked
            ? ach.targetValue
            : estimateProgress(ach.metric, ach.targetValue);
          const pct = isUnlocked
            ? 100
            : Math.min(99, Math.round((prog / Math.max(1, ach.targetValue)) * 100));

          return (
            <div
              key={ach.slug}
              className={`rounded-3xl border p-5 flex flex-col justify-between gap-4 transition ${
                isUnlocked
                  ? 'border-amber-400/55 bg-gradient-to-br from-amber-500/12 via-rush-surface to-rush-surface shadow-[0_0_26px_rgba(250,204,21,0.12)]'
                  : 'border-rush-border bg-rush-surface/70 opacity-85'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                      isUnlocked
                        ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                        : 'bg-rush-card border-rush-border text-rush-muted'
                    }`}
                  >
                    <ModeIcon name={ach.icon} className="w-6 h-6" />
                  </div>
                  <span className="rounded-full bg-purple-500/15 border border-purple-400/35 px-2.5 py-0.5 text-[11px] font-mono font-bold text-purple-300">
                    +{ach.xpReward} XP
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-display font-bold text-base text-rush-text">{ach.title}</h2>
                    {isUnlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-rush-muted shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-rush-muted mt-1 leading-relaxed">{ach.description}</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-rush-border">
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full ${
                      isUnlocked ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-rush-muted">
                  <span>
                    {isUnlocked
                      ? `Unlocked ${new Date(unlockedAt).toLocaleDateString()}`
                      : 'Locked'}
                  </span>
                  <Link href="/games" className="text-cyan-400 font-semibold hover:underline">
                    Play →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
