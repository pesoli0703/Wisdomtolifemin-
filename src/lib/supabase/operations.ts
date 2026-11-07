import {
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_GAME_MODES,
} from '@/lib/constants/modes';
import { generateDeterministicDailyChallenges } from '@/lib/scoring/engine';
import { getUtcTodayString } from '@/lib/storage/guestStore';
import {
  AchievementDefinition,
  DailyChallengeItem,
  GameMatchRecord,
  GameModeConfig,
  GameModeSlug,
  LeaderboardEntry,
  PlatformAnnouncement,
  PlayerProfile,
} from '@/types/game';
import { getSupabaseBrowserClient } from './client';

export async function fetchPlatformStats(): Promise<{
  registeredPlayers: number;
  totalGamesPlayed: number;
  gamesToday: number;
  fastestReactionMs: number | null;
  avgReactionMs: number | null;
}> {
  const sb = getSupabaseBrowserClient();
  if (!sb) {
    return {
      registeredPlayers: 0,
      totalGamesPlayed: 0,
      gamesToday: 0,
      fastestReactionMs: null,
      avgReactionMs: null,
    };
  }
  const { data, error } = await sb.rpc('pr_get_platform_stats');
  if (error || !data) {
    return {
      registeredPlayers: 0,
      totalGamesPlayed: 0,
      gamesToday: 0,
      fastestReactionMs: null,
      avgReactionMs: null,
    };
  }
  return data;
}

export async function fetchActiveAnnouncements(): Promise<PlatformAnnouncement[]> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return [];
  const { data } = await sb
    .from('pr_announcements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(3);
  return (data as PlatformAnnouncement[]) ?? [];
}

export async function fetchGameModes(): Promise<GameModeConfig[]> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return DEFAULT_GAME_MODES;
  const { data, error } = await sb
    .from('pr_game_modes')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error || !data || data.length === 0) return DEFAULT_GAME_MODES;

  const dbMap = new Map(data.map((row: Record<string, unknown>) => [row.slug as string, row]));
  return DEFAULT_GAME_MODES.map((def) => {
    const dbRow = dbMap.get(def.slug);
    if (!dbRow) return def;
    return {
      ...def,
      name: (dbRow.name as string) ?? def.name,
      tagline: (dbRow.tagline as string) ?? def.tagline,
      description: (dbRow.description as string) ?? def.description,
      isEnabled: Boolean(dbRow.is_enabled),
      isFeatured: Boolean(dbRow.is_featured),
      proOnly: Boolean(dbRow.pro_only),
      basePoints: Number(dbRow.base_points ?? def.basePoints),
      wrongPenalty: Number(dbRow.wrong_penalty ?? def.wrongPenalty),
      speedBonusMax: Number(dbRow.speed_bonus_max ?? def.speedBonusMax),
      streakBonusStep: Number(dbRow.streak_bonus_step ?? def.streakBonusStep),
      sortOrder: Number(dbRow.sort_order ?? def.sortOrder),
    };
  });
}

export async function fetchLeaderboard(
  period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time',
  mode: GameModeSlug | 'all' = 'all',
  limit = 50
): Promise<LeaderboardEntry[]> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return [];
  const { data, error } = await sb.rpc('pr_get_leaderboard', {
    p_period: period,
    p_mode: mode,
    p_limit: limit,
  });
  if (error || !Array.isArray(data)) return [];
  return data.map((row: Record<string, unknown>) => ({
    rank: Number(row.rank),
    userId: String(row.user_id),
    username: String(row.username),
    displayName: String(row.display_name || row.username),
    avatarUrl: (row.avatar_url as string) || null,
    country: String(row.country || ''),
    level: Number(row.level || 1),
    levelTitle: String(row.level_title || 'Beginner'),
    totalScore: Number(row.total_score || 0),
    bestScore: Number(row.best_score || 0),
    bestReactionMs: row.best_reaction_ms !== null ? Number(row.best_reaction_ms) : null,
    avgAccuracy: Number(row.avg_accuracy || 0),
    gamesCount: Number(row.games_count || 0),
  }));
}

export async function fetchTodayDailyChallenges(
  userId?: string | null
): Promise<DailyChallengeItem[]> {
  const today = getUtcTodayString();
  const sb = getSupabaseBrowserClient();
  if (!sb) return generateDeterministicDailyChallenges(today);

  const { data, error } = await sb.rpc('pr_ensure_daily_challenges', { p_date: today });
  if (error || !Array.isArray(data) || data.length === 0) {
    return generateDeterministicDailyChallenges(today);
  }

  let progressMap = new Map<string, { progress_value: number; is_completed: boolean }>();
  if (userId) {
    const ids = data.map((c: Record<string, unknown>) => String(c.id));
    const { data: progRows } = await sb
      .from('pr_user_daily_challenges')
      .select('challenge_id, progress_value, is_completed')
      .eq('user_id', userId)
      .in('challenge_id', ids);
    if (progRows) {
      progressMap = new Map(
        progRows.map((r: Record<string, unknown>) => [
          String(r.challenge_id),
          {
            progress_value: Number(r.progress_value || 0),
            is_completed: Boolean(r.is_completed),
          },
        ])
      );
    }
  }

  return data.map((row: Record<string, unknown>) => {
    const id = String(row.id);
    const p = progressMap.get(id);
    return {
      id,
      challengeDate: String(row.challenge_date),
      slot: Number(row.slot),
      title: String(row.title),
      description: String(row.description),
      mode: (row.mode as GameModeSlug) || null,
      metric: row.metric as DailyChallengeItem['metric'],
      targetValue: Number(row.target_value),
      xpReward: Number(row.xp_reward),
      progressValue: p?.progress_value ?? 0,
      isCompleted: p?.is_completed ?? false,
    };
  });
}

