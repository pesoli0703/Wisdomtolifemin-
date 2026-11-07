import {
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_SCORING_CONFIG,
  MODE_MAP,
} from '@/lib/constants/modes';
import {
  AchievementDefinition,
  DailyChallengeItem,
  GameModeConfig,
  GameTelemetryInput,
  LevelProgressInfo,
  ScoreBreakdown,
  ScoringRulesConfig,
} from '@/types/game';

export function computeAccuracy(
  correctTaps: number,
  wrongTaps: number,
  missedTaps: number
): number {
  const total = Math.max(0, correctTaps) + Math.max(0, wrongTaps) + Math.max(0, missedTaps);
  if (total === 0) return 0;
  return Math.round(((Math.max(0, correctTaps) * 100) / total) * 100) / 100;
}

export function computeMatchScore(
  telemetry: GameTelemetryInput,
  modeOverride?: Partial<GameModeConfig>,
  rulesOverride?: Partial<ScoringRulesConfig>
): { score: number; breakdown: ScoreBreakdown; accuracy: number; xpEarned: number } {
  const baseMode = MODE_MAP[telemetry.mode] ?? MODE_MAP.classic;
  const modeCfg: GameModeConfig = { ...baseMode, ...modeOverride };
  const rules: ScoringRulesConfig = {
    ...DEFAULT_SCORING_CONFIG,
    ...rulesOverride,
    difficultyMultipliers: {
      ...DEFAULT_SCORING_CONFIG.difficultyMultipliers,
      ...(rulesOverride?.difficultyMultipliers ?? {}),
    },
  };

  const correct = Math.max(0, Math.floor(telemetry.correctTaps));
  const wrong = Math.max(0, Math.floor(telemetry.wrongTaps));
  const missed = Math.max(0, Math.floor(telemetry.missedTaps));
  const streak = Math.min(correct, Math.max(0, Math.floor(telemetry.longestStreak)));
  const levelReached = Math.max(1, Math.floor(telemetry.levelReached || 1));
  const timeRemainingMs = Math.max(0, Math.floor(telemetry.timeRemainingMs ?? 0));

  const accuracy = computeAccuracy(correct, wrong, missed);
  const difficultyMultiplier = rules.difficultyMultipliers[telemetry.difficulty] ?? 1.0;

  let basePoints = 0;
  let speedBonus = 0;
  let streakBonus = 0;
  let accuracyBonus = 0;
  let levelBonus = 0;
  let timeBonus = 0;

  if (correct > 0) {
    basePoints = correct * modeCfg.basePoints;

    const avgMs =
      telemetry.avgReactionMs !== null && telemetry.avgReactionMs !== undefined
        ? Math.max(rules.minValidReactionMs, Math.min(10000, Math.round(telemetry.avgReactionMs)))
        : null;

    if (avgMs !== null && avgMs < rules.reactionTargetMs) {
      const ratio = Math.min(
        1,
        (rules.reactionTargetMs - avgMs) / Math.max(1, rules.reactionTargetMs - 150)
      );
      speedBonus = Math.round(correct * modeCfg.speedBonusMax * ratio);
    }

    const rawStreak =
      Math.floor(streak / Math.max(1, rules.streakInterval)) *
      modeCfg.streakBonusStep *
      Math.max(1, Math.floor(streak / 2));
    streakBonus = Math.min(rawStreak, correct * 60);

    if (accuracy >= rules.accuracyBonusThreshold && correct >= 5) {
      accuracyBonus = Math.round(rules.accuracyBonusPoints * (accuracy / 100));
    }

    levelBonus = Math.max(0, levelReached - 1) * 75;
    timeBonus = Math.min(600, Math.floor(timeRemainingMs / 100));
  }

  const penalties =
    wrong * modeCfg.wrongPenalty + missed * Math.floor(modeCfg.wrongPenalty / 2);

  let finalScore = 0;
  if (correct > 0) {
    const rawSubtotal = Math.max(
      0,
      basePoints + speedBonus + streakBonus + accuracyBonus + levelBonus + timeBonus - penalties
    );
    finalScore = Math.round(rawSubtotal * difficultyMultiplier);
  }

  const xpEarned =
    correct > 0
      ? rules.xpPerGameBase + Math.min(350, Math.floor(finalScore / Math.max(1, rules.xpScoreDivisor)))
      : 10;

  const breakdown: ScoreBreakdown = {
    basePoints,
    speedBonus,
    streakBonus,
    accuracyBonus,
    levelBonus,
    timeBonus,
    penalties,
    difficultyMultiplier,
    finalScore,
  };

  return { score: finalScore, breakdown, accuracy, xpEarned };
}

