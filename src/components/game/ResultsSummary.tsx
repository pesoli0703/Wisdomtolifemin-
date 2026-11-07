'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Check,
  CheckCircle2,
  Cloud,
  Flame,
  Gauge,
  HardDrive,
  RotateCcw,
  Share2,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { computeLevelProgress } from '@/lib/scoring/engine';
import { GameMatchRecord } from '@/types/game';

interface ResultsSummaryProps {
  modeName: string;
  record: GameMatchRecord;
  previousBest: number;
  isPersonalBest: boolean;
  savedToCloud: boolean;
  isAuthenticated: boolean;
  currentTotalXp: number;
  unlockedAchievements: Array<{ title: string; description: string; xpReward: number }>;
  completedChallenges: Array<{ title: string; xpReward: number }>;
  onPlayAgain: () => void;
}

export function ResultsSummary({
  modeName,
  record,
  previousBest,
  isPersonalBest,
  savedToCloud,
  isAuthenticated,
  currentTotalXp,
  unlockedAchievements,
  completedChallenges,
  onPlayAgain,
}: ResultsSummaryProps) {
  const [copied, setCopied] = useState(false);
  const levelInfo = computeLevelProgress(currentTotalXp);
  const b = record.scoreBreakdown;
  const samples = record.reactionSamples.slice(-28);
  const maxSample = samples.length > 0 ? Math.max(...samples, 600) : 600;

  const handleShare = async () => {
    const shareText = `⚡ PUSH RUSH — ${modeName}\n🏆 Score: ${record.score.toLocaleString()} pts${
      record.avgReactionMs ? `\n⏱️ Avg Reflex: ${record.avgReactionMs}ms` : ''
    }\n🎯 Accuracy: ${record.accuracy}%\n🔥 Streak: ${record.longestStreak}\nThink Fast. Tap Faster. Beat the Clock!`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'PUSH RUSH Score', text: shareText });
        return;
      } catch {
        // Fall through to clipboard
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl border border-cyan-400/35 bg-slate-950/95 text-white p-5 sm:p-7 shadow-[0_0_50px_rgba(0,229,255,0.2)] space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-1 text-xs font-display font-bold tracking-wider uppercase text-cyan-300">
          {isPersonalBest ? (
            <>
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              NEW PERSONAL BEST!
            </>
          ) : (
            <>
              <Trophy className="w-3.5 h-3.5" />
              MATCH COMPLETE
            </>
          )}
        </div>
        <h2 className="font-display font-black text-2xl sm:text-3xl tracking-wide text-white">
          {modeName}
        </h2>
        <div className="py-2">
          <div className="font-display font-black text-5xl sm:text-6xl bg-gradient-to-r from-cyan-300 via-white to-amber-300 bg-clip-text text-transparent">
            {record.score.toLocaleString()}
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mt-1">
            Verified Match Score • Best: {Math.max(previousBest, record.score).toLocaleString()}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
          {savedToCloud ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Server-verified & ranked on Global Leaderboard</span>
            </>
          ) : isAuthenticated ? (
            <>
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>Saved locally • Queued for cloud sync</span>
            </>
          ) : (
            <>
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                Saved to Guest Device Records •{' '}
                <Link href="/register" className="text-cyan-300 underline font-semibold">
                  Register free
                </Link>{' '}
                to rank globally
              </span>
            </>
          )}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Avg Reaction</p>
          <p className="font-mono font-bold text-xl text-cyan-300 mt-0.5">
            {record.avgReactionMs ? `${record.avgReactionMs}ms` : '—'}
          </p>
          {record.bestReactionMs && (
            <p className="text-[10px] text-slate-400">Fastest: {record.bestReactionMs}ms</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Accuracy</p>
          <p className="font-mono font-bold text-xl text-emerald-400 mt-0.5">
            {record.accuracy}%
          </p>
          <p className="text-[10px] text-slate-400">
            {record.correctTaps} hit / {record.wrongTaps + record.missedTaps} miss
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Best Streak</p>
          <p className="font-mono font-bold text-xl text-amber-300 mt-0.5">
            {record.longestStreak}x
          </p>
          <p className="text-[10px] text-slate-400">Level {record.levelReached}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">
            {record.mode === 'survival' ? 'Survived' : 'XP Earned'}
          </p>
          <p className="font-mono font-bold text-xl text-purple-300 mt-0.5">
            {record.mode === 'survival'
              ? `${(record.survivalTimeMs / 1000).toFixed(1)}s`
              : `+${record.xpAwarded} XP`}
          </p>
          <p className="text-[10px] text-slate-400 capitalize">{record.difficulty}</p>
        </div>
      </div>

      {/* Transparent Score Calculation Breakdown */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Target className="w-4 h-4" />
            How Your Score Was Calculated
          </h3>
          <span className="text-xs font-mono text-amber-300 font-semibold">
            {b.difficultyMultiplier}x Difficulty Multiplier
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Correct Taps ({record.correctTaps}):</span>
            <span className="font-mono text-white">+{b.basePoints}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Reaction Speed Bonus:</span>
            <span className="font-mono text-cyan-300">+{b.speedBonus}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Streak Bonus:</span>
            <span className="font-mono text-purple-300">+{b.streakBonus}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Accuracy Bonus:</span>
            <span className="font-mono text-emerald-300">+{b.accuracyBonus}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Level & Time Bonus:</span>
            <span className="font-mono text-amber-300">+{b.levelBonus + b.timeBonus}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Mistake Penalties:</span>
            <span className="font-mono text-rose-400">−{b.penalties}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
          Zero points are awarded for incorrect taps. Subtotal × {b.difficultyMultiplier}x ={' '}
          <strong className="text-white">{b.finalScore.toLocaleString()} pts</strong>.
        </p>
      </div>

      {/* Reaction-Time Analytics Mini Chart */}
      {samples.length >= 3 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-display font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" />
              Tap Reaction Telemetry (Lower Bars = Faster ms)
            </span>
            <span className="font-mono text-cyan-300">Best {record.bestReactionMs}ms</span>
          </div>
          <div className="h-16 flex items-end gap-1 pt-2">
            {samples.map((ms, idx) => {
              const heightPct = Math.max(14, Math.min(100, Math.round((ms / maxSample) * 100)));
              const fast = ms <= 280;
              return (
                <div
                  key={idx}
                  title={`Tap #${idx + 1}: ${ms}ms`}
                  style={{ height: `${heightPct}%` }}
                  className={`flex-1 rounded-t transition-all ${
                    fast ? 'bg-cyan-400' : ms <= 450 ? 'bg-purple-400' : 'bg-amber-400'
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Unlocked Achievements & Daily Challenges */}
      {(unlockedAchievements.length > 0 || completedChallenges.length > 0) && (
        <div className="space-y-2">
          {unlockedAchievements.map((a, i) => (
            <div
              key={i}
              className="rounded-2xl border border-amber-400/50 bg-amber-500/10 px-4 py-2.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <p className="text-xs font-display font-bold text-amber-200">
                    Achievement Unlocked: {a.title}
                  </p>
                  <p className="text-xs text-slate-300">{a.description}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-300 shrink-0">
                +{a.xpReward} XP
              </span>
            </div>
          ))}
          {completedChallenges.map((c, i) => (
            <div
              key={i}
              className="rounded-2xl border border-emerald-400/50 bg-emerald-500/10 px-4 py-2.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                <p className="text-xs font-display font-bold text-emerald-200">
                  Daily Challenge Completed: {c.title}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-300 shrink-0">
                +{c.xpReward} XP
              </span>
            </div>
          ))}
        </div>
      )}

      {/* XP Progression Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-display font-bold text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Level {levelInfo.level} • {levelInfo.title}
          </span>
          <span className="font-mono text-slate-300">
            {levelInfo.currentXp.toLocaleString()} / {levelInfo.nextXp.toLocaleString()} XP
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            style={{ width: `${levelInfo.progressPercent}%` }}
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-amber-400 transition-all duration-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <button
          type="button"
          onClick={onPlayAgain}
          className="sm:col-span-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-display font-extrabold py-3.5 px-5 text-sm shadow-[0_0_24px_rgba(0,229,255,0.4)] transition active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          PLAY AGAIN
        </button>

        <Link
          href="/games"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 hover:border-cyan-400/50 text-white font-display font-bold py-3.5 px-5 text-sm transition"
        >
          Switch Mode
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-400/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 font-display font-bold py-3.5 px-5 text-sm transition"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          {copied ? 'Copied Score!' : 'Share Score'}
        </button>
      </div>
    </div>
  );
}