export async function fetchAchievementsCatalog(): Promise<AchievementDefinition[]> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return DEFAULT_ACHIEVEMENTS;
  const { data, error } = await sb
    .from('pr_achievements')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error || !data || data.length === 0) return DEFAULT_ACHIEVEMENTS;

  return data.map((r: Record<string, unknown>) => ({
    slug: String(r.slug),
    title: String(r.title),
    description: String(r.description),
    category: r.category as AchievementDefinition['category'],
    icon: String(r.icon).trim(),
    badgeColor: String(r.badge_color || 'cyan'),
    metric: String(r.metric),
    targetValue: Number(r.target_value),
    xpReward: Number(r.xp_reward),
    sortOrder: Number(r.sort_order),
  }));
}

export async function fetchUserAchievements(userId: string): Promise<
  Array<{ slug: string; unlockedAt: string; gameResultId: string | null }>
> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return [];
  const { data } = await sb
    .from('pr_user_achievements')
    .select('achievement_slug, unlocked_at, game_result_id')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });
  if (!data) return [];
  return data.map((r: Record<string, unknown>) => ({
    slug: String(r.achievement_slug),
    unlockedAt: String(r.unlocked_at),
    gameResultId: (r.game_result_id as string) || null,
  }));
}

export async function fetchUserGameHistory(
  userId: string,
  limit = 60
): Promise<GameMatchRecord[]> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return [];
  const { data } = await sb
    .from('pr_game_results')
    .select('*')
    .eq('user_id', userId)
    .eq('is_revoked', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (!data) return [];

  return data.map((r: Record<string, unknown>) => ({
    id: String(r.id),
    mode: r.mode as GameModeSlug,
    difficulty: r.difficulty as GameMatchRecord['difficulty'],
    durationBucket: r.duration_bucket ? Number(r.duration_bucket) : null,
    gridSize: (Number(r.grid_size) === 12 ? 12 : 9) as 9 | 12,
    score: Number(r.score),
    scoreBreakdown: (r.score_breakdown as GameMatchRecord['scoreBreakdown']) ?? {
      basePoints: Number(r.score),
      speedBonus: 0,
      streakBonus: 0,
      accuracyBonus: 0,
      levelBonus: 0,
      timeBonus: 0,
      penalties: 0,
      difficultyMultiplier: 1,
      finalScore: Number(r.score),
    },
    correctTaps: Number(r.correct_taps),
    wrongTaps: Number(r.wrong_taps),
    missedTaps: Number(r.missed_taps),
    accuracy: Number(r.accuracy),
    avgReactionMs: r.avg_reaction_ms !== null ? Number(r.avg_reaction_ms) : null,
    bestReactionMs: r.best_reaction_ms !== null ? Number(r.best_reaction_ms) : null,
    longestStreak: Number(r.longest_streak),
    levelReached: Number(r.level_reached),
    survivalTimeMs: Number(r.survival_time_ms),
    playTimeMs: Number(r.play_time_ms),
    xpAwarded: Number(r.xp_awarded),
    isMultiplayerWin: Boolean(r.is_multiplayer_win),
    reactionSamples: Array.isArray(r.reaction_samples) ? (r.reaction_samples as number[]) : [],
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    verifiedServer: true,
    createdAt: String(r.created_at),
  }));
}

export async function fetchUserPersonalBests(
  userId: string
): Promise<Partial<Record<GameModeSlug, number>>> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return {};
  const { data } = await sb
    .from('pr_game_results')
    .select('mode, score')
    .eq('user_id', userId)
    .eq('is_revoked', false);
  if (!data) return {};
  const bests: Partial<Record<GameModeSlug, number>> = {};
  for (const row of data as Array<{ mode: GameModeSlug; score: number }>) {
    const prev = bests[row.mode] ?? 0;
    if (row.score > prev) bests[row.mode] = row.score;
  }
  return bests;
}

export async function fetchProfileByUsername(username: string): Promise<PlayerProfile | null> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return null;
  const { data } = await sb
    .from('pr_profiles')
    .select('*')
    .ilike('username', username)
    .maybeSingle();
  return (data as PlayerProfile) ?? null;
}
