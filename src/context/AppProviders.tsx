'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { soundEngine } from '@/lib/audio/soundEngine';
import {
  consumeOfflineMatchQueue,
  DEFAULT_PREFERENCES,
  enqueueOfflineMatch,
  GuestPlayerState,
  INITIAL_GUEST_STATE,
  loadGuestState,
  loadUserPreferences,
  recordGuestGameLocally,
  saveUserPreferences,
} from '@/lib/storage/guestStore';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  fetchAchievementsCatalog,
  fetchGameModes,
  fetchUserPersonalBests,
} from '@/lib/supabase/operations';
import {
  AchievementDefinition,
  GameMatchRecord,
  GameModeConfig,
  GameModeSlug,
  GameTelemetryInput,
  PlayerProfile,
  UserPreferences,
} from '@/types/game';
import { DEFAULT_ACHIEVEMENTS, DEFAULT_GAME_MODES } from '@/lib/constants/modes';

export interface RewardToastItem {
  id: string;
  kind: 'achievement' | 'challenge' | 'pb' | 'info';
  title: string;
  subtitle: string;
  xpBonus?: number;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface AppContextValue {
  user: User | null;
  profile: PlayerProfile | null;
  authLoading: boolean;
  guestState: GuestPlayerState;
  preferences: UserPreferences;
  gameModes: GameModeConfig[];
  achievementsCatalog: AchievementDefinition[];
  personalBests: Partial<Record<GameModeSlug, number>>;
  isOnline: boolean;
  canInstallPwa: boolean;
  isIosSafari: boolean;
  toasts: RewardToastItem[];
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  refreshProfile: () => Promise<void>;
  refreshGuestState: () => void;
  signOut: () => Promise<void>;
  triggerInstallPwa: () => Promise<'installed' | 'ios-guide' | 'unavailable'>;
  pushToast: (toast: Omit<RewardToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
  submitCompletedGame: (telemetry: GameTelemetryInput) => Promise<{
    record: GameMatchRecord;
    isPersonalBest: boolean;
    xpEarned: number;
    bonusXp: number;
    unlockedAchievements: Array<{ title: string; description: string; xpReward: number }>;
    completedChallenges: Array<{ title: string; xpReward: number }>;
    savedToCloud: boolean;
  }>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [guestState, setGuestState] = useState<GuestPlayerState>(INITIAL_GUEST_STATE);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [gameModes, setGameModes] = useState<GameModeConfig[]>(DEFAULT_GAME_MODES);
  const [achievementsCatalog, setAchievementsCatalog] =
    useState<AchievementDefinition[]>(DEFAULT_ACHIEVEMENTS);
  const [cloudPersonalBests, setCloudPersonalBests] = useState<
    Partial<Record<GameModeSlug, number>>
  >({});
  const [isOnline, setIsOnline] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [toasts, setToasts] = useState<RewardToastItem[]>([]);

  const pushToast = useCallback((toast: Omit<RewardToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshGuestState = useCallback(() => {
    setGuestState(loadGuestState());
  }, []);

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch };
      saveUserPreferences(next);
      soundEngine.configure({
        soundEnabled: next.soundEnabled,
        volume: next.volume,
        vibrationEnabled: next.vibrationEnabled,
      });
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next.theme === 'dark');
        document.documentElement.classList.toggle('light', next.theme === 'light');
      }
      return next;
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    const sb = getSupabaseBrowserClient();
    if (!sb) {
      setAuthLoading(false);
      return;
    }
    const {
      data: { session },
    } = await sb.auth.getSession();
    const authUser = session?.user ?? null;
    setUser(authUser);

    if (!authUser) {
      setProfile(null);
      setCloudPersonalBests({});
      setAuthLoading(false);
      return;
    }

    const { data: ensured } = await sb.rpc('pr_ensure_profile', {
      p_preferred_username: null,
    });
    if (ensured) {
      setProfile(ensured as PlayerProfile);
    } else {
      const { data: fallback } = await sb
        .from('pr_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      setProfile((fallback as PlayerProfile) ?? null);
    }

    const bests = await fetchUserPersonalBests(authUser.id);
    setCloudPersonalBests(bests);
    setAuthLoading(false);
  }, []);

