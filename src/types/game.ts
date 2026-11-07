export type GameModeSlug =
  | 'classic'
  | 'memory'
  | 'survival'
  | 'target'
  | 'colour'
  | 'numbers'
  | 'multiplayer'
  | 'endurance';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type PadColorId = 'cyan' | 'purple' | 'orange' | 'green' | 'red' | 'yellow';

export type PadSymbolId = 'bolt' | 'star' | 'diamond' | 'triangle' | 'circle' | 'hex';

export interface ScoreBreakdown {
  basePoints: number;
  speedBonus: number;
  streakBonus: number;
  accuracyBonus: number;
  levelBonus: number;
  timeBonus: number;
  penalties: number;
  difficultyMultiplier: number;
  finalScore: number;
}

export interface ScoringRulesConfig {
  reactionTargetMs: number;
  minValidReactionMs: number;
  streakInterval: number;
  accuracyBonusThreshold: number;
  accuracyBonusPoints: number;
  difficultyMultipliers: Record<DifficultyLevel, number>;
  xpPerGameBase: number;
  xpScoreDivisor: number;
}

export interface GameModeConfig {
  slug: GameModeSlug;
  name: string;
  tagline: string;
  description: string;
  shortHowTo: string[];
  proTips: string[];
  accentColor: string;
  badgeColor: PadColorId;
  iconName: string;
  isEnabled: boolean;
  isFeatured: boolean;
  proOnly: boolean;
  supportsGrid12: boolean;
  supportsOffline: boolean;
  basePoints: number;
  wrongPenalty: number;
  speedBonusMax: number;
  streakBonusStep: number;
  sortOrder: number;
}

export interface GameTelemetryInput {
  mode: GameModeSlug;
  difficulty: DifficultyLevel;
  durationBucket?: number | null;
  gridSize: 9 | 12;
  correctTaps: number;
  wrongTaps: number;
  missedTaps: number;
  avgReactionMs: number | null;
  bestReactionMs: number | null;
  longestStreak: number;
  levelReached: number;
  survivalTimeMs: number;
  playTimeMs: number;
  timeRemainingMs?: number;
  isMultiplayerWin?: boolean;
  reactionSamples: number[];
  metadata?: Record<string, unknown>;
}

export interface GameMatchRecord extends GameTelemetryInput {
  id: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  accuracy: number;
  xpAwarded: number;
  isPersonalBest?: boolean;
  verifiedServer?: boolean;
  createdAt: string;
}

export interface PlayerProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string;
  country: string;
  favorite_mode: GameModeSlug;
  role: 'player' | 'admin';
  membership_tier: 'free' | 'pro';
  xp: number;
  level: number;
  level_title: string;
  games_played: number;
  total_score: number;
  total_play_time_ms: number;
  best_reaction_ms: number | null;
  longest_streak: number;
  multiplayer_wins: number;
  daily_streak: number;
  last_played_date: string | null;
  is_suspended: boolean;
  settings_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LevelProgressInfo {
  level: number;
  title: string;
  currentXp: number;
  floorXp: number;
  nextXp: number;
  progressPercent: number;
  xpIntoLevel: number;
  xpNeededForNext: number;
}

export interface AchievementDefinition {
  slug: string;
  title: string;
  description: string;
  category: 'milestone' | 'speed' | 'accuracy' | 'mode' | 'social' | 'daily';
  icon: string;
  badgeColor: string;
  metric: string;
  targetValue: number;
  xpReward: number;
  sortOrder: number;
}

export interface UnlockedAchievement {
  slug: string;
  unlockedAt: string;
  gameResultId?: string | null;
}

export interface DailyChallengeItem {
  id: string;
  challengeDate: string;
  slot: number;
  title: string;
  description: string;
  mode: GameModeSlug | null;
  metric: 'score' | 'memory_level' | 'survival_seconds' | 'accuracy' | 'games_count' | 'streak' | 'fast_reaction_ms';
  targetValue: number;
  xpReward: number;
  progressValue?: number;
  isCompleted?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  country: string;
  level: number;
  levelTitle: string;
  totalScore: number;
  bestScore: number;
  bestReactionMs: number | null;
  avgAccuracy: number;
  gamesCount: number;
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  message: string;
  badge: string;
  variant: 'electric' | 'emerald' | 'amber' | 'purple';
  cta_label: string | null;
  cta_href: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserPreferences {
  soundEnabled: boolean;
  volume: number; // 0..100
  vibrationEnabled: boolean;
  theme: 'dark' | 'light';
  reducedMotion: boolean;
  defaultDifficulty: DifficultyLevel;
  defaultGridSize: 9 | 12;
  showKeyboardHints: boolean;
}
