'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Crown,
  Flag,
  RefreshCw,
  ShieldCheck,
  Trophy,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { fetchLeaderboard } from '@/lib/supabase/operations';
import { GameModeSlug, LeaderboardEntry } from '@/types/game';

const PERIODS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'all_time', label: 'All-Time' },
] as const;

export default function LeaderboardPage() {
  const { user, gameModes, pushToast } = useApp();

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('all_time');
  const [selectedMode, setSelectedMode] = useState<GameModeSlug | 'all'>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Report modal state
  const [reportingTarget, setReportingTarget] = useState<LeaderboardEntry | null>(null);
  const [reportReason, setReportReason] = useState('Suspicious score / automation');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const loadBoard = async () => {
    setLoading(true);
    const data = await fetchLeaderboard(period, selectedMode, 50);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedMode]);

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportingTarget) return;
    const sb = getSupabaseBrowserClient();
    if (!sb) return;

    setSubmittingReport(true);
    const { error } = await sb.from('pr_reports').insert({
      reporter_id: user.id,
      reported_user_id: reportingTarget.userId,
      reason: reportReason,
      details: reportDetails.trim(),
    });
    setSubmittingReport(false);

    if (error) {
      pushToast({
        kind: 'info',
        title: 'Could not submit report',
        subtitle: error.message,
      });
    } else {
      pushToast({
        kind: 'info',
        title: 'Player Report Submitted',
        subtitle: 'Our moderation team will review telemetry for fair play.',
      });
      setReportingTarget(null);
      setReportDetails('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 px-3 py-1 text-xs font-display font-bold uppercase tracking-wider text-amber-400">
            <Crown className="w-3.5 h-3.5" />
            Official Database-Backed Standings
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-rush-text">
            Global PUSH RUSH Leaderboard
          </h1>
          <p className="text-sm text-rush-muted max-w-2xl">
            Every score below is validated server-side from registered PUSH RUSH players. Local
            guest scores and sample records are never mixed into global rankings.
          </p>
        </div>

        <button
          type="button"
          onClick={loadBoard}
          className="self-start md:self-auto inline-flex items-center gap-2 rounded-xl border border-rush-border bg-rush-surface px-4 py-2.5 text-xs font-display font-bold text-rush-text hover:border-cyan-400/50 transition"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ranks
        </button>
      </div>

      {/* Period Tabs & Game Mode Selector */}
      <div className="rounded-3xl border border-rush-border bg-rush-surface/85 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`rounded-xl px-4 py-2 text-xs font-display font-bold transition ${
                  period === p.id
                    ? 'bg-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(0,229,255,0.35)]'
                    : 'bg-rush-card text-rush-muted hover:text-rush-text border border-rush-border'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="lb-mode" className="text-xs font-display font-bold text-rush-muted">
              Arena:
            </label>
            <select
              id="lb-mode"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as GameModeSlug | 'all')}
              className="rounded-xl border border-rush-border bg-rush-card px-3.5 py-2 text-xs font-bold text-rush-text focus:border-cyan-400 focus:outline-none"
            >
              <option value="all">Overall (All Modes)</option>
              {gameModes.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard Table / Empty State */}
      {loading ? (
        <div className="rounded-3xl border border-rush-border bg-rush-surface/75 py-20 text-center space-y-3">
          <div className="w-9 h-9 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-display font-bold text-cyan-400">
            Querying verified global rankings...
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-rush-border bg-rush-surface/70 py-16 px-6 text-center space-y-4">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="font-display font-black text-xl text-rush-text">
              No Verified Scores Recorded Yet for This Filter
            </h2>
            <p className="text-xs sm:text-sm text-rush-muted leading-relaxed">
              We never display fake placeholder players on official leaderboards. Sign in or
              register a free account and complete a match to claim Rank #1!
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href={selectedMode === 'all' ? '/play/classic' : `/play/${selectedMode}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 text-slate-950 font-display font-black text-xs sm:text-sm px-5 py-3"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              Play & Claim #1
            </Link>
            {!user && (
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl border border-rush-border bg-rush-card text-rush-text font-display font-bold text-xs sm:text-sm px-5 py-3"
              >
                <UserPlus className="w-4 h-4 text-purple-400" />
                Register Free Account
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-rush-border bg-rush-surface/90 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rush-border bg-rush-card/80 text-[11px] font-display font-bold uppercase tracking-wider text-rush-muted">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Player</th>
                  <th className="py-3.5 px-4 text-right">
                    {selectedMode === 'all' ? 'Total Score' : 'Best Score'}
                  </th>
                  <th className="py-3.5 px-4 text-right hidden sm:table-cell">Best Reaction</th>
                  <th className="py-3.5 px-4 text-right hidden md:table-cell">Accuracy</th>
                  <th className="py-3.5 px-4 text-right hidden md:table-cell">Games</th>
                  {user && <th className="py-3.5 px-4 text-right">Fair Play</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-rush-border text-sm">
                {entries.map((entry) => {
                  const isMe = user?.id === entry.userId;
                  return (
                    <tr
                      key={entry.userId}
                      className={`transition hover:bg-rush-card/60 ${
                        isMe ? 'bg-cyan-500/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex w-8 h-8 rounded-xl font-display font-black text-xs items-center justify-center ${
                            entry.rank === 1
                              ? 'bg-amber-400 text-slate-950 shadow-[0_0_16px_rgba(250,204,21,0.45)]'
                              : entry.rank === 2
                                ? 'bg-slate-300 text-slate-950'
                                : entry.rank === 3
                                  ? 'bg-orange-400 text-slate-950'
                                  : 'bg-rush-card text-rush-muted border border-rush-border'
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/profile/${entry.username}`}
                          className="flex items-center gap-3 group"
                        >
                          {entry.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={entry.avatarUrl}
                              alt={entry.username}
                              className="w-9 h-9 rounded-full object-cover border border-cyan-400/50 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-display font-bold text-xs shrink-0">
                              {entry.username.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-display font-bold text-rush-text group-hover:text-cyan-400 transition flex items-center gap-1.5">
                              <span>{entry.username}</span>
                              {isMe && (
                                <span className="rounded bg-cyan-400/20 text-cyan-400 px-1.5 py-0.5 text-[10px]">
                                  YOU
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-rush-muted">
                              Lv.{entry.level} • {entry.levelTitle}
                              {entry.country ? ` • ${entry.country}` : ''}
                            </p>
                          </div>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-400">
                        {(selectedMode === 'all'
                          ? entry.totalScore
                          : entry.bestScore
                        ).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-emerald-400 hidden sm:table-cell">
                        {entry.bestReactionMs ? `${entry.bestReactionMs}ms` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-rush-text hidden md:table-cell">
                        {entry.avgAccuracy}%
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-rush-muted hidden md:table-cell">
                        {entry.gamesCount}
                      </td>

                      {user && (
                        <td className="py-3.5 px-4 text-right">
                          {!isMe && (
                            <button
                              type="button"
                              onClick={() => setReportingTarget(entry)}
                              title="Report suspicious activity"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-rush-border text-rush-muted hover:text-rose-400 hover:border-rose-400/40"
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-rush-border bg-rush-surface/60 p-4 flex items-center gap-3 text-xs text-rush-muted">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <span>
          PUSH RUSH enforces server-side score calculation, physiological 80ms minimum reflex bounds,
          and Row Level Security so rankings stay genuine for every competitor.
        </span>
      </div>

      {/* Report Player Modal */}
      {reportingTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={submitReport}
            className="max-w-md w-full rounded-3xl border border-rush-border bg-slate-950 p-6 text-white space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-rose-300">
                Report @{reportingTarget.username}
              </h3>
              <button
                type="button"
                onClick={() => setReportingTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Reason
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white"
              >
                <option value="Suspicious score / automation">Suspicious score / automation</option>
                <option value="Inappropriate username or bio">Inappropriate username or bio</option>
                <option value="Other fair-play concern">Other fair-play concern</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe any anomaly noticed..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReportingTarget(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReport}
                className="rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-display font-bold px-4 py-2 text-xs"
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
