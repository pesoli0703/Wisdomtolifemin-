'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  Cloud,
  HardDrive,
  History,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { fetchUserGameHistory } from '@/lib/supabase/operations';
import { GameMatchRecord, GameModeSlug } from '@/types/game';
import { MODE_MAP } from '@/lib/constants/modes';

export default function GameHistoryPage() {
  const { user, guestState, gameModes } = useApp();
  const [records, setRecords] = useState<GameMatchRecord[]>([]);
  const [modeFilter, setModeFilter] = useState<GameModeSlug | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (user) {
      setLoading(true);
      fetchUserGameHistory(user.id, 80).then((rows) => {
        if (active) {
          setRecords(rows);
          setLoading(false);
        }
      });
    } else {
      setRecords(guestState.history);
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [user, guestState.history]);

  const filtered = records.filter((r) => modeFilter === 'all' || r.mode === modeFilter);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-400/40 px-3 py-1 text-xs font-display font-bold uppercase tracking-wider text-purple-300">
            <History className="w-3.5 h-3.5" />
            Complete Match Telemetry
          </span>
          <h1 className="font-display font-black text-3xl text-rush-text">Game History</h1>
          <p className="text-sm text-rush-muted">
            Inspect every match score, reaction speed average, streak, and point breakdown.
          </p>
        </div>

        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value as GameModeSlug | 'all')}
          className="rounded-xl border border-rush-border bg-rush-surface px-3.5 py-2.5 text-xs font-bold text-rush-text focus:border-cyan-400 focus:outline-none"
        >
          <option value="all">All 8 Game Modes ({records.length})</option>
          {gameModes.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-rush-border bg-rush-surface/80 py-16 text-center text-xs text-rush-muted">
          Loading match records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-rush-border bg-rush-surface/60 py-16 px-6 text-center space-y-4">
          <History className="w-10 h-10 text-purple-400 mx-auto" />
          <h2 className="font-display font-bold text-lg text-rush-text">
            No Game Results Found Yet
          </h2>
          <p className="text-xs sm:text-sm text-rush-muted max-w-md mx-auto">
            Play any PUSH RUSH mode and your complete match telemetry will appear right here.
          </p>
          <Link
            href="/play/classic"
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 text-slate-950 font-display font-black text-xs sm:text-sm px-5 py-3"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            Launch a Match
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rec) => {
            const open = expandedId === rec.id;
            const modeName = MODE_MAP[rec.mode]?.name ?? rec.mode;
            const b = rec.scoreBreakdown;
            return (
              <div
                key={rec.id}
                className="rounded-2xl border border-rush-border bg-rush-surface/90 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : rec.id)}
                  className="w-full p-4 flex flex-wrap items-center justify-between gap-3 text-left hover:bg-rush-card/50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm sm:text-base text-rush-text">
                        {modeName}
                      </span>
                      <span className="rounded-md bg-rush-card border border-rush-border px-2 py-0.5 text-[10px] font-bold uppercase text-rush-muted">
                        {rec.difficulty}
                      </span>
                      {rec.verifiedServer ? (
                        <span title="Server Verified">
                          <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                        </span>
                      ) : (
                        <span title="Local Record">
                          <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-rush-muted">
                      {new Date(rec.createdAt).toLocaleString()} • Accuracy {rec.accuracy}% •
                      Streak {rec.longestStreak}x
                      {rec.avgReactionMs ? ` • Avg ${rec.avgReactionMs}ms` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-mono font-black text-lg sm:text-xl text-cyan-400">
                        {rec.score.toLocaleString()} pts
                      </p>
                      <p className="text-[11px] font-mono text-purple-400">+{rec.xpAwarded} XP</p>
                    </div>
                    {open ? (
                      <ChevronUp className="w-4 h-4 text-rush-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-rush-muted" />
                    )}
                  </div>
                </button>

                {open && (
                  <div className="px-4 pb-4 pt-2 border-t border-rush-border bg-rush-card/50 space-y-3 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <span className="text-rush-muted block">Correct / Wrong / Missed</span>
                        <strong className="font-mono text-rush-text">
                          {rec.correctTaps} / {rec.wrongTaps} / {rec.missedTaps}
                        </strong>
                      </div>
                      <div>
                        <span className="text-rush-muted block">Best Reaction</span>
                        <strong className="font-mono text-emerald-400">
                          {rec.bestReactionMs ? `${rec.bestReactionMs}ms` : '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-rush-muted block">Level Reached</span>
                        <strong className="font-mono text-rush-text">Lv.{rec.levelReached}</strong>
                      </div>
                      <div>
                        <span className="text-rush-muted block">Play Time</span>
                        <strong className="font-mono text-rush-text">
                          {(rec.playTimeMs / 1000).toFixed(1)}s
                        </strong>
                      </div>
                    </div>

                    <div className="rounded-xl border border-rush-border bg-rush-surface p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <span>Base: +{b.basePoints}</span>
                      <span>Speed Bonus: +{b.speedBonus}</span>
                      <span>Streak Bonus: +{b.streakBonus}</span>
                      <span>Accuracy Bonus: +{b.accuracyBonus}</span>
                      <span>Penalties: −{b.penalties}</span>
                      <span>Multiplier: {b.difficultyMultiplier}x</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