export function computeLevelProgress(xpInput: number): LevelProgressInfo {
  const currentXp = Math.max(0, Math.floor(xpInput || 0));
  let level = 1;
  let title = 'Beginner';
  let floorXp = 0;
  let nextXp = 250;

  if (currentXp < 250) {
    level = 1;
    title = 'Beginner';
    floorXp = 0;
    nextXp = 250;
  } else if (currentXp < 700) {
    level = 2;
    title = 'Rookie';
    floorXp = 250;
    nextXp = 700;
  } else if (currentXp < 1500) {
    level = 3;
    title = 'Fast Hands';
    floorXp = 700;
    nextXp = 1500;
  } else if (currentXp < 3000) {
    level = 4;
    title = 'Speed Master';
    floorXp = 1500;
    nextXp = 3000;
  } else if (currentXp < 5500) {
    level = 5;
    title = 'Reflex Expert';
    floorXp = 3000;
    nextXp = 5500;
  } else if (currentXp < 9000) {
    level = 6;
    title = 'Lightning Legend';
    floorXp = 5500;
    nextXp = 9000;
  } else {
    const extraLevels = Math.floor((currentXp - 9000) / 4500);
    level = 7 + extraLevels;
    title = 'PUSH RUSH Champion';
    floorXp = 9000 + extraLevels * 4500;
    nextXp = 9000 + (extraLevels + 1) * 4500;
  }

  const span = Math.max(1, nextXp - floorXp);
  const xpIntoLevel = currentXp - floorXp;
  const xpNeededForNext = Math.max(0, nextXp - currentXp);
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpIntoLevel / span) * 100)));

  return {
    level,
    title,
    currentXp,
    floorXp,
    nextXp,
    progressPercent,
    xpIntoLevel,
    xpNeededForNext,
  };
}

export function validateTelemetryPayload(
  input: GameTelemetryInput,
  minReactionMs = 80
): { valid: boolean; error?: string } {
  if (!MODE_MAP[input.mode]) {
    return { valid: false, error: 'Unknown game mode.' };
  }
  if (!['beginner', 'intermediate', 'advanced', 'expert'].includes(input.difficulty)) {
    return { valid: false, error: 'Invalid difficulty level.' };
  }
  if (
    input.correctTaps < 0 ||
    input.wrongTaps < 0 ||
    input.missedTaps < 0 ||
    !Number.isFinite(input.playTimeMs) ||
    input.playTimeMs < 500
  ) {
    return { valid: false, error: 'Invalid match telemetry duration or tap counts.' };
  }
  const maxAllowedTaps = Math.max(20, Math.ceil((input.playTimeMs / 1000) * 14));
  if (input.correctTaps > maxAllowedTaps) {
    return { valid: false, error: 'Tap rate exceeds human physiological anti-cheat threshold.' };
  }
  if (
    input.correctTaps > 0 &&
    input.bestReactionMs !== null &&
    input.bestReactionMs < minReactionMs
  ) {
    return {
      valid: false,
      error: `Reaction time (${input.bestReactionMs}ms) is below minimum valid human threshold (${minReactionMs}ms).`,
    };
  }
  return { valid: true };
}

