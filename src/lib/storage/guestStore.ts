import {
  computeLevelProgress,
  computeMatchScore,
  evaluateLocalAchievements,
  generateDeterministicDailyChallenges,
} from '@/lib/scoring/engine';
import {
  AchievementDefinition,
  DailyChallengeItem,
  GameMatchRecord,
  GameModeSlug,
  GameTelemetryInput,
  UnlockedAchievement,
  UserPreferences,
} from '@/types/game';

const GUEST_DATA_KEY = 'push_rush_guest_state_v1';
const PREFS_KEY = 'push_rush_user_prefs_v1';
const OFFLINE_QUEUE_KEY = 'push_rush_offline_sync_queue_v1';

export interface GuestPlayerState {
  guestName: string;
  xp: number;
  gamesPlayed: number;
  totalScore: number;
  totalPlayTimeMs: number;
  bestReactionMs: number | null;
  longestStreak: number;
  multiplayerWins: number;
  dailyStreak: number;
  lastPlayedDate: string | null;
  personalBests: Partial<Record<GameModeSlug, number>>;
  bestSurvivalMs: number;
  longestMemorySequence: number;
  unlockedAchievements: UnlockedAchievement[];
  dailyProgress: Record<string, { progressValue: number; isCompleted: boolean }>;
  history: GameMatchRecord[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  soundEnabled: true,
  volume: 75,
  vibrationEnabled: true,
  theme: 'dark',
  reducedMotion: false,
  defaultDifficulty: 'intermediate',
  defaultGridSize: 9,
  showKeyboardHints: true,
};

export const INITIAL_GUEST_STATE: GuestPlayerState = {
  guestName: 'Guest Sprinter',
  xp: 0,
  gamesPlayed: 0,
  totalScore: 0,
  totalPlayTimeMs: 0,
  bestReactionMs: null,
  longestStreak: 0,
  multiplayerWins: 0,
  dailyStreak: 0,
  lastPlayedDate: null,
  personalBests: {},
  bestSurvivalMs: 0,
  longestMemorySequence: 0,
  unlockedAchievements: [],
  dailyProgress: {},
  history: [],
};

export function getUtcTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) {
      const prefersReduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return { ...DEFAULT_PREFERENCES, reducedMotion: Boolean(prefersReduced) };
    }
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadGuestState(): GuestPlayerState {
  if (typeof window === 'undefined') return INITIAL_GUEST_STATE;
  try {
    const raw = window.localStorage.getItem(GUEST_DATA_KEY);
    if (!raw) return INITIAL_GUEST_STATE;
    return { ...INITIAL_GUEST_STATE, ...JSON.parse(raw) };
  } catch {
    return INITIAL_GUEST_STATE;
  }
}

export function saveGuestState(state: GuestPlayerState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function resetGuestState(): GuestPlayerState {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(GUEST_DATA_KEY);
  }
  return INITIAL_GUEST_STATE;
}

