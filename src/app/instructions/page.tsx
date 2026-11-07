'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Keyboard,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { DEFAULT_GAME_MODES, DIFFICULTY_META, LEVEL_TIERS } from '@/lib/constants/modes';
import { ModeIcon } from '@/components/ui/ModeIcon';

export default function InstructionsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 px-3 py-1 text-xs font-display font-bold uppercase tracking-wider text-cyan-400">
          <BookOpen className="w-3.5 h-3.5" />
          Official Player Manual
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-rush-text">
          Instructions, Tutorials & Scoring Guide
        </h1>
        <p className="text-sm sm:text-base text-rush-muted max-w-3xl">
          Master all 8 PUSH RUSH arenas, learn how millisecond speed and streaks build massive
          scores, and optimize your mobile or keyboard grip.
        </p>
      </div>

      {/* Controls & Ergonomics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-3xl border border-rush-border bg-rush-surface/85 p-6 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-display font-bold text-base">
            <Smartphone className="w-5 h-5" />
            <h2>Mobile & Tablet Touch Controls</h2>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-rush-muted leading-relaxed list-disc list-inside">
            <li>
              Hold your phone with both hands and hover both thumbs 1cm above the middle row for
              instant reach to all 9 or 12 pads.
            </li>
            <li>
              PUSH RUSH uses zero-delay pointer events—scores trigger the instant your finger
              touches the glass, with no 300ms browser click lag.
            </li>
            <li>
              In <strong>Multiplayer Battle</strong>, lay your phone or tablet flat on a table for
              Split-Screen Duel or choose Alternating Turn Showdown.
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-rush-border bg-rush-surface/85 p-6 space-y-3">
          <div className="flex items-center gap-2 text-purple-400 font-display font-bold text-base">
            <Keyboard className="w-5 h-5" />
            <h2>Laptop & Desktop Keyboard Shortcuts</h2>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-rush-muted leading-relaxed list-disc list-inside">
            <li>
              <strong>9-Pad Matrix:</strong> Press <code className="text-cyan-400">1–9</code> OR
              spatial grid <code className="text-cyan-400">Q W E / A S D / Z X C</code>.
            </li>
            <li>
              <strong>12-Pad Matrix:</strong> Press{' '}
              <code className="text-cyan-400">1 2 3 4 / Q W E R / A S D F</code>.
            </li>
            <li>
              <strong>Quick Actions:</strong> Press <code className="text-cyan-400">Space</code> to
              launch or replay, and <code className="text-cyan-400">P</code> or{' '}
              <code className="text-cyan-400">Esc</code> to pause.
            </li>
          </ul>
        </div>
      </div>

      {/* Mode-by-Mode Breakdown */}
      <div className="space-y-5">
        <h2 className="font-display font-black text-2xl text-rush-text">
          Complete Guide to All 8 Game Modes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEFAULT_GAME_MODES.map((m) => (
            <div
              key={m.slug}
              className="rounded-3xl border border-rush-border bg-rush-surface/90 p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span style={{ color: m.accentColor }}>
                      <ModeIcon name={m.iconName} className="w-5 h-5" />
                    </span>
                    <h3 className="font-display font-bold text-lg text-rush-text">{m.name}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-rush-muted">
                    Base: {m.basePoints} pts/hit
                  </span>
                </div>
                <p className="text-xs text-rush-muted">{m.description}</p>
                <ol className="space-y-1 text-xs text-rush-text list-decimal list-inside">
                  {m.shortHowTo.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
                <p className="text-xs text-amber-400/90 pt-1">💡 Pro Tip: {m.proTips[0]}</p>
              </div>

              <div className="pt-2">
                <Link
                  href={`/play/${m.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-cyan-400 hover:underline"
                >
                  Practice {m.name} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transparent Scoring Engine & Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-3xl border border-rush-border bg-rush-surface/85 p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-display font-bold text-lg">
            <Calculator className="w-5 h-5" />
            <h2>Transparent Scoring Formula</h2>
          </div>
          <p className="text-xs sm:text-sm text-rush-muted leading-relaxed">
            PUSH RUSH calculates every official score identically on client and server—and{' '}
            <strong className="text-rush-text">
              never awards points for incorrect answers
            </strong>
            :
          </p>
          <div className="rounded-2xl border border-rush-border bg-rush-card p-4 space-y-2 text-xs font-mono">
            <p className="text-cyan-400">1. Base Points = Correct Taps × Mode Base Value</p>
            <p className="text-purple-400">
              2. Speed Bonus = Awarded when average reaction is faster than 650ms
            </p>
            <p className="text-amber-400">
              3. Streak Bonus = Scales every 5 consecutive error-free taps
            </p>
            <p className="text-emerald-400">
              4. Accuracy Bonus = +250 scaled bonus when accuracy ≥ 90% (min 5 hits)
            </p>
            <p className="text-rose-400">
              5. Mistake Penalties = Wrong Taps & Missed Windows subtracted from subtotal
            </p>
            <p className="text-rush-text font-bold pt-1 border-t border-rush-border">
              Final Score = max(0, Subtotal) × Difficulty Multiplier (
              {Object.values(DIFFICULTY_META)
                .map((d) => `${d.label} ${d.multiplier}x`)
                .join(' • ')}
              )
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-3xl border border-rush-border bg-rush-surface/85 p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-display font-bold text-lg">
            <Sparkles className="w-5 h-5" />
            <h2>Player Ranks & XP</h2>
          </div>
          <div className="space-y-2">
            {LEVEL_TIERS.map((tier) => (
              <div
                key={tier.level}
                className="rounded-xl border border-rush-border bg-rush-card/70 px-3.5 py-2 flex items-center justify-between text-xs"
              >
                <span className="font-display font-bold text-rush-text">
                  Level {tier.level} • {tier.title}
                </span>
                <span className="font-mono text-cyan-400">
                  {tier.minXp.toLocaleString()}+ XP
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
