'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, Flame, Gauge, Trophy } from 'lucide-react';
import { computeLevelProgress } from '@/lib/scoring/engine';
import {
  fetchAchievementsCatalog,
  fetchProfileByUsername,
  fetchUserAchievements,
  fetchUserPersonalBests,
} from '@/lib/supabase/operations';
import { AchievementDefinition, GameModeSlug, PlayerProfile } from '@/types/game';
import { DEFAULT_GAME_MODES } from '@/lib/constants/modes';
import { ModeIcon } from '@/components/ui/ModeIcon';

export default function PublicPlayerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const decoded = decodeURIComponent(username);

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [bests, setBests] = useState<Partial<Record<GameModeSlug, number>>>({});
  const [badges, setBadges] = useState<AchievementDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const prof = await fetchProfileByUsername(decoded);
      if (!prof) {
        if (active) setLoading(false);
        return;
      }
      const [pb, uAchs, catalog] = await Promise.all([
        fetchUserPersonalBests(prof.id),
        fetchUserAchievements(prof.id),
        fetchAchievementsCatalog(),
      ]);
      if (active) {
        setPlayer(prof);
        setBests(pb);
        const setSlugs = new Set(uAchs.map((u) => u.slug));
        setBadges(catalog.filter((c) => setSlugs.has(c.slug)));
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [decoded]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-rush-muted">
        Loading @{decoded}&apos;s player card...
      </div>
    );
  }

  if (!player) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display font-black text-2xl text-rush-text">
          Player @{decoded} Not Found
        </h1>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 text-slate-950 font-display font-bold px-5 py-2.5 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  const lvl = computeLevelProgress(player.xp);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-cyan-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Global Leaderboard
      </Link>

      <div className="rounded-3xl border border-rush-border bg-rush-surface/90 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {player.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={player.avatar_url}
              alt={player.username}
              className="w-24 h-24 rounded-3xl object-cover border-2 border-cyan-400"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center font-display font-black text-3xl text-white">
              {player.username.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-rush-text">
                {player.display_name || player.username}
              </h1>
              <span className="rounded-full bg-purple-500/20 border border-purple-400/40 px-3 py-0.5 text-xs font-display font-bold text-purple-300">
                Lv.{lvl.level} • {lvl.title}
              </span>
            </div>
            <p className="text-xs font-mono text-cyan-400">
              @{player.username}
              {player.country ? ` • ${player.country}` : ''}
            </p>
            {player.bio && <p className="text-sm text-rush-muted max-w-xl">{player.bio}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-rush-border">
          <div className="rounded-2xl border border-rush-border bg-rush-card/70 p-3.5">
            <Trophy className="w-4 h-4 text-amber-400 mb-1" />
            <p className="font-mono font-bold text-lg text-rush-text">
              {Number(player.total_score).toLocaleString()}
            </p>
            <p className="text-[11px] text-rush-muted">Career Score</p>
          </div>
          <div className="rounded-2xl border border-rush-border bg-rush-card/70 p-3.5">
            <Gauge className="w-4 h-4 text-cyan-400 mb-1" />
            <p className="font-mono font-bold text-lg text-cyan-400">
              {player.best_reaction_ms ? `${player.best_reaction_ms}ms` : '—'}
            </p>
            <p className="text-[11px] text-rush-muted">Fastest Reaction</p>
          </div>
          <div className="rounded-2xl border border-rush-border bg-rush-card/70 p-3.5">
            <Flame className="w-4 h-4 text-orange-400 mb-1" />
            <p className="font-mono font-bold text-lg text-rush-text">{player.longest_streak}x</p>
            <p className="text-[11px] text-rush-muted">Longest Streak</p>
          </div>
          <div className="rounded-2xl border border-rush-border bg-rush-card/70 p-3.5">
            <Award className="w-4 h-4 text-purple-400 mb-1" />
            <p className="font-mono font-bold text-lg text-rush-text">{badges.length}</p>
            <p className="text-[11px] text-rush-muted">Badges Earned</p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-display font-bold text-sm uppercase tracking-wider text-rush-muted">
            Mode Personal Records
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {DEFAULT_GAME_MODES.map((m) => (
              <div
                key={m.slug}
                className="rounded-2xl border border-rush-border bg-rush-card/60 p-3"
              >
                <p className="text-xs font-display font-bold text-rush-text truncate">{m.name}</p>
                <p className="font-mono font-bold text-base text-cyan-400 mt-1">
                  {(bests[m.slug] ?? 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {badges.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display font-bold text-sm uppercase tracking-wider text-rush-muted">
              Unlocked Achievements
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {badges.map((b) => (
                <div
                  key={b.slug}
                  className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                    <ModeIcon name={b.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-xs text-rush-text">{b.title}</p>
                    <p className="text-[11px] text-rush-muted">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