  // Initial client hydration: preferences, guest data, PWA SW registration, audio gesture unlock
  useEffect(() => {
    const loadedPrefs = loadUserPreferences();
    setPreferences(loadedPrefs);
    soundEngine.configure({
      soundEnabled: loadedPrefs.soundEnabled,
      volume: loadedPrefs.volume,
      vibrationEnabled: loadedPrefs.vibrationEnabled,
    });
    document.documentElement.classList.toggle('dark', loadedPrefs.theme === 'dark');
    document.documentElement.classList.toggle('light', loadedPrefs.theme === 'light');

    setGuestState(loadGuestState());
    setIsOnline(navigator.onLine);

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsIosSafari(isIos && !isStandalone);

    const unlockAudio = () => {
      soundEngine.unlockFromUserGesture();
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
    window.addEventListener('keydown', unlockAudio, { once: true, passive: true });

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    fetchGameModes().then(setGameModes).catch(() => {});
    fetchAchievementsCatalog().then(setAchievementsCatalog).catch(() => {});

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  // Auth listener
  useEffect(() => {
    const sb = getSupabaseBrowserClient();
    if (!sb) {
      setAuthLoading(false);
      return;
    }

    refreshProfile();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(() => {
      refreshProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  // Flush queued offline matches when back online and signed in
  useEffect(() => {
    if (!isOnline || !user) return;
    const queued = consumeOfflineMatchQueue();
    if (queued.length === 0) return;

    (async () => {
      const sb = getSupabaseBrowserClient();
      for (const item of queued) {
        try {
          if (sb) {
            const { error } = await sb.rpc('pr_record_validated_game', {
              p_mode: item.mode,
              p_difficulty: item.difficulty,
              p_duration_bucket: item.durationBucket ?? null,
              p_grid_size: item.gridSize === 12 ? 12 : 9,
              p_correct_taps: Math.floor(item.correctTaps),
              p_wrong_taps: Math.floor(item.wrongTaps),
              p_missed_taps: Math.floor(item.missedTaps),
              p_avg_reaction_ms:
                item.avgReactionMs !== null ? Math.round(item.avgReactionMs) : null,
              p_best_reaction_ms:
                item.bestReactionMs !== null ? Math.round(item.bestReactionMs) : null,
              p_longest_streak: Math.floor(item.longestStreak),
              p_level_reached: Math.max(1, Math.floor(item.levelReached || 1)),
              p_survival_time_ms: Math.max(0, Math.floor(item.survivalTimeMs || 0)),
              p_play_time_ms: Math.max(500, Math.floor(item.playTimeMs)),
              p_time_remaining_ms: Math.max(0, Math.floor(item.timeRemainingMs || 0)),
              p_is_multiplayer_win: Boolean(item.isMultiplayerWin),
              p_reaction_samples: (item.reactionSamples || []).slice(0, 100),
              p_metadata: item.metadata ?? {},
            });
            if (error) throw error;
          }
        } catch {
          enqueueOfflineMatch(item);
        }
      }
      await refreshProfile();
      pushToast({
        kind: 'info',
        title: 'Offline Scores Synced',
        subtitle: `${queued.length} queued match(es) verified & uploaded.`,
      });
    })();
  }, [isOnline, user, refreshProfile, pushToast]);

  const signOut = useCallback(async () => {
    const sb = getSupabaseBrowserClient();
    if (sb) {
      await sb.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setCloudPersonalBests({});
  }, []);

  const triggerInstallPwa = useCallback(async (): Promise<
    'installed' | 'ios-guide' | 'unavailable'
  > => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        return 'installed';
      }
      return 'unavailable';
    }
    if (isIosSafari) {
      return 'ios-guide';
    }
    return 'unavailable';
  }, [deferredPrompt, isIosSafari]);

  const submitCompletedGame = useCallback(
    async (telemetry: GameTelemetryInput) => {
      // Always record locally first for instant responsiveness and offline safety
      const localResult = recordGuestGameLocally(telemetry, achievementsCatalog);
      setGuestState(localResult.updatedState);

      if (user && isOnline) {
        try {
          let srv: Record<string, unknown> | null = null;

          // Attempt Next.js server route first (fast timeout), falling back seamlessly to
          // Supabase's server-side PostgreSQL SECURITY DEFINER RPC `pr_record_validated_game`
          try {
            const controller = new AbortController();
            const timer = window.setTimeout(() => controller.abort(), 2200);
            const res = await fetch('/api/games/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(telemetry),
              signal: controller.signal,
            });
            window.clearTimeout(timer);
            if (res.ok) {
              const payload = await res.json();
              srv = payload.result;
            }
          } catch {
            // Fall through to direct Supabase PostgreSQL server-side validated RPC
          }

          if (!srv) {
            const sb = getSupabaseBrowserClient();
            if (sb) {
              const { data: rpcData, error: rpcErr } = await sb.rpc('pr_record_validated_game', {
                p_mode: telemetry.mode,
                p_difficulty: telemetry.difficulty,
                p_duration_bucket: telemetry.durationBucket ?? null,
                p_grid_size: telemetry.gridSize === 12 ? 12 : 9,
                p_correct_taps: Math.floor(telemetry.correctTaps),
                p_wrong_taps: Math.floor(telemetry.wrongTaps),
                p_missed_taps: Math.floor(telemetry.missedTaps),
                p_avg_reaction_ms:
                  telemetry.avgReactionMs !== null ? Math.round(telemetry.avgReactionMs) : null,
                p_best_reaction_ms:
                  telemetry.bestReactionMs !== null ? Math.round(telemetry.bestReactionMs) : null,
                p_longest_streak: Math.floor(telemetry.longestStreak),
                p_level_reached: Math.max(1, Math.floor(telemetry.levelReached || 1)),
                p_survival_time_ms: Math.max(0, Math.floor(telemetry.survivalTimeMs || 0)),
                p_play_time_ms: Math.max(500, Math.floor(telemetry.playTimeMs)),
                p_time_remaining_ms: Math.max(0, Math.floor(telemetry.timeRemainingMs || 0)),
                p_is_multiplayer_win: Boolean(telemetry.isMultiplayerWin),
                p_reaction_samples: (telemetry.reactionSamples || []).slice(0, 100),
                p_metadata: telemetry.metadata ?? {},
              });
              if (!rpcErr && rpcData) {
                srv = rpcData as Record<string, unknown>;
              }
            }
          }

          if (srv) {
            const unlockedList: Array<{
              title: string;
              description: string;
              xpReward: number;
            }> = Array.isArray(srv.unlockedAchievements) ? srv.unlockedAchievements : [];

            const completedList: Array<{ title: string; xpReward: number }> = Array.isArray(
              srv.completedChallenges
            )
              ? srv.completedChallenges
              : [];

            if (srv.isPersonalBest) {
              pushToast({
                kind: 'pb',
                title: 'NEW PERSONAL BEST!',
                subtitle: `${Number(srv.verifiedScore).toLocaleString()} pts in ${telemetry.mode.toUpperCase()}`,
              });
            }

            unlockedList.forEach((ach) => {
              soundEngine.play('achievement');
              pushToast({
                kind: 'achievement',
                title: `Achievement Unlocked: ${ach.title}`,
                subtitle: ach.description,
                xpBonus: ach.xpReward,
              });
            });

            completedList.forEach((ch) => {
              pushToast({
                kind: 'challenge',
                title: `Daily Challenge Complete!`,
                subtitle: ch.title,
                xpBonus: ch.xpReward,
              });
            });

            await refreshProfile();

            return {
              record: {
                ...localResult.record,
                id: String(srv.resultId || localResult.record.id),
                score: Number(srv.verifiedScore),
                scoreBreakdown:
                  (srv.scoreBreakdown as GameMatchRecord['scoreBreakdown']) ||
                  localResult.record.scoreBreakdown,
                accuracy: Number(srv.accuracy),
                xpAwarded: Number(srv.xpEarned || 0) + Number(srv.bonusXp || 0),
                isPersonalBest: Boolean(srv.isPersonalBest),
                verifiedServer: true,
              },
              isPersonalBest: Boolean(srv.isPersonalBest),
              xpEarned: Number(srv.xpEarned || 0),
              bonusXp: Number(srv.bonusXp || 0),
              unlockedAchievements: unlockedList,
              completedChallenges: completedList,
              savedToCloud: true,
            };
          }
        } catch {
          enqueueOfflineMatch(telemetry);
        }
      } else if (user && !isOnline) {
        enqueueOfflineMatch(telemetry);
      }

      // Guest or offline fallback notifications
      if (localResult.isPersonalBest) {
        pushToast({
          kind: 'pb',
          title: 'NEW LOCAL RECORD!',
          subtitle: `${localResult.record.score.toLocaleString()} pts in ${telemetry.mode.toUpperCase()}`,
        });
      }
      localResult.unlockedAchievements.forEach((ach) => {
        soundEngine.play('achievement');
        pushToast({
          kind: 'achievement',
          title: `Achievement Unlocked: ${ach.title}`,
          subtitle: ach.description,
          xpBonus: ach.xpReward,
        });
      });
      localResult.completedChallenges.forEach((ch) => {
        pushToast({
          kind: 'challenge',
          title: 'Daily Challenge Complete!',
          subtitle: ch.title,
          xpBonus: ch.xpReward,
        });
      });

      return {
        record: localResult.record,
        isPersonalBest: localResult.isPersonalBest,
        xpEarned: localResult.record.xpAwarded - localResult.bonusXp,
        bonusXp: localResult.bonusXp,
        unlockedAchievements: localResult.unlockedAchievements.map((a) => ({
          title: a.title,
          description: a.description,
          xpReward: a.xpReward,
        })),
        completedChallenges: localResult.completedChallenges.map((c) => ({
          title: c.title,
          xpReward: c.xpReward,
        })),
        savedToCloud: false,
      };
    },
    [user, isOnline, achievementsCatalog, pushToast, refreshProfile]
  );

  const personalBests = useMemo(() => {
    if (user) {
      return cloudPersonalBests;
    }
    return guestState.personalBests;
  }, [user, cloudPersonalBests, guestState.personalBests]);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      profile,
      authLoading,
      guestState,
      preferences,
      gameModes,
      achievementsCatalog,
      personalBests,
      isOnline,
      canInstallPwa: Boolean(deferredPrompt) || isIosSafari,
      isIosSafari,
      toasts,
      updatePreferences,
      refreshProfile,
      refreshGuestState,
      signOut,
      triggerInstallPwa,
      pushToast,
      dismissToast,
      submitCompletedGame,
    }),
    [
      user,
      profile,
      authLoading,
      guestState,
      preferences,
      gameModes,
      achievementsCatalog,
      personalBests,
      isOnline,
      deferredPrompt,
      isIosSafari,
      toasts,
      updatePreferences,
      refreshProfile,
      refreshGuestState,
      signOut,
      triggerInstallPwa,
      pushToast,
      dismissToast,
      submitCompletedGame,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProviders');
  }
  return ctx;
}
