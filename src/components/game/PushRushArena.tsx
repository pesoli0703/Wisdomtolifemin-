'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Flame,
  Heart,
  HelpCircle,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Timer,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { soundEngine } from '@/lib/audio/soundEngine';
import {
  DIFFICULTY_META,
  KEYBOARD_12_MAP,
  KEYBOARD_9_ALT,
  KEYBOARD_9_MAP,
  MODE_MAP,
  PAD_COLORS,
  PAD_SYMBOLS,
} from '@/lib/constants/modes';
import {
  ColourRushWave,
  extendMemorySequence,
  generateColourWave,
  generateNumberBoard,
  generateTargetWave,
  getClassicWindowMs,
  getEnduranceWindowMs,
  getMemoryStepTimings,
  getSurvivalWindowMs,
  NumberRushBoard,
  pickNextRandomPad,
  TargetWave,
} from '@/lib/games/generators';
import { computeMatchScore } from '@/lib/scoring/engine';
import {
  DifficultyLevel,
  GameMatchRecord,
  GameModeSlug,
  PadColorId,
  PadSymbolId,
} from '@/types/game';
import { ModeIcon } from '@/components/ui/ModeIcon';
import { MultiplayerArena } from './MultiplayerArena';
import { ResultsSummary } from './ResultsSummary';

const COLOR_RING: PadColorId[] = ['cyan', 'purple', 'orange', 'green', 'red', 'yellow'];

interface RenderedPad {
  lit: boolean;
  color: PadColorId;
  label?: string;
  symbol?: PadSymbolId;
  cleared?: boolean;
}