export function generateDeterministicDailyChallenges(dateStr: string): DailyChallengeItem[] {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0] || 2026;
  const month = parts[1] || 1;
  const day = parts[2] || 1;
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const startOfYear = new Date(Date.UTC(year, 0, 0));
  const doy = Math.floor((utcDate.getTime() - startOfYear.getTime()) / 86400000);
  const seed = doy + year * 7;

  const slot1Options: Array<Omit<DailyChallengeItem, 'id' | 'challengeDate' | 'slot'>> = [
    {
      title: 'Classic Speed Blitz',
      description: 'Score at least 2,200 points in a single Classic Speed match.',
      mode: 'classic',
      metric: 'score',
      targetValue: 2200,
      xpReward: 175,
    },
    {
      title: 'Precision Target Hunter',
      description: 'Score at least 2,000 points in Target Rush without falling for decoys.',
      mode: 'target',
      metric: 'score',
      targetValue: 2000,
      xpReward: 175,
    },
    {
      title: 'Chromatic Reflex Run',
      description: 'Score at least 1,800 points in Colour Rush under shifting rules.',
      mode: 'colour',
      metric: 'score',
      targetValue: 1800,
      xpReward: 175,
    },
    {
      title: 'Numeric Sequence Sprint',
      description: 'Score at least 2,000 points in Number Rush.',
      mode: 'numbers',
      metric: 'score',
      targetValue: 2000,
      xpReward: 175,
    },
  ];

  const slot2Options: Array<Omit<DailyChallengeItem, 'id' | 'challengeDate' | 'slot'>> = [
    {
      title: 'Memory Matrix 8',
      description: 'Reach Level 8 or higher in Memory Rush.',
      mode: 'memory',
      metric: 'memory_level',
      targetValue: 8,
      xpReward: 200,
    },
    {
      title: '60-Second Survivor',
      description: 'Survive for at least 60 seconds in Survival Mode.',
      mode: 'survival',
      metric: 'survival_seconds',
      targetValue: 60,
      xpReward: 200,
    },
    {
      title: 'Endurance Streak 25',
      description: 'Hit a 25-tap unbroken streak in Endurance Challenge.',
      mode: 'endurance',
      metric: 'streak',
      targetValue: 25,
      xpReward: 200,
    },
  ];

  const slot3Options: Array<Omit<DailyChallengeItem, 'id' | 'challengeDate' | 'slot'>> = [
    {
      title: 'Laser Accuracy 95%',
      description: 'Finish any match with at least 95% accuracy (min 10 correct taps).',
      mode: null,
      metric: 'accuracy',
      targetValue: 95,
      xpReward: 150,
    },
    {
      title: 'Daily Warmup Trio',
      description: 'Complete 3 matches across any PUSH RUSH game modes today.',
      mode: null,
      metric: 'games_count',
      targetValue: 3,
      xpReward: 150,
    },
  ];

  const c1 = slot1Options[seed % 4];
  const c2 = slot2Options[seed % 3];
  const c3 = slot3Options[(seed + 1) % 2];

  return [
    { id: `local-${dateStr}-1`, challengeDate: dateStr, slot: 1, ...c1 },
    { id: `local-${dateStr}-2`, challengeDate: dateStr, slot: 2, ...c2 },
    { id: `local-${dateStr}-3`, challengeDate: dateStr, slot: 3, ...c3 },
  ];
}

export function evaluateLocalAchievements(params: {
  alreadyUnlocked: string[];
  gamesPlayed: number;
  verifiedScore: number;
  accuracy: number;
  correctTaps: number;
  bestReactionMs: number | null;
  longestStreak: number;
  mode: string;
  levelReached: number;
  survivalTimeMs: number;
  multiplayerWins: number;
  dailyCompletedCount: number;
  totalXp: number;
  definitions?: AchievementDefinition[];
}): AchievementDefinition[] {
  const defs = params.definitions ?? DEFAULT_ACHIEVEMENTS;
  const unlockedSet = new Set(params.alreadyUnlocked);
  const newlyUnlocked: AchievementDefinition[] = [];

  for (const ach of defs) {
    if (unlockedSet.has(ach.slug)) continue;

    let hit = false;
    switch (ach.metric) {
      case 'games_played':
        hit = params.gamesPlayed >= ach.targetValue;
        break;
      case 'single_score':
        hit = params.verifiedScore >= ach.targetValue;
        break;
      case 'best_reaction_ms':
        hit =
          params.bestReactionMs !== null &&
          params.bestReactionMs <= ach.targetValue &&
          params.correctTaps >= 5;
        break;
      case 'perfect_accuracy':
        hit = params.accuracy === 100 && params.correctTaps >= ach.targetValue;
        break;
      case 'memory_level':
        hit = params.mode === 'memory' && params.levelReached >= ach.targetValue;
        break;
      case 'survival_seconds':
        hit =
          params.mode === 'survival' &&
          Math.floor(params.survivalTimeMs / 1000) >= ach.targetValue;
        break;
      case 'multiplayer_wins':
        hit = params.multiplayerWins >= ach.targetValue;
        break;
      case 'daily_completed':
        hit = params.dailyCompletedCount >= ach.targetValue;
        break;
      case 'longest_streak':
        hit = params.longestStreak >= ach.targetValue;
        break;
      case 'target_score':
        hit = params.mode === 'target' && params.verifiedScore >= ach.targetValue;
        break;
      case 'colour_score':
        hit = params.mode === 'colour' && params.verifiedScore >= ach.targetValue;
        break;
      case 'numbers_score':
        hit = params.mode === 'numbers' && params.verifiedScore >= ach.targetValue;
        break;
      case 'endurance_streak':
        hit = params.mode === 'endurance' && params.longestStreak >= ach.targetValue;
        break;
      case 'total_xp':
        hit = params.totalXp >= ach.targetValue;
        break;
      default:
        hit = false;
    }

    if (hit) {
      newlyUnlocked.push(ach);
    }
  }

  return newlyUnlocked;
}
