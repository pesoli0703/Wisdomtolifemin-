'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Crown,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Swords,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { soundEngine } from '@/lib/audio/soundEngine';
import { PAD_COLORS } from '@/lib/constants/modes';
import { generateMultiplayerSequence } from '@/lib/games/generators';
import { computeMatchScore } from '@/lib/scoring/engine';
import { DifficultyLevel, PadColorId } from '@/types/game';

interface PlayerDuelStats {
  correctTaps: number;
  wrongTaps: number;
  streak: number;
  bestStreak: number;
  reactions: number[];
  seqCursor: number;
  activePad: number;
  activeColor: PadColorId;
  spawnAt: number;
  lastLockId: number;
}

const P1_KEYS = ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'];
const P2_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];

export function MultiplayerArena() {
  const { preferences, updatePreferences, submitCompletedGame } = useApp();

  const [battleFormat, setBattleFormat] = useState<'split' | 'turns'>('split');
  const [durationSec, setDurationSec] = useState<20 | 30 | 45>(30);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(preferences.defaultDifficulty);
  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');
  const [seriesScore, setSeriesScore] = useState({ p1: 0, p2: 0, ties: 0 });

  const [phase, setPhase] = useState<
    'setup' | 'countdown' | 'playing' | 'paused' | 'intermission' | 'finished'
  >('setup');
  const [activeTurn, setActiveTurn] = useState<1 | 2>(1);
  const [countdownNum, setCountdownNum] = useState(3);
  const [timeLeftMs, setTimeLeftMs] = useState(30000);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sharedSeqRef = useRef<Array<{ padIndex: number; color: PadColorId }>>([]);
  const tokenCounterRef = useRef(1);

  const createInitialStats = (firstItem: { padIndex: number; color: PadColorId }): PlayerDuelStats => ({
    correctTaps: 0,
    wrongTaps: 0,
    streak: 0,
    bestStreak: 0,
    reactions: [],
    seqCursor: 0,
    activePad: firstItem.padIndex,
    activeColor: firstItem.color,
    spawnAt: performance.now(),
    lastLockId: 0,
  });

  const [p1, setP1] = useState<PlayerDuelStats>(() =>
    createInitialStats({ padIndex: 4, color: 'cyan' })
  );
  const [p2, setP2] = useState<PlayerDuelStats>(() =>
    createInitialStats({ padIndex: 4, color: 'orange' })
  );

  const p1Ref = useRef(p1);
  const p2Ref = useRef(p2);
  p1Ref.current = p1;
  p2Ref.current = p2;

  const computeLivePlayerScore = useCallback(
    (st: PlayerDuelStats) => {
      const avg =
        st.reactions.length > 0
          ? Math.round(st.reactions.reduce((a, b) => a + b, 0) / st.reactions.length)
          : null;
      const best = st.reactions.length > 0 ? Math.min(...st.reactions) : null;
      return computeMatchScore({
        mode: 'multiplayer',
        difficulty,
        gridSize: 9,
        correctTaps: st.correctTaps,
        wrongTaps: st.wrongTaps,
        missedTaps: 0,
        avgReactionMs: avg,
        bestReactionMs: best,
        longestStreak: st.bestStreak,
        levelReached: 1 + Math.floor(st.correctTaps / 10),
        survivalTimeMs: 0,
        playTimeMs: durationSec * 1000,
        reactionSamples: st.reactions,
      });
    },
    [difficulty, durationSec]
  );

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        try {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
          return;
        } catch {
          // Fallback for iOS Safari
        }
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const beginMatch = (resetSeries = false) => {
    soundEngine.unlockFromUserGesture();
    if (resetSeries) {
      setSeriesScore({ p1: 0, p2: 0, ties: 0 });
    }
    const seq = generateMultiplayerSequence(240, 9);
    sharedSeqRef.current = seq;
    const now = performance.now();
    setP1({ ...createInitialStats(seq[0]), spawnAt: now });
    setP2({ ...createInitialStats(seq[0]), spawnAt: now });
    setActiveTurn(1);
    setTimeLeftMs(durationSec * 1000);
    setCountdownNum(3);
    setPhase('countdown');
  };

  const startTurn2 = () => {
    soundEngine.unlockFromUserGesture();
    const seq = sharedSeqRef.current;
    setP2({ ...createInitialStats(seq[0]), spawnAt: performance.now() });
    setActiveTurn(2);
    setTimeLeftMs(durationSec * 1000);
    setCountdownNum(3);
    setPhase('countdown');
  };

  // Countdown effect
  useEffect(() => {
    if (phase !== 'countdown') return;
    soundEngine.play('countdownTick');
    const id = window.setInterval(() => {
      setCountdownNum((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          soundEngine.play('countdownGo');
          const now = performance.now();
          setP1((s) => ({ ...s, spawnAt: now }));
          setP2((s) => ({ ...s, spawnAt: now }));
          setPhase('playing');
          return 0;
        }
        soundEngine.play('countdownTick');
        return prev - 1;
      });
    }, 750);
    return () => window.clearInterval(id);
  }, [phase]);

  // Match timer effect
  useEffect(() => {
    if (phase !== 'playing') return;
    let lastTick = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const delta = now - lastTick;
      lastTick = now;

      setTimeLeftMs((prev) => {
        const next = prev - delta;
        if (next <= 0) {
          window.clearInterval(interval);
          if (battleFormat === 'turns' && activeTurn === 1) {
            soundEngine.play('levelUp');
            setPhase('intermission');
          } else {
            soundEngine.play('victory');
            setPhase('finished');
          }
          return 0;
        }
        return next;
      });
    }, 50);

    return () => window.clearInterval(interval);
  }, [phase, battleFormat, activeTurn]);

  // Finalize winner & record telemetry when phase hits 'finished'
  const recordedMatchRef = useRef(false);
  useEffect(() => {
    if (phase !== 'finished') {
      recordedMatchRef.current = false;
      return;
    }
    if (recordedMatchRef.current) return;
    recordedMatchRef.current = true;

    const s1 = computeLivePlayerScore(p1Ref.current);
    const s2 = computeLivePlayerScore(p2Ref.current);

    setSeriesScore((prev) => ({
      p1: prev.p1 + (s1.score > s2.score ? 1 : 0),
      p2: prev.p2 + (s2.score > s1.score ? 1 : 0),
      ties: prev.ties + (s1.score === s2.score ? 1 : 0),
    }));

    // Submit primary player result to progression / leaderboard
    const winnerSt = s1.score >= s2.score ? p1Ref.current : p2Ref.current;
    const avg =
      winnerSt.reactions.length > 0
        ? Math.round(winnerSt.reactions.reduce((a, b) => a + b, 0) / winnerSt.reactions.length)
        : null;
    const best = winnerSt.reactions.length > 0 ? Math.min(...winnerSt.reactions) : null;

    if (winnerSt.correctTaps > 0) {
      submitCompletedGame({
        mode: 'multiplayer',
        difficulty,
        durationBucket: durationSec,
        gridSize: 9,
        correctTaps: winnerSt.correctTaps,
        wrongTaps: winnerSt.wrongTaps,
        missedTaps: 0,
        avgReactionMs: avg,
        bestReactionMs: best,
        longestStreak: winnerSt.bestStreak,
        levelReached: 1 + Math.floor(winnerSt.correctTaps / 10),
        survivalTimeMs: 0,
        playTimeMs: durationSec * 1000,
        isMultiplayerWin: s1.score > s2.score,
        reactionSamples: winnerSt.reactions.slice(0, 80),
        metadata: {
          battleFormat,
          p1Name,
          p2Name,
          p1Score: s1.score,
          p2Score: s2.score,
        },
      }).catch(() => {});
    }
  }, [phase, battleFormat, difficulty, durationSec, p1Name, p2Name, computeLivePlayerScore, submitCompletedGame]);

  const handlePadInput = useCallback(
    (playerNum: 1 | 2, padIdx: number) => {
      if (phase !== 'playing') return;
      if (battleFormat === 'turns' && activeTurn !== playerNum) return;

      const setter = playerNum === 1 ? setP1 : setP2;
      const current = playerNum === 1 ? p1Ref.current : p2Ref.current;
      const now = performance.now();

      if (padIdx === current.activePad) {
        // Guard against duplicate pointer events on same step
        const lockToken = ++tokenCounterRef.current;
        const reaction = Math.max(85, Math.round(now - current.spawnAt));
        const nextCursor = (current.seqCursor + 1) % sharedSeqRef.current.length;
        const nextTarget = sharedSeqRef.current[nextCursor];
        const nextStreak = current.streak + 1;

        soundEngine.play('correct', padIdx);
        setter({
          ...current,
          correctTaps: current.correctTaps + 1,
          streak: nextStreak,
          bestStreak: Math.max(current.bestStreak, nextStreak),
          reactions: [...current.reactions, reaction],
          seqCursor: nextCursor,
          activePad: nextTarget.padIndex,
          activeColor: nextTarget.color,
          spawnAt: now,
          lastLockId: lockToken,
        });
      } else {
        soundEngine.play('wrong', padIdx);
        setter({
          ...current,
          wrongTaps: current.wrongTaps + 1,
          streak: 0,
        });
      }
    },
    [phase, battleFormat, activeTurn]
  );

  // Desktop keyboard duel controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      const key = e.key.toLowerCase();
      const idx1 = P1_KEYS.indexOf(key);
      if (idx1 !== -1) {
        e.preventDefault();
        handlePadInput(1, idx1);
        return;
      }
      const idx2 = P2_KEYS.indexOf(key);
      if (idx2 !== -1) {
        e.preventDefault();
        if (battleFormat === 'turns' && activeTurn === 1) {
          handlePadInput(1, idx2);
        } else {
          handlePadInput(2, idx2);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, battleFormat, activeTurn, handlePadInput]);

  const s1 = computeLivePlayerScore(p1);
  const s2 = computeLivePlayerScore(p2);

  const renderPlayerGrid = (playerNum: 1 | 2, st: PlayerDuelStats, keyLabels: string[]) => {
    const accent = playerNum === 1 ? 'border-cyan-400/40' : 'border-orange-400/40';
    const scoreVal = playerNum === 1 ? s1.score : s2.score;
    const pName = playerNum === 1 ? p1Name : p2Name;

    return (
      <div
        className={`flex-1 rounded-3xl border ${accent} bg-slate-950/90 p-3 sm:p-4 flex flex-col justify-between gap-3`}
      >
        <div className="flex items-center justify-between gap-2 px-1">
          <div>
            <span
              className={`text-[11px] font-display font-bold uppercase tracking-wider ${
                playerNum === 1 ? 'text-cyan-400' : 'text-orange-400'
              }`}
            >
              Player {playerNum}
            </span>
            <h3 className="font-display font-extrabold text-base sm:text-lg text-white truncate max-w-[140px]">
              {pName}
            </h3>
          </div>
          <div className="text-right">
            <div className="font-display font-black text-2xl sm:text-3xl text-white">
              {scoreVal.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Streak {st.streak}x • Hits {st.correctTaps}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-[310px] w-full mx-auto aspect-square">
          {Array.from({ length: 9 }, (_, idx) => {
            const isLit = phase === 'playing' && st.activePad === idx;
            const c = PAD_COLORS[st.activeColor];
            return (
              <button
                key={idx}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePadInput(playerNum, idx);
                }}
                aria-label={`${pName} Pad ${idx + 1}`}
                style={isLit ? { boxShadow: c.glow } : undefined}
                className={`rush-pad relative rounded-full border-2 transition-transform duration-75 flex items-center justify-center active:scale-90 ${
                  isLit
                    ? `${c.bgClass} border-white scale-[1.03]`
                    : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <span
                  className={`w-4/5 h-4/5 rounded-full border ${
                    isLit ? 'border-white/50 bg-white/15' : 'border-slate-800 bg-slate-950/50'
                  } flex items-center justify-center`}
                >
                  {preferences.showKeyboardHints && (
                    <span
                      className={`hidden md:inline font-mono text-xs uppercase font-bold ${
                        isLit ? 'text-slate-950' : 'text-slate-500'
                      }`}
                    >
                      {keyLabels[idx]}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-4 ${
        isFullscreen ? 'rush-ios-fullscreen p-4' : ''
      }`}
    >
      {/* Arena Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-rush-border bg-rush-surface/90 px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <Link
            href="/games"
            className="inline-flex items-center gap-1.5 rounded-xl border border-rush-border bg-rush-card px-3 py-1.5 text-xs font-bold text-rush-text hover:border-cyan-400/50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit
          </Link>
          <div className="flex items-center gap-1.5">
            <Swords className="w-4 h-4 text-orange-400" />
            <span className="font-display font-bold text-sm sm:text-base text-rush-text">
              Multiplayer Battle
            </span>
          </div>
        </div>

        {/* Series Score Pill */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-3 py-1 text-xs font-mono text-white">
          <span className="text-cyan-400 font-bold">{p1Name}: {seriesScore.p1}</span>
          <span className="text-slate-500">|</span>
          <span className="text-orange-400 font-bold">{p2Name}: {seriesScore.p2}</span>
          {seriesScore.ties > 0 && (
            <span className="text-slate-400">({seriesScore.ties}T)</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {phase === 'playing' && (
            <button
              type="button"
              onClick={() => setPhase('paused')}
              className="rounded-xl border border-rush-border bg-rush-card p-2 text-rush-text hover:border-amber-400"
              aria-label="Pause battle"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          {phase !== 'setup' && (
            <button
              type="button"
              onClick={() => beginMatch(false)}
              className="rounded-xl border border-rush-border bg-rush-card p-2 text-rush-text hover:border-cyan-400"
              aria-label="Restart battle"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
            className="rounded-xl border border-rush-border bg-rush-card p-2 text-rush-text"
            aria-label="Toggle sound"
          >
            {preferences.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-rush-muted" />
            )}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-xl border border-rush-border bg-rush-card p-2 text-rush-text"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Setup Screen */}
      {phase === 'setup' && (
        <div className="max-w-2xl mx-auto rounded-3xl border border-orange-400/35 bg-slate-950/95 p-6 text-white space-y-5 shadow-[0_0_40px_rgba(255,122,0,0.18)]">
          <div className="text-center space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 border border-orange-400/40 px-3 py-1 text-xs font-display font-bold text-orange-300">
              <Users className="w-3.5 h-3.5" />
              SAME-DEVICE 1v1 SHOWDOWN
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl">
              Configure Multiplayer Battle
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Both players receive identical time and balanced target sequences for 100% fair competition.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                Player 1 Name
              </label>
              <input
                type="text"
                maxLength={18}
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value || 'Player 1')}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-orange-300 mb-1">
                Player 2 Name
              </label>
              <input
                type="text"
                maxLength={18}
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value || 'Player 2')}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-orange-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Competition Style
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setBattleFormat('split')}
                className={`rounded-2xl border p-3.5 text-left transition ${
                  battleFormat === 'split'
                    ? 'border-cyan-400 bg-cyan-500/15 text-white'
                    : 'border-slate-800 bg-slate-900/70 text-slate-300'
                }`}
              >
                <div className="font-display font-bold text-sm">Split-Screen Simultaneous</div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Side-by-side / top-bottom simultaneous tap race (great on tablets & desktop keyboards!).
                </p>
              </button>
              <button
                type="button"
                onClick={() => setBattleFormat('turns')}
                className={`rounded-2xl border p-3.5 text-left transition ${
                  battleFormat === 'turns'
                    ? 'border-orange-400 bg-orange-500/15 text-white'
                    : 'border-slate-800 bg-slate-900/70 text-slate-300'
                }`}
              >
                <div className="font-display font-bold text-sm">Alternating Turn Showdown</div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full-screen arena for Player 1, then pass the phone to Player 2 on the same sequence!
                </p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Equal Time Allocation
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {([20, 30, 45] as const).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDurationSec(sec)}
                    className={`rounded-xl py-2 text-xs font-display font-bold border ${
                      durationSec === sec
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Difficulty Multiplier
              </span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none capitalize"
              >
                <option value="beginner">Beginner (1.0x)</option>
                <option value="intermediate">Intermediate (1.25x)</option>
                <option value="advanced">Advanced (1.5x)</option>
                <option value="expert">Expert (2.0x)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => beginMatch(false)}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-orange-500 text-slate-950 font-display font-black text-base py-4 shadow-[0_0_30px_rgba(0,229,255,0.35)] hover:opacity-95 active:scale-[0.99] transition"
          >
            START 1v1 BATTLE
          </button>
        </div>
      )}

      {/* Countdown Overlay */}
      {phase === 'countdown' && (
        <div className="py-20 text-center space-y-3">
          <p className="font-display text-sm uppercase tracking-widest text-cyan-400">
            {battleFormat === 'turns'
              ? `Get Ready — ${activeTurn === 1 ? p1Name : p2Name}`
              : `${p1Name} vs ${p2Name}`}
          </p>
          <div className="font-display font-black text-7xl sm:text-8xl text-white drop-shadow-[0_0_35px_rgba(0,229,255,0.65)]">
            {countdownNum}
          </div>
          <p className="text-xs text-rush-muted">Hands ready on your pads!</p>
        </div>
      )}

      {/* Active Arena */}
      {(phase === 'playing' || phase === 'paused') && (
        <div className="space-y-3 relative">
          {/* Shared Precision Timer */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-3 flex items-center justify-between gap-4">
            <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-400">
              {battleFormat === 'split'
                ? 'Simultaneous Split-Screen'
                : `Turn ${activeTurn}/2: ${activeTurn === 1 ? p1Name : p2Name}`}
            </span>
            <span
              className={`font-mono font-black text-2xl ${
                timeLeftMs <= 5000 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'
              }`}
            >
              {(timeLeftMs / 1000).toFixed(1)}s
            </span>
          </div>

          {battleFormat === 'split' ? (
            <div className="flex flex-col lg:flex-row gap-4">
              {renderPlayerGrid(1, p1, P1_KEYS)}
              {renderPlayerGrid(2, p2, P2_KEYS)}
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              {activeTurn === 1
                ? renderPlayerGrid(1, p1, P1_KEYS)
                : renderPlayerGrid(2, p2, P2_KEYS)}
            </div>
          )}

          {/* Pause Modal */}
          {phase === 'paused' && (
            <div className="absolute inset-0 z-20 rounded-3xl bg-slate-950/92 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
              <h3 className="font-display font-black text-2xl text-white">BATTLE PAUSED</h3>
              <p className="text-sm text-slate-300 max-w-xs">
                Active targets are hidden while paused to keep reaction timing fair.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const now = performance.now();
                    setP1((s) => ({ ...s, spawnAt: now }));
                    setP2((s) => ({ ...s, spawnAt: now }));
                    setPhase('playing');
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 text-slate-950 font-display font-bold px-5 py-3 text-sm"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  Resume
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('setup')}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-white"
                >
                  Battle Setup
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Turn Intermission */}
      {phase === 'intermission' && (
        <div className="max-w-lg mx-auto rounded-3xl border border-orange-400/40 bg-slate-950 p-7 text-center text-white space-y-5">
          <span className="inline-block rounded-full bg-cyan-500/15 border border-cyan-400/40 px-3 py-1 text-xs font-display font-bold text-cyan-300">
            TURN 1 COMPLETE
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl">
            {p1Name} Scored {s1.score.toLocaleString()} pts!
          </h2>
          <p className="text-sm text-slate-300">
            Pass the device to <strong className="text-orange-300">{p2Name}</strong>. You have{' '}
            <strong>{durationSec} seconds</strong> to beat {s1.score.toLocaleString()} points!
          </p>
          <button
            type="button"
            onClick={startTurn2}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-amber-500 text-slate-950 font-display font-black py-3.5 text-base"
          >
            START {p2Name.toUpperCase()}&apos;S TURN
          </button>
        </div>
      )}

      {/* Winner Results Podium */}
      {phase === 'finished' && (
        <div className="max-w-2xl mx-auto rounded-3xl border border-amber-400/45 bg-slate-950/95 p-6 sm:p-8 text-white space-y-6 shadow-[0_0_50px_rgba(250,204,21,0.2)]">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 border border-amber-400/50 px-4 py-1 text-xs font-display font-bold text-amber-300">
              <Crown className="w-4 h-4" />
              {s1.score === s2.score ? 'DEAD HEAT TIE!' : 'CHAMPION CROWNED'}
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl">
              {s1.score > s2.score
                ? `${p1Name} Wins!`
                : s2.score > s1.score
                  ? `${p2Name} Wins!`
                  : 'Exact Draw!'}
            </h2>
            <p className="text-xs text-slate-400">
              Margin: {Math.abs(s1.score - s2.score).toLocaleString()} points
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: p1Name, st: p1, res: s1, winner: s1.score > s2.score, tone: 'cyan' },
              { name: p2Name, st: p2, res: s2, winner: s2.score > s1.score, tone: 'orange' },
            ].map((card, i) => {
              const avg =
                card.st.reactions.length > 0
                  ? Math.round(
                      card.st.reactions.reduce((a, b) => a + b, 0) / card.st.reactions.length
                    )
                  : null;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border p-4 space-y-2 ${
                    card.winner
                      ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_24px_rgba(250,204,21,0.18)]'
                      : 'border-slate-800 bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-base">{card.name}</span>
                    {card.winner && (
                      <span className="rounded-full bg-amber-400 text-slate-950 text-[10px] font-display font-black px-2.5 py-0.5">
                        WINNER
                      </span>
                    )}
                  </div>
                  <div className="font-display font-black text-3xl text-white">
                    {card.res.score.toLocaleString()}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-300 pt-1 border-t border-slate-800">
                    <span>Correct: {card.st.correctTaps}</span>
                    <span>Accuracy: {card.res.accuracy}%</span>
                    <span>Avg ms: {avg ? `${avg}ms` : '—'}</span>
                    <span>Streak: {card.st.bestStreak}x</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => beginMatch(false)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-display font-black py-3.5 px-5 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              REMATCH!
            </button>
            <button
              type="button"
              onClick={() => setPhase('setup')}
              className="rounded-2xl border border-slate-700 bg-slate-900 py-3.5 px-5 text-sm font-display font-bold text-white"
            >
              Change Rules
            </button>
            <Link
              href="/games"
              className="inline-flex items-center justify-center rounded-2xl border border-purple-400/40 bg-purple-500/15 py-3.5 px-5 text-sm font-display font-bold text-purple-200"
            >
              All Modes
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