export function PushRushArena({ mode }: { mode: GameModeSlug }) {
  const {
    user,
    profile,
    guestState,
    preferences,
    updatePreferences,
    gameModes,
    personalBests,
    submitCompletedGame,
  } = useApp();

  const modeCfg = useMemo(
    () => gameModes.find((m) => m.slug === mode) ?? MODE_MAP[mode] ?? MODE_MAP.classic,
    [gameModes, mode]
  );

  // Configurable pre-game options
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(preferences.defaultDifficulty);
  const [gridSize, setGridSize] = useState<9 | 12>(
    modeCfg.supportsGrid12 ? preferences.defaultGridSize : 9
  );
  const [classicDuration, setClassicDuration] = useState<30 | 60 | 90>(30);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Core game lifecycle
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'playing' | 'paused' | 'gameover'>(
    'ready'
  );
  const [countdownVal, setCountdownVal] = useState(3);

  // Live telemetry state
  const [correctTaps, setCorrectTaps] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [missedTaps, setMissedTaps] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [mistakesLeft, setMistakesLeft] = useState(5);
  const [reactions, setReactions] = useState<number[]>([]);
  const [lastReactionMs, setLastReactionMs] = useState<number | null>(null);
  const [feedbackFlash, setFeedbackFlash] = useState<'hit' | 'miss' | null>(null);

  // Timers
  const [timeRemainingMs, setTimeRemainingMs] = useState(30000);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [stepWindowPct, setStepWindowPct] = useState(100);

  // Mode-specific board states
  const [singlePad, setSinglePad] = useState<{ index: number; color: PadColorId }>({
    index: 4,
    color: 'cyan',
  });

  // Memory Rush state
  const [memoryPhase, setMemoryPhase] = useState<'watch' | 'repeat'>('watch');
  const [memorySeq, setMemorySeq] = useState<Array<{ padIndex: number; color: PadColorId }>>([]);
  const [memoryHighlight, setMemoryHighlight] = useState<{
    padIndex: number;
    color: PadColorId;
  } | null>(null);
  const [memoryInputIdx, setMemoryInputIdx] = useState(0);
  const [memoryShields, setMemoryShields] = useState(1);

  // Target Rush state
  const [targetWave, setTargetWave] = useState<TargetWave | null>(null);
  const [clearedTargetIndices, setClearedTargetIndices] = useState<number[]>([]);

  // Colour Rush state
  const [colourWave, setColourWave] = useState<ColourRushWave | null>(null);

  // Number Rush state
  const [numberBoard, setNumberBoard] = useState<NumberRushBoard | null>(null);
  const [numberCursor, setNumberCursor] = useState(0);

  // Results state
  const [finalSummary, setFinalSummary] = useState<{
    record: GameMatchRecord;
    previousBest: number;
    isPersonalBest: boolean;
    savedToCloud: boolean;
    unlockedAchievements: Array<{ title: string; description: string; xpReward: number }>;
    completedChallenges: Array<{ title: string; xpReward: number }>;
  } | null>(null);
  const [submittingResult, setSubmittingResult] = useState(false);

  // High-precision refs for event/timer callbacks without stale closures or duplicate scoring
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const stepTokenRef = useRef(0);
  const lockedPadTokensRef = useRef<Set<string>>(new Set());
  const stepSpawnAtRef = useRef(0);
  const stepWindowMsRef = useRef(1200);
  const gameOverTriggeredRef = useRef(false);
  const memoryTimersRef = useRef<number[]>([]);

  const clearMemoryTimers = useCallback(() => {
    memoryTimersRef.current.forEach((id) => window.clearTimeout(id));
    memoryTimersRef.current = [];
  }, []);

  useEffect(() => {
    if (!modeCfg.supportsGrid12 && gridSize === 12) {
      setGridSize(9);
    }
  }, [modeCfg.supportsGrid12, gridSize]);

  useEffect(() => {
    return () => clearMemoryTimers();
  }, [clearMemoryTimers]);

  // Live computed score preview
  const avgReactionMs = useMemo(() => {
    if (reactions.length === 0) return null;
    return Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length);
  }, [reactions]);

  const bestReactionMs = useMemo(() => {
    if (reactions.length === 0) return null;
    return Math.min(...reactions);
  }, [reactions]);

  const liveScoreObj = useMemo(
    () =>
      computeMatchScore(
        {
          mode,
          difficulty,
          durationBucket: mode === 'classic' ? classicDuration : null,
          gridSize,
          correctTaps,
          wrongTaps,
          missedTaps,
          avgReactionMs,
          bestReactionMs,
          longestStreak,
          levelReached: level,
          survivalTimeMs: mode === 'survival' ? elapsedMs : 0,
          playTimeMs: Math.max(1000, elapsedMs),
          timeRemainingMs: mode === 'numbers' ? timeRemainingMs : 0,
          reactionSamples: reactions,
        },
        modeCfg
      ),
    [
      mode,
      difficulty,
      classicDuration,
      gridSize,
      correctTaps,
      wrongTaps,
      missedTaps,
      avgReactionMs,
      bestReactionMs,
      longestStreak,
      level,
      elapsedMs,
      timeRemainingMs,
      reactions,
      modeCfg,
    ]
  );

  // Keep latest telemetry in ref for endGame()
  const telemetrySnapshotRef = useRef({
    correctTaps,
    wrongTaps,
    missedTaps,
    longestStreak,
    level,
    elapsedMs,
    timeRemainingMs,
    reactions,
    avgReactionMs,
    bestReactionMs,
  });
  telemetrySnapshotRef.current = {
    correctTaps,
    wrongTaps,
    missedTaps,
    longestStreak,
    level,
    elapsedMs,
    timeRemainingMs,
    reactions,
    avgReactionMs,
    bestReactionMs,
  };

  const triggerFlash = (kind: 'hit' | 'miss') => {
    setFeedbackFlash(kind);
    window.setTimeout(() => {
      setFeedbackFlash((prev) => (prev === kind ? null : prev));
    }, 180);
  };

  const playMemoryPlayback = useCallback(
    (seq: Array<{ padIndex: number; color: PadColorId }>, lvl: number) => {
      clearMemoryTimers();
      setMemoryPhase('watch');
      setMemoryHighlight(null);
      setMemoryInputIdx(0);

      const { onDurationMs, gapDurationMs } = getMemoryStepTimings(difficulty, lvl);
      let delay = 360;

      seq.forEach((step) => {
        const tOn = window.setTimeout(() => {
          setMemoryHighlight(step);
          soundEngine.play('padTone', step.padIndex);
        }, delay);
        const tOff = window.setTimeout(() => {
          setMemoryHighlight(null);
        }, delay + onDurationMs);
        memoryTimersRef.current.push(tOn, tOff);
        delay += onDurationMs + gapDurationMs;
      });

      const tReady = window.setTimeout(() => {
        stepTokenRef.current += 1;
        lockedPadTokensRef.current.clear();
        stepSpawnAtRef.current = performance.now();
        setMemoryPhase('repeat');
      }, delay + 80);
      memoryTimersRef.current.push(tReady);
    },
    [clearMemoryTimers, difficulty]
  );

  const spawnNextChallenge = useCallback(
    (nextHits: number, nextLevel: number, prevPadIdx: number | null) => {
      stepTokenRef.current += 1;
      lockedPadTokensRef.current.clear();
      const now = performance.now();
      stepSpawnAtRef.current = now;
      setStepWindowPct(100);

      if (mode === 'classic' || mode === 'survival' || mode === 'endurance') {
        const nextIdx = pickNextRandomPad(gridSize, prevPadIdx);
        const nextColor = COLOR_RING[nextHits % COLOR_RING.length];
        setSinglePad({ index: nextIdx, color: nextColor });

        if (mode === 'classic') {
          stepWindowMsRef.current = getClassicWindowMs(difficulty, nextHits);
        } else if (mode === 'survival') {
          stepWindowMsRef.current = getSurvivalWindowMs(difficulty, nextHits);
        } else {
          stepWindowMsRef.current = getEnduranceWindowMs(difficulty, nextHits);
        }
      } else if (mode === 'target') {
        const wave = generateTargetWave(gridSize, nextLevel, difficulty);
        setTargetWave(wave);
        setClearedTargetIndices([]);
        stepWindowMsRef.current = wave.waveWindowMs;
      } else if (mode === 'colour') {
        const wave = generateColourWave(gridSize, nextLevel, difficulty);
        setColourWave(wave);
        stepWindowMsRef.current = wave.windowMs;
      } else if (mode === 'numbers') {
        const board = generateNumberBoard(gridSize, nextLevel, difficulty);
        setNumberBoard(board);
        setNumberCursor(0);
        stepWindowMsRef.current = 999999; // Governed by match timer
      }
    },
    [mode, gridSize, difficulty]
  );

  const finishMatch = useCallback(async () => {
    if (gameOverTriggeredRef.current) return;
    gameOverTriggeredRef.current = true;
    clearMemoryTimers();
    soundEngine.play('gameOver');
    setPhase('gameover');
    setSubmittingResult(true);

    const snap = telemetrySnapshotRef.current;
    const prevBest = personalBests[mode] ?? 0;

    const result = await submitCompletedGame({
      mode,
      difficulty,
      durationBucket:
        mode === 'classic'
          ? classicDuration
          : mode === 'target' || mode === 'colour' || mode === 'numbers'
            ? 45
            : null,
      gridSize,
      correctTaps: snap.correctTaps,
      wrongTaps: snap.wrongTaps,
      missedTaps: snap.missedTaps,
      avgReactionMs: snap.avgReactionMs,
      bestReactionMs: snap.bestReactionMs,
      longestStreak: snap.longestStreak,
      levelReached: snap.level,
      survivalTimeMs:
        mode === 'survival' || mode === 'endurance' ? Math.round(snap.elapsedMs) : 0,
      playTimeMs: Math.max(800, Math.round(snap.elapsedMs)),
      timeRemainingMs: mode === 'numbers' ? Math.max(0, Math.round(snap.timeRemainingMs)) : 0,
      reactionSamples: snap.reactions.slice(0, 100),
    });

    setFinalSummary({
      record: result.record,
      previousBest: prevBest,
      isPersonalBest: result.isPersonalBest,
      savedToCloud: result.savedToCloud,
      unlockedAchievements: result.unlockedAchievements,
      completedChallenges: result.completedChallenges,
    });
    setSubmittingResult(false);
  }, [
    clearMemoryTimers,
    personalBests,
    mode,
    difficulty,
    classicDuration,
    gridSize,
    submitCompletedGame,
  ]);

  const startCountdown = useCallback(() => {
    soundEngine.unlockFromUserGesture();
    clearMemoryTimers();
    gameOverTriggeredRef.current = false;
    setFinalSummary(null);
    setCorrectTaps(0);
    setWrongTaps(0);
    setMissedTaps(0);
    setStreak(0);
    setLongestStreak(0);
    setLevel(1);
    setLives(3);
    setMistakesLeft(5);
    setReactions([]);
    setLastReactionMs(null);
    setElapsedMs(0);
    setStepWindowPct(100);
    setMemoryShields(difficulty === 'beginner' ? 2 : 1);

    if (mode === 'classic') {
      setTimeRemainingMs(classicDuration * 1000);
    } else if (mode === 'target' || mode === 'colour' || mode === 'numbers') {
      setTimeRemainingMs(45000);
    } else {
      setTimeRemainingMs(0);
    }

    setCountdownVal(3);
    setPhase('countdown');
  }, [clearMemoryTimers, difficulty, mode, classicDuration]);

  // Countdown tick -> start playing
  useEffect(() => {
    if (phase !== 'countdown') return;
    soundEngine.play('countdownTick');

    const timer = window.setInterval(() => {
      setCountdownVal((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          soundEngine.play('countdownGo');
          setPhase('playing');

          if (mode === 'memory') {
            const seq = extendMemorySequence([], gridSize);
            setMemorySeq(seq);
            playMemoryPlayback(seq, 1);
          } else {
            spawnNextChallenge(0, 1, null);
          }
          return 0;
        }
        soundEngine.play('countdownTick');
        return prev - 1;
      });
    }, 720);

    return () => window.clearInterval(timer);
  }, [phase, mode, gridSize, playMemoryPlayback, spawnNextChallenge]);

  // Precision 30ms game loop for timers & shrinking step windows
  useEffect(() => {
    if (phase !== 'playing') return;

    let lastNow = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const dt = now - lastNow;
      lastNow = now;

      setElapsedMs((e) => e + dt);

      // Timed modes: Classic, Target, Colour, Numbers
      if (mode === 'classic' || mode === 'target' || mode === 'colour' || mode === 'numbers') {
        setTimeRemainingMs((prev) => {
          const next = prev - dt;
          if (next <= 0) {
            window.clearInterval(interval);
            finishMatch();
            return 0;
          }
          return next;
        });
      }

      // Per-target window check for Classic, Survival, Target, Colour, Endurance
      if (
        mode === 'classic' ||
        mode === 'survival' ||
        mode === 'target' ||
        mode === 'colour' ||
        mode === 'endurance'
      ) {
        const age = now - stepSpawnAtRef.current;
        const winMs = stepWindowMsRef.current;
        const remPct = Math.max(0, Math.min(100, ((winMs - age) / winMs) * 100));
        setStepWindowPct(remPct);

        if (age >= winMs) {
          // Missed window!
          soundEngine.play('wrong');
          triggerFlash('miss');
          setMissedTaps((m) => m + 1);
          setStreak(0);

          if (mode === 'survival') {
            setLives((prevLives) => {
              const nextLives = prevLives - 1;
              if (nextLives <= 0) {
                window.clearInterval(interval);
                finishMatch();
                return 0;
              }
              spawnNextChallenge(
                telemetrySnapshotRef.current.correctTaps,
                telemetrySnapshotRef.current.level,
                singlePad.index
              );
              return nextLives;
            });
          } else if (mode === 'endurance') {
            setMistakesLeft((prevM) => {
              const nextM = prevM - 1;
              if (nextM <= 0) {
                window.clearInterval(interval);
                finishMatch();
                return 0;
              }
              spawnNextChallenge(
                telemetrySnapshotRef.current.correctTaps,
                telemetrySnapshotRef.current.level,
                singlePad.index
              );
              return nextM;
            });
          } else {
            spawnNextChallenge(
              telemetrySnapshotRef.current.correctTaps,
              telemetrySnapshotRef.current.level,
              singlePad.index
            );
          }
        }
      }
    }, 35);

    return () => window.clearInterval(interval);
  }, [phase, mode, finishMatch, spawnNextChallenge, singlePad.index]);

  const registerCorrectHit = useCallback(
    (padIdx: number, reactionMs: number, advanceStep: boolean, levelOverride?: number) => {
      const clampedMs = Math.max(82, Math.min(9500, Math.round(reactionMs)));
      setLastReactionMs(clampedMs);
      setReactions((prev) => [...prev, clampedMs]);
      triggerFlash('hit');

      const nextHits = telemetrySnapshotRef.current.correctTaps + 1;
      const nextStreak = streak + 1;
      const nextBestStreak = Math.max(longestStreak, nextStreak);
      const computedLevel =
        levelOverride ?? Math.max(level, 1 + Math.floor(nextHits / (mode === 'survival' ? 5 : 8)));

      if (computedLevel > level) {
        soundEngine.play('levelUp');
      } else {
        soundEngine.play('correct', padIdx);
      }

      setCorrectTaps(nextHits);
      setStreak(nextStreak);
      setLongestStreak(nextBestStreak);
      setLevel(computedLevel);

      if (advanceStep) {
        spawnNextChallenge(nextHits, computedLevel, padIdx);
      }
    },
    [streak, longestStreak, level, mode, spawnNextChallenge]
  );

  const registerWrongTap = useCallback(
    (padIdx: number) => {
      soundEngine.play('wrong', padIdx);
      triggerFlash('miss');
      setWrongTaps((w) => w + 1);
      setStreak(0);

      if (mode === 'survival') {
        setLives((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            finishMatch();
            return 0;
          }
          return next;
        });
      } else if (mode === 'endurance') {
        setMistakesLeft((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            finishMatch();
            return 0;
          }
          return next;
        });
      }
    },
    [mode, finishMatch]
  );

  const handlePadPress = useCallback(
    (padIdx: number) => {
      if (phase !== 'playing') return;
      soundEngine.unlockFromUserGesture();

      const now = performance.now();
      const reaction = now - stepSpawnAtRef.current;

      // 1. Classic / Survival / Endurance
      if (mode === 'classic' || mode === 'survival' || mode === 'endurance') {
        const lockKey = `${stepTokenRef.current}:${padIdx}`;
        if (padIdx === singlePad.index) {
          if (lockedPadTokensRef.current.has(lockKey)) return;
          lockedPadTokensRef.current.add(lockKey);
          registerCorrectHit(padIdx, reaction, true);
        } else {
          registerWrongTap(padIdx);
        }
        return;
      }

      // 2. Memory Rush
      if (mode === 'memory') {
        if (memoryPhase !== 'repeat') return;
        const expected = memorySeq[memoryInputIdx];
        if (!expected) return;

        const memLockKey = `${stepTokenRef.current}:${memoryInputIdx}`;
        if (lockedPadTokensRef.current.has(memLockKey)) return;

        if (padIdx === expected.padIndex) {
          lockedPadTokensRef.current.add(memLockKey);
          soundEngine.play('padTone', padIdx);
          setMemoryHighlight(expected);
          window.setTimeout(() => setMemoryHighlight(null), 160);

          const nextInputIdx = memoryInputIdx + 1;
          const clampedMs = Math.max(85, Math.min(8000, Math.round(reaction)));
          setReactions((prev) => [...prev, clampedMs]);
          setLastReactionMs(clampedMs);
          setCorrectTaps((c) => c + 1);
          setStreak((s) => {
            const ns = s + 1;
            setLongestStreak((b) => Math.max(b, ns));
            return ns;
          });
          stepSpawnAtRef.current = now;

          if (nextInputIdx >= memorySeq.length) {
            // Round complete!
            const nextLevel = level + 1;
            soundEngine.play('levelUp');
            setLevel(nextLevel);
            const extended = extendMemorySequence(memorySeq, gridSize);
            setMemorySeq(extended);
            playMemoryPlayback(extended, nextLevel);
          } else {
            setMemoryInputIdx(nextInputIdx);
          }
        } else {
          // Wrong sequence tap
          soundEngine.play('wrong', padIdx);
          triggerFlash('miss');
          setWrongTaps((w) => w + 1);
          setStreak(0);
          if (memoryShields > 0) {
            setMemoryShields((s) => s - 1);
            playMemoryPlayback(memorySeq, level);
          } else {
            finishMatch();
          }
        }
        return;
      }

      // 3. Target Rush
      if (mode === 'target' && targetWave) {
        const padInfo = targetWave.pads.find((p) => p.padIndex === padIdx);
        const lockKey = `${stepTokenRef.current}:${padIdx}`;
        if (lockedPadTokensRef.current.has(lockKey)) return;

        if (padInfo && padInfo.isTarget && !clearedTargetIndices.includes(padIdx)) {
          lockedPadTokensRef.current.add(lockKey);
          const nextCleared = [...clearedTargetIndices, padIdx];
          const totalTargets = targetWave.pads.filter((p) => p.isTarget).length;

          if (nextCleared.length >= totalTargets) {
            registerCorrectHit(padIdx, reaction, true);
          } else {
            setClearedTargetIndices(nextCleared);
            registerCorrectHit(padIdx, reaction, false);
          }
        } else {
          registerWrongTap(padIdx);
        }
        return;
      }

      // 4. Colour Rush
      if (mode === 'colour' && colourWave) {
        const padInfo = colourWave.pads.find((p) => p.padIndex === padIdx);
        const lockKey = `${stepTokenRef.current}:${padIdx}`;
        if (lockedPadTokensRef.current.has(lockKey)) return;

        if (padInfo && padInfo.isCorrect) {
          lockedPadTokensRef.current.add(lockKey);
          registerCorrectHit(padIdx, reaction, true);
        } else {
          registerWrongTap(padIdx);
        }
        return;
      }

      // 5. Number Rush
      if (mode === 'numbers' && numberBoard) {
        const padInfo = numberBoard.pads.find((p) => p.padIndex === padIdx);
        const expectedVal = numberBoard.expectedSequence[numberCursor];
        const lockKey = `${stepTokenRef.current}:${numberCursor}`;
        if (lockedPadTokensRef.current.has(lockKey)) return;

        if (padInfo && padInfo.value === expectedVal) {
          lockedPadTokensRef.current.add(lockKey);
          const nextCursor = numberCursor + 1;
          stepSpawnAtRef.current = now;

          if (nextCursor >= numberBoard.expectedSequence.length) {
            // Board cleared! Grant bonus time & advance level
            const nextLvl = level + 1;
            setTimeRemainingMs((t) => Math.min(60000, t + numberBoard.boardBonusTimeMs));
            registerCorrectHit(padIdx, reaction, true, nextLvl);
          } else {
            setNumberCursor(nextCursor);
            registerCorrectHit(padIdx, reaction, false);
          }
        } else {
          registerWrongTap(padIdx);
        }
      }
    },
    [
      phase,
      mode,
      singlePad.index,
      registerCorrectHit,
      registerWrongTap,
      memoryPhase,
      memorySeq,
      memoryInputIdx,
      level,
      gridSize,
      playMemoryPlayback,
      memoryShields,
      finishMatch,
      targetWave,
      clearedTargetIndices,
      colourWave,
      numberBoard,
      numberCursor,
    ]
  );

  // Keyboard support on computers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();

      if ((k === ' ' || k === 'enter') && (phase === 'ready' || phase === 'gameover')) {
        e.preventDefault();
        startCountdown();
        return;
      }

      if (k === 'p' || k === 'escape') {
        if (phase === 'playing') {
          e.preventDefault();
          clearMemoryTimers();
          setPhase('paused');
        } else if (phase === 'paused') {
          e.preventDefault();
          stepSpawnAtRef.current = performance.now();
          setPhase('playing');
          if (mode === 'memory') {
            playMemoryPlayback(memorySeq, level);
          }
        }
        return;
      }

      if (phase !== 'playing') return;

      if (gridSize === 9) {
        const idxNum = KEYBOARD_9_MAP.indexOf(k);
        if (idxNum !== -1) {
          e.preventDefault();
          handlePadPress(idxNum);
          return;
        }
        const idxAlt = KEYBOARD_9_ALT.indexOf(k);
        if (idxAlt !== -1) {
          e.preventDefault();
          handlePadPress(idxAlt);
        }
      } else {
        const idx12 = KEYBOARD_12_MAP.indexOf(k);
        if (idx12 !== -1) {
          e.preventDefault();
          handlePadPress(idx12);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    phase,
    gridSize,
    mode,
    memorySeq,
    level,
    startCountdown,
    clearMemoryTimers,
    playMemoryPlayback,
    handlePadPress,
  ]);

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      if (arenaRef.current?.requestFullscreen) {
        try {
          await arenaRef.current.requestFullscreen();
          setIsFullscreen(true);
          return;
        } catch {
          // iOS Safari fallback
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

  // Delegate Mode 7 directly to MultiplayerArena
  if (mode === 'multiplayer') {
    return <MultiplayerArena />;
  }

  // Compute rendered pad states for the grid
  const padVisuals: RenderedPad[] = Array.from({ length: gridSize }, (_, idx) => {
    if (phase !== 'playing') {
      return { lit: false, color: 'cyan' };
    }

    if (mode === 'classic' || mode === 'survival' || mode === 'endurance') {
      return {
        lit: singlePad.index === idx,
        color: singlePad.color,
      };
    }

    if (mode === 'memory') {
      const lit = memoryHighlight?.padIndex === idx;
      return {
        lit,
        color: memoryHighlight?.color ?? COLOR_RING[idx % COLOR_RING.length],
      };
    }

    if (mode === 'target' && targetWave) {
      const found = targetWave.pads.find((p) => p.padIndex === idx);
      const isCleared = clearedTargetIndices.includes(idx);
      if (!found || isCleared) {
        return { lit: false, color: 'cyan', cleared: isCleared };
      }
      return {
        lit: true,
        color: found.color,
        symbol: found.symbol,
      };
    }

    if (mode === 'colour' && colourWave) {
      const found = colourWave.pads.find((p) => p.padIndex === idx);
      if (!found) return { lit: false, color: 'cyan' };
      return { lit: true, color: found.color };
    }

    if (mode === 'numbers' && numberBoard) {
      const found = numberBoard.pads.find((p) => p.padIndex === idx);
      if (!found) return { lit: false, color: 'cyan' };
      const clearedIdx = numberBoard.expectedSequence.indexOf(found.value);
      const alreadyTapped = clearedIdx !== -1 && clearedIdx < numberCursor;
      if (alreadyTapped) {
        return { lit: false, color: found.color, cleared: true };
      }
      return {
        lit: true,
        color: found.color,
        label: String(found.value),
      };
    }

    return { lit: false, color: 'cyan' };
  });

  const currentPersonalBest = personalBests[mode] ?? 0;
  const activeTotalXp = user && profile ? profile.xp : guestState.xp;

  return (
    <div
      ref={arenaRef}
      className={`w-full max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-3.5 ${
        isFullscreen ? 'rush-ios-fullscreen p-3 sm:p-6' : ''
      }`}
    >
      {/* Top Arena Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-rush-border bg-rush-surface/90 px-3 sm:px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <Link
            href="/games"
            className="inline-flex items-center gap-1.5 rounded-xl border border-rush-border bg-rush-card px-3 py-1.5 text-xs font-bold text-rush-text hover:border-cyan-400/50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Modes
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <ModeIcon name={modeCfg.iconName} className="w-4 h-4" />
            </span>
            <div>
              <h1 className="font-display font-bold text-xs sm:text-sm text-rush-text leading-tight">
                {modeCfg.name}
              </h1>
              <p className="text-[10px] text-rush-muted hidden sm:block">
                Personal Best: {currentPersonalBest.toLocaleString()} pts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowTutorial((v) => !v)}
            aria-label="Mode instructions"
            className="inline-flex items-center gap-1 rounded-xl border border-rush-border bg-rush-card px-2.5 py-2 text-xs font-semibold text-rush-text hover:border-cyan-400/50"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          {phase === 'playing' && (
            <button
              type="button"
              onClick={() => {
                clearMemoryTimers();
                setPhase('paused');
              }}
              aria-label="Pause game"
              className="rounded-xl border border-rush-border bg-rush-card p-2 text-rush-text hover:border-amber-400/60"
            >
              <Pause className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {(phase === 'playing' || phase === 'paused') && (
            <button
              type="button"
              onClick={startCountdown}
              aria-label="Restart match"
              className="rounded-xl border border-rush-border bg-rush-card p-2 text-rush-text hover:border-cyan-400/60"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
            aria-label="Toggle audio"
            className="rounded-xl border border-rush-border bg-rush-card p-2 text-rush-text"
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
            aria-label="Toggle full-screen arena"
            className="rounded-xl border border-rush-border bg-rush-card p-2 text-rush-text"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Tutorial Card */}
      {showTutorial && (
        <div className="rounded-2xl border border-cyan-400/40 bg-slate-950/95 p-4 text-white space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-sm text-cyan-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              How to Play {modeCfg.name}
            </h2>
            <button
              type="button"
              onClick={() => setShowTutorial(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <ul className="list-disc list-inside text-xs sm:text-sm text-slate-200 space-y-1">
            {modeCfg.shortHowTo.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
          <p className="text-xs text-amber-300/90 pt-1">
            Pro Tip: {modeCfg.proTips[0]}
          </p>
        </div>
      )}

      {/* Pre-Game Ready Setup Screen */}
      {phase === 'ready' && (
        <div className="rounded-3xl border border-cyan-400/30 bg-slate-950/92 text-white p-5 sm:p-7 space-y-5 shadow-[0_0_45px_rgba(0,229,255,0.14)]">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 px-3 py-1 text-xs font-display font-bold uppercase tracking-wider text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              {modeCfg.tagline}
            </span>
            <h2 className="font-display font-black text-2xl sm:text-4xl">{modeCfg.name}</h2>
            <p className="text-xs sm:text-sm text-slate-300">{modeCfg.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            {/* Difficulty Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-slate-400">
                Difficulty Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['beginner', 'intermediate', 'advanced', 'expert'] as DifficultyLevel[]).map(
                  (d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`rounded-xl border px-3 py-2 text-left transition ${
                        difficulty === d
                          ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_16px_rgba(0,229,255,0.2)]'
                          : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-display font-bold text-xs capitalize">
                        {DIFFICULTY_META[d].label}
                      </div>
                      <div className="text-[10px] text-cyan-300">{DIFFICULTY_META[d].badge}</div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Mode-Specific Selectors */}
            <div className="space-y-3">
              {mode === 'classic' && (
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Challenge Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([30, 60, 90] as const).map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setClassicDuration(sec)}
                        className={`rounded-xl border py-2.5 text-xs font-display font-bold transition ${
                          classicDuration === sec
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {modeCfg.supportsGrid12 && (
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Pad Matrix Size
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([9, 12] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setGridSize(sz)}
                        className={`rounded-xl border py-2.5 text-xs font-display font-bold transition ${
                          gridSize === sz
                            ? 'border-purple-400 bg-purple-500/20 text-purple-200'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {sz} Circular Pads
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-300 flex items-center justify-between">
                <span>Personal Best:</span>
                <strong className="font-mono text-amber-300 text-sm">
                  {currentPersonalBest.toLocaleString()} pts
                </strong>
              </div>
            </div>
          </div>

          <div className="max-w-xl mx-auto pt-1">
            <button
              type="button"
              onClick={startCountdown}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-display font-black text-base sm:text-lg py-4 shadow-[0_0_32px_rgba(0,229,255,0.45)] transition transform active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 fill-slate-950" />
              TAP TO LAUNCH ARENA
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              Mobile multi-touch ready • Desktop keys: 1–9 or QWE / ASD / ZXC • Space to start
            </p>
          </div>
        </div>
      )}

      {/* 3 - 2 - 1 Countdown */}
      {phase === 'countdown' && (
        <div className="rounded-3xl border border-cyan-400/30 bg-slate-950/95 py-20 text-center space-y-3 text-white">
          <p className="font-display text-xs uppercase tracking-[0.25em] text-cyan-400">
            Lock In Your Reflexes
          </p>
          <div className="font-display font-black text-7xl sm:text-8xl text-white drop-shadow-[0_0_40px_rgba(0,229,255,0.75)]">
            {countdownVal}
          </div>
          <p className="text-xs text-slate-400 capitalize">
            {modeCfg.name} • {difficulty} ({DIFFICULTY_META[difficulty].badge})
          </p>
        </div>
      )}

      {/* Active Gameplay HUD + Circular Pad Grid */}
      {(phase === 'playing' || phase === 'paused') && (
        <div className="space-y-3 relative">
          {/* Live Telemetry HUD */}
          <div className="grid grid-cols-4 gap-2 rounded-2xl border border-slate-800 bg-slate-950/95 p-2.5 sm:p-3.5 text-white">
            <div className="text-center sm:text-left">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Score</p>
              <p className="font-display font-black text-lg sm:text-2xl text-cyan-300">
                {liveScoreObj.score.toLocaleString()}
              </p>
            </div>

            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                <Timer className="w-3 h-3 text-amber-400" />
                {mode === 'survival' || mode === 'endurance'
                  ? 'Time'
                  : mode === 'memory'
                    ? 'Sequence'
                    : 'Clock'}
              </p>
              <p
                className={`font-mono font-black text-lg sm:text-2xl ${
                  (mode === 'classic' ||
                    mode === 'target' ||
                    mode === 'colour' ||
                    mode === 'numbers') &&
                  timeRemainingMs <= 6000
                    ? 'text-rose-400 animate-pulse'
                    : 'text-white'
                }`}
              >
                {mode === 'memory'
                  ? `${memorySeq.length} steps`
                  : mode === 'survival' || mode === 'endurance'
                    ? `${(elapsedMs / 1000).toFixed(1)}s`
                    : `${(timeRemainingMs / 1000).toFixed(1)}s`}
              </p>
            </div>

            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                {mode === 'survival'
                  ? 'Lives'
                  : mode === 'endurance'
                    ? 'Strikes Left'
                    : 'Streak'}
              </p>
              {mode === 'survival' ? (
                <div className="flex items-center justify-center gap-1 pt-1">
                  {[1, 2, 3].map((h) => (
                    <Heart
                      key={h}
                      className={`w-5 h-5 ${
                        h <= lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              ) : mode === 'endurance' ? (
                <p className="font-mono font-black text-lg sm:text-2xl text-emerald-400">
                  {mistakesLeft} / 5
                </p>
              ) : (
                <p className="font-mono font-black text-lg sm:text-2xl text-amber-300 flex items-center justify-center gap-0.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  {streak}x
                </p>
              )}
            </div>

            <div className="text-center sm:text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Level</p>
              <p className="font-display font-black text-lg sm:text-2xl text-purple-300">
                Lv.{level}
              </p>
            </div>
          </div>

          {/* Shrinking Window Progress Bar & Live Directive Banner */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-2.5 text-white space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              {mode === 'memory' && (
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`font-display font-bold uppercase tracking-wider ${
                      memoryPhase === 'watch' ? 'text-purple-300' : 'text-emerald-400'
                    }`}
                  >
                    {memoryPhase === 'watch'
                      ? '👀 WATCH THE ILLUMINATED SEQUENCE...'
                      : `⚡ YOUR TURN! TAP ${memoryInputIdx + 1} OF ${memorySeq.length}`}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-300">
                    Shields: {memoryShields}
                  </span>
                </div>
              )}

              {mode === 'target' && targetWave && (
                <div className="flex items-center justify-between w-full">
                  <span className="font-display font-extrabold text-sm sm:text-base text-cyan-300">
                    🎯 {targetWave.promptText}
                  </span>
                  <span className="text-[11px] text-slate-400">Ignore decoys!</span>
                </div>
              )}

              {mode === 'colour' && colourWave && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-1">
                  <div>
                    <span className="text-[10px] font-display font-bold uppercase tracking-wider text-amber-300 block">
                      {colourWave.headline}
                    </span>
                    <span className="text-xs text-slate-300">{colourWave.subline}</span>
                  </div>
                  <span
                    style={{ color: colourWave.displayWordHex }}
                    className="font-display font-black text-lg sm:text-xl tracking-wider px-3 py-0.5 rounded-xl bg-slate-900 border border-slate-700"
                  >
                    {colourWave.displayWord}
                  </span>
                </div>
              )}

              {mode === 'numbers' && numberBoard && (
                <div className="flex items-center justify-between w-full">
                  <span className="font-display font-extrabold text-sm sm:text-base text-amber-300">
                    {numberBoard.order === 'asc'
                      ? '↑ ASCENDING: LOWEST TO HIGHEST'
                      : '↓ DESCENDING: HIGHEST TO LOWEST'}
                  </span>
                  <span className="font-mono text-xs text-cyan-300">
                    Cleared {numberCursor}/{numberBoard.expectedSequence.length}
                  </span>
                </div>
              )}

              {(mode === 'classic' || mode === 'survival' || mode === 'endurance') && (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-slate-300 flex items-center gap-1.5">
                    {mode === 'endurance' && (
                      <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {mode === 'endurance'
                      ? `Unbroken Streak: ${streak} (Best: ${longestStreak})`
                      : 'Strike the illuminated circular pad immediately!'}
                  </span>
                  <span className="font-mono text-xs text-cyan-300">
                    {lastReactionMs ? `${lastReactionMs}ms` : 'Ready'}
                  </span>
                </div>
              )}
            </div>

            {mode !== 'memory' && mode !== 'numbers' && (
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${stepWindowPct}%` }}
                  className={`h-full transition-none ${
                    stepWindowPct < 30 ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-400 to-purple-500'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Illuminated Tactile Circular Button Matrix */}
          <div
            className={`rounded-3xl border p-4 sm:p-6 transition-colors duration-150 bg-slate-950/92 ${
              feedbackFlash === 'hit'
                ? 'border-cyan-400/70 shadow-[0_0_35px_rgba(0,229,255,0.22)]'
                : feedbackFlash === 'miss'
                  ? 'border-rose-500/80 shadow-[0_0_35px_rgba(239,68,68,0.28)]'
                  : 'border-slate-800'
            }`}
          >
            <div
              className={`grid gap-3 sm:gap-4 mx-auto ${
                gridSize === 12
                  ? 'grid-cols-3 sm:grid-cols-4 max-w-[460px]'
                  : 'grid-cols-3 max-w-[390px]'
              }`}
            >
              {padVisuals.map((pv, idx) => {
                const c = PAD_COLORS[pv.color];
                const keyHint =
                  gridSize === 9 ? KEYBOARD_9_MAP[idx] : KEYBOARD_12_MAP[idx];

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={phase !== 'playing'}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handlePadPress(idx);
                    }}
                    aria-label={`Arena Pad ${idx + 1}`}
                    style={pv.lit ? { boxShadow: c.glow } : undefined}
                    className={`rush-pad aspect-square rounded-full border-2 sm:border-[3px] flex items-center justify-center relative transition-transform duration-75 active:scale-90 ${
                      pv.lit
                        ? `${c.bgClass} border-white scale-[1.03]`
                        : pv.cleared
                          ? 'bg-emerald-950/40 border-emerald-500/35'
                          : 'bg-slate-900/95 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    {/* Inner Arcade Bevel Ring */}
                    <span
                      className={`w-[82%] h-[82%] rounded-full border flex flex-col items-center justify-center ${
                        pv.lit
                          ? 'border-white/55 bg-white/15 text-slate-950'
                          : 'border-slate-800 bg-slate-950/60 text-slate-500'
                      }`}
                    >
                      {pv.label ? (
                        <span className="font-display font-black text-2xl sm:text-3xl text-slate-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]">
                          {pv.label}
                        </span>
                      ) : pv.symbol ? (
                        <span className="text-2xl sm:text-3xl leading-none text-slate-950 font-black">
                          {PAD_SYMBOLS[pv.symbol].glyph}
                        </span>
                      ) : pv.lit ? (
                        <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950/85 fill-white/70" />
                      ) : null}

                      {preferences.showKeyboardHints && !pv.label && !pv.symbol && (
                        <span
                          className={`hidden md:inline font-mono text-[10px] uppercase font-bold mt-0.5 ${
                            pv.lit ? 'text-slate-950/80' : 'text-slate-600'
                          }`}
                        >
                          {keyHint}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pause Overlay */}
          {phase === 'paused' && (
            <div className="absolute inset-0 z-20 rounded-3xl bg-slate-950/94 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
              <h3 className="font-display font-black text-2xl sm:text-3xl">GAME PAUSED</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xs">
                Illuminated pads are concealed while paused so reaction timing stays 100% fair.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    stepSpawnAtRef.current = performance.now();
                    setPhase('playing');
                    if (mode === 'memory') {
                      playMemoryPlayback(memorySeq, level);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 text-slate-950 font-display font-extrabold px-5 py-3 text-sm"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  Resume Game
                </button>
                <button
                  type="button"
                  onClick={startCountdown}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-display font-bold text-white"
                >
                  Restart
                </button>
                <Link
                  href="/games"
                  className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-sm font-display font-bold text-rose-300"
                >
                  Exit Arena
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Over / Results Summary */}
      {phase === 'gameover' && (
        <div>
          {submittingResult || !finalSummary ? (
            <div className="rounded-3xl border border-cyan-400/30 bg-slate-950/95 py-16 text-center text-white space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
              <p className="font-display font-bold text-sm text-cyan-300">
                Verifying telemetry & calculating official score...
              </p>
            </div>
          ) : (
            <ResultsSummary
              modeName={modeCfg.name}
              record={finalSummary.record}
              previousBest={finalSummary.previousBest}
              isPersonalBest={finalSummary.isPersonalBest}
              savedToCloud={finalSummary.savedToCloud}
              isAuthenticated={Boolean(user)}
              currentTotalXp={activeTotalXp}
              unlockedAchievements={finalSummary.unlockedAchievements}
              completedChallenges={finalSummary.completedChallenges}
              onPlayAgain={startCountdown}
            />
          )}
        </div>
      )}
    </div>
  );
}