export function recordGuestGameLocally(
  telemetry: GameTelemetryInput,
  achievementDefs?: AchievementDefinition[]
): {
  record: GameMatchRecord;
  updatedState: GuestPlayerState;
  isPersonalBest: boolean;
  unlockedAchievements: AchievementDefinition[];
  completedChallenges: DailyChallengeItem[];
  bonusXp: number;
} {
  const prev = loadGuestState();
  const { score, breakdown, accuracy, xpEarned } = computeMatchScore(telemetry);

  const prevBest = prev.personalBests[telemetry.mode] ?? 0;
  const isPersonalBest = score > prevBest && score > 0;

  const today = getUtcTodayString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let dailyStreak = prev.dailyStreak;
  if (prev.lastPlayedDate === today) {
    dailyStreak = Math.max(1, dailyStreak);
  } else if (prev.lastPlayedDate === yesterday) {
    dailyStreak = dailyStreak + 1;
  } else {
    dailyStreak = 1;
  }

  const cleanBestMs =
    telemetry.correctTaps > 0 && telemetry.bestReactionMs !== null
      ? Math.max(80, Math.round(telemetry.bestReactionMs))
      : null;

  const nextBestReaction =
    cleanBestMs === null
      ? prev.bestReactionMs
      : prev.bestReactionMs === null
        ? cleanBestMs
        : Math.min(prev.bestReactionMs, cleanBestMs);

  // Evaluate daily challenges locally for guest
  const todayChallenges = generateDeterministicDailyChallenges(today);
  const nextDailyProgress = { ...prev.dailyProgress };
  const completedChallenges: DailyChallengeItem[] = [];
  let bonusXp = 0;

  for (const chal of todayChallenges) {
    if (chal.mode !== null && chal.mode !== telemetry.mode) continue;
    const key = `${today}:${chal.slot}`;
    const existing = nextDailyProgress[key] ?? { progressValue: 0, isCompleted: false };
    if (existing.isCompleted) continue;

    let prog = existing.progressValue;
    switch (chal.metric) {
      case 'score':
        prog = Math.max(prog, score);
        break;
      case 'memory_level':
        if (telemetry.mode === 'memory') prog = Math.max(prog, telemetry.levelReached);
        break;
      case 'survival_seconds':
        if (telemetry.mode === 'survival')
          prog = Math.max(prog, Math.floor(telemetry.survivalTimeMs / 1000));
        break;
      case 'accuracy':
        if (telemetry.correctTaps >= 10) prog = Math.max(prog, Math.floor(accuracy));
        break;
      case 'games_count':
        prog = prog + 1;
        break;
      case 'streak':
        prog = Math.max(prog, telemetry.longestStreak);
        break;
      case 'fast_reaction_ms':
        if (cleanBestMs !== null && cleanBestMs <= chal.targetValue) prog = chal.targetValue;
        break;
    }

    const done = prog >= chal.targetValue;
    if (done) {
      bonusXp += chal.xpReward;
      completedChallenges.push({ ...chal, progressValue: prog, isCompleted: true });
    }
    nextDailyProgress[key] = { progressValue: prog, isCompleted: done };
  }

  const dailyCompletedCount = Object.values(nextDailyProgress).filter((d) => d.isCompleted).length;
  const nextGamesPlayed = prev.gamesPlayed + 1;
  const nextMultiplayerWins =
    prev.multiplayerWins + (telemetry.mode === 'multiplayer' && telemetry.isMultiplayerWin ? 1 : 0);
  const nextLongestStreak = Math.max(prev.longestStreak, telemetry.longestStreak);

  const newlyUnlocked = evaluateLocalAchievements({
    alreadyUnlocked: prev.unlockedAchievements.map((u) => u.slug),
    gamesPlayed: nextGamesPlayed,
    verifiedScore: score,
    accuracy,
    correctTaps: telemetry.correctTaps,
    bestReactionMs: cleanBestMs,
    longestStreak: nextLongestStreak,
    mode: telemetry.mode,
    levelReached: telemetry.levelReached,
    survivalTimeMs: telemetry.survivalTimeMs,
    multiplayerWins: nextMultiplayerWins,
    dailyCompletedCount,
    totalXp: prev.xp + xpEarned + bonusXp,
    definitions: achievementDefs,
  });

  for (const ach of newlyUnlocked) {
    bonusXp += ach.xpReward;
  }

  const totalAwardedXp = xpEarned + bonusXp;
  const createdAt = new Date().toISOString();
  const matchId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const record: GameMatchRecord = {
    ...telemetry,
    id: matchId,
    score,
    scoreBreakdown: breakdown,
    accuracy,
    xpAwarded: totalAwardedXp,
    isPersonalBest,
    verifiedServer: false,
    createdAt,
  };

  const updatedState: GuestPlayerState = {
    ...prev,
    xp: prev.xp + totalAwardedXp,
    gamesPlayed: nextGamesPlayed,
    totalScore: prev.totalScore + score,
    totalPlayTimeMs: prev.totalPlayTimeMs + telemetry.playTimeMs,
    bestReactionMs: nextBestReaction,
    longestStreak: nextLongestStreak,
    multiplayerWins: nextMultiplayerWins,
    dailyStreak,
    lastPlayedDate: today,
    personalBests: {
      ...prev.personalBests,
      [telemetry.mode]: Math.max(prevBest, score),
    },
    bestSurvivalMs:
      telemetry.mode === 'survival'
        ? Math.max(prev.bestSurvivalMs, telemetry.survivalTimeMs)
        : prev.bestSurvivalMs,
    longestMemorySequence:
      telemetry.mode === 'memory'
        ? Math.max(prev.longestMemorySequence, telemetry.levelReached)
        : prev.longestMemorySequence,
    unlockedAchievements: [
      ...prev.unlockedAchievements,
      ...newlyUnlocked.map((a) => ({ slug: a.slug, unlockedAt: createdAt, gameResultId: matchId })),
    ],
    dailyProgress: nextDailyProgress,
    history: [record, ...prev.history].slice(0, 100),
  };

  saveGuestState(updatedState);
  computeLevelProgress(updatedState.xp);

  return {
    record,
    updatedState,
    isPersonalBest,
    unlockedAchievements: newlyUnlocked,
    completedChallenges,
    bonusXp,
  };
}

export function enqueueOfflineMatch(telemetry: GameTelemetryInput): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    const list: GameTelemetryInput[] = raw ? JSON.parse(raw) : [];
    list.push(telemetry);
    window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(list.slice(-25)));
  } catch {
    // Ignore storage errors
  }
}

export function consumeOfflineMatchQueue(): GameTelemetryInput[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
