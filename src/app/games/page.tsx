'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Search,
  Sparkles,
  Trophy,
  Wifi,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { DIFFICULTY_META } from '@/lib/constants/modes';
import { ModeIcon } from '@/components/ui/ModeIcon';
import { DifficultyLevel } from '@/types/game';

export default function GameSelectionPage() {
  const { gameModes, personalBests, preferences, updatePreferences } = useApp();
  const [filter, setFilter] = useState<'all' | 'featured' | 'multiplayer' | 'cognitive'>('all');
  const [query, setQuery] = useState('');

  const visibleModes = gameModes.filter((m) => {
    if (!m.isEnabled) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      if (
        !m.name.toLowerCase().includes(q) &&
        !m.description.toLowerCase().includes(q) &&
        !m.tagline.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filter === 'featured') return m.isFeatured;
    if (filter === 'multiplayer') return m.slug === 'multiplayer';
    if (filter === 'cognitive') return ['memory', 'target', 'colour', 'numbers'].includes(m.slug);
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 px-3 py-1 text-xs font-display font-bold uppercase tracking-wider text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            Arena Command Deck
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-rush-text">
            Select Your PUSH RUSH Mode
          </h1>
          <p className="text-sm sm:text-base text-rush-muted max-w-2xl">
            Every game mode is 100% playable on mobile touchscreens and desktop keyboards, with
            offline support and instant millisecond scoring.
          </p>
        </div>

        {/* Default Difficulty Quick Selector */}
        <div className="rounded-2xl border border-rush-border bg-rush-surface/85 p-3 space-y-1.5">
          <span className="block text-[10px] font-display font-bold uppercase tracking-wider text-rush-muted">
            Default Arena Difficulty
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(['beginner', 'intermediate', 'advanced', 'expert'] as DifficultyLevel[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => updatePreferences({ defaultDifficulty: d })}
                className={`rounded-xl px-3 py-1.5 text-xs font-display font-bold capitalize transition ${
                  preferences.defaultDifficulty === d
                    ? 'bg-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(0,229,255,0.35)]'
                    : 'bg-rush-card text-rush-muted hover:text-rush-text border border-rush-border'
                }`}
              >
                {d} ({DIFFICULTY_META[d].multiplier}x)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All 8 Modes' },
            { id: 'featured', label: 'Featured Arenas' },
            { id: 'cognitive', label: 'Memory & Brain' },
            { id: 'multiplayer', label: '2-Player Local' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`rounded-xl px-3.5 py-2 text-xs font-display font-bold transition ${
                filter === tab.id
                  ? 'bg-purple-500/20 border border-purple-400/50 text-purple-300'
                  : 'border border-rush-border bg-rush-surface/70 text-rush-muted hover:text-rush-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-rush-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Search game modes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-rush-border bg-rush-surface pl-9 pr-3.5 py-2 text-xs text-rush-text placeholder:text-rush-muted focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Modes Grid */}
      {visibleModes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-rush-border bg-rush-surface/50 py-16 text-center space-y-2">
          <p className="font-display font-bold text-base text-rush-text">
            No matching game modes found
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setQuery('');
            }}
            className="text-xs font-bold text-cyan-400 underline"
          >
            Show all 8 game modes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visibleModes.map((mode) => {
            const best = personalBests[mode.slug] ?? 0;
            return (
              <div
                key={mode.slug}
                className="rounded-3xl border border-rush-border bg-rush-surface/90 hover:border-cyan-400/60 p-6 flex flex-col justify-between gap-5 transition-all hover:shadow-[0_14px_38px_rgba(0,229,255,0.12)]"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        style={{ borderColor: `${mode.accentColor}66` }}
                        className="w-12 h-12 rounded-2xl bg-slate-950 border flex items-center justify-center shrink-0"
                      >
                        <span style={{ color: mode.accentColor }}>
                          <ModeIcon name={mode.iconName} className="w-6 h-6" />
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-display font-bold uppercase tracking-wider text-cyan-400">
                          {mode.tagline}
                        </span>
                        <h2 className="font-display font-black text-xl text-rush-text">
                          {mode.name}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {mode.supportsOffline && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                          <Wifi className="w-3 h-3" />
                          Offline OK
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-rush-muted leading-relaxed">{mode.description}</p>

                  <ul className="space-y-1 text-xs text-rush-text/90 bg-rush-card/70 rounded-2xl p-3.5 border border-rush-border">
                    {mode.shortHowTo.slice(0, 2).map((rule, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-rush-border">
                  <div className="flex items-center gap-2 text-xs">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-rush-muted">Personal Best:</span>
                    <strong className="font-mono text-sm text-rush-text">
                      {best.toLocaleString()} pts
                    </strong>
                  </div>

                  <Link
                    href={`/play/${mode.slug}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-display font-black text-xs sm:text-sm px-5 py-3 shadow-[0_0_22px_rgba(0,229,255,0.35)] transition active:scale-95"
                  >
                    LAUNCH MODE
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
