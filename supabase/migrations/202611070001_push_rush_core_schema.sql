-- ============================================================================
-- PUSH RUSH — Migration 0001: Core Schema, Storage, Triggers & RLS Policies
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pr_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  display_name text,
  avatar_url text,
  bio text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  favorite_mode text NOT NULL DEFAULT 'classic',
  role text NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  membership_tier text NOT NULL DEFAULT 'free' CHECK (membership_tier IN ('free', 'pro')),
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  level_title text NOT NULL DEFAULT 'Beginner',
  games_played integer NOT NULL DEFAULT 0 CHECK (games_played >= 0),
  total_score bigint NOT NULL DEFAULT 0 CHECK (total_score >= 0),
  total_play_time_ms bigint NOT NULL DEFAULT 0 CHECK (total_play_time_ms >= 0),
  best_reaction_ms integer CHECK (best_reaction_ms IS NULL OR best_reaction_ms >= 50),
  longest_streak integer NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  multiplayer_wins integer NOT NULL DEFAULT 0 CHECK (multiplayer_wins >= 0),
  daily_streak integer NOT NULL DEFAULT 0 CHECK (daily_streak >= 0),
  last_played_date date,
  is_suspended boolean NOT NULL DEFAULT false,
  settings_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pr_profiles_username_lower_idx ON public.pr_profiles (lower(username));
CREATE INDEX IF NOT EXISTS pr_profiles_xp_idx ON public.pr_profiles (xp DESC);
CREATE INDEX IF NOT EXISTS pr_profiles_total_score_idx ON public.pr_profiles (total_score DESC);

CREATE TABLE IF NOT EXISTS public.pr_game_modes (
  slug text PRIMARY KEY,
  name text NOT NULL,
  tagline text NOT NULL,
  description text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  pro_only boolean NOT NULL DEFAULT false,
  base_points integer NOT NULL DEFAULT 100 CHECK (base_points >= 0),
  wrong_penalty integer NOT NULL DEFAULT 40 CHECK (wrong_penalty >= 0),
  speed_bonus_max integer NOT NULL DEFAULT 80 CHECK (speed_bonus_max >= 0),
  streak_bonus_step integer NOT NULL DEFAULT 15 CHECK (streak_bonus_step >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pr_scoring_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  reaction_target_ms integer NOT NULL DEFAULT 650,
  min_valid_reaction_ms integer NOT NULL DEFAULT 80,
  streak_interval integer NOT NULL DEFAULT 5,
  accuracy_bonus_threshold numeric(5,2) NOT NULL DEFAULT 90.00,
  accuracy_bonus_points integer NOT NULL DEFAULT 250,
  difficulty_multipliers jsonb NOT NULL DEFAULT '{"beginner": 1.0, "intermediate": 1.25, "advanced": 1.5, "expert": 2.0}'::jsonb,
  xp_per_game_base integer NOT NULL DEFAULT 35,
  xp_score_divisor integer NOT NULL DEFAULT 25,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pr_game_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.pr_profiles(id) ON DELETE CASCADE,
  mode text NOT NULL REFERENCES public.pr_game_modes(slug),
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  duration_bucket integer,
  grid_size integer NOT NULL DEFAULT 9,
  score integer NOT NULL CHECK (score >= 0),
  score_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  correct_taps integer NOT NULL DEFAULT 0 CHECK (correct_taps >= 0),
  wrong_taps integer NOT NULL DEFAULT 0 CHECK (wrong_taps >= 0),
  missed_taps integer NOT NULL DEFAULT 0 CHECK (missed_taps >= 0),
  accuracy numeric(5,2) NOT NULL DEFAULT 0 CHECK (accuracy >= 0 AND accuracy <= 100),
  avg_reaction_ms integer CHECK (avg_reaction_ms IS NULL OR avg_reaction_ms >= 50),
  best_reaction_ms integer CHECK (best_reaction_ms IS NULL OR best_reaction_ms >= 50),
  longest_streak integer NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  level_reached integer NOT NULL DEFAULT 1 CHECK (level_reached >= 1),
  survival_time_ms integer NOT NULL DEFAULT 0 CHECK (survival_time_ms >= 0),
  play_time_ms integer NOT NULL DEFAULT 0 CHECK (play_time_ms >= 0),
  xp_awarded integer NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
  is_multiplayer_win boolean NOT NULL DEFAULT false,
  is_revoked boolean NOT NULL DEFAULT false,
  reaction_samples jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pr_game_results_created_idx ON public.pr_game_results (created_at DESC);
CREATE INDEX IF NOT EXISTS pr_game_results_mode_score_idx ON public.pr_game_results (mode, score DESC) WHERE is_revoked = false;
CREATE INDEX IF NOT EXISTS pr_game_results_user_created_idx ON public.pr_game_results (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pr_game_results_user_mode_score_idx ON public.pr_game_results (user_id, mode, score DESC) WHERE is_revoked = false;

CREATE TABLE IF NOT EXISTS public.pr_achievements (
  slug text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('milestone', 'speed', 'accuracy', 'mode', 'social', 'daily')),
  icon text NOT NULL,
  badge_color text NOT NULL DEFAULT 'cyan',
  metric text NOT NULL,
  target_value integer NOT NULL,
  xp_reward integer NOT NULL DEFAULT 100,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.pr_user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.pr_profiles(id) ON DELETE CASCADE,
  achievement_slug text NOT NULL REFERENCES public.pr_achievements(slug) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  game_result_id uuid REFERENCES public.pr_game_results(id) ON DELETE SET NULL,
  UNIQUE (user_id, achievement_slug)
);

CREATE INDEX IF NOT EXISTS pr_user_achievements_user_idx ON public.pr_user_achievements (user_id, unlocked_at DESC);

CREATE TABLE IF NOT EXISTS public.pr_daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date date NOT NULL,
  slot integer NOT NULL DEFAULT 1 CHECK (slot BETWEEN 1 AND 5),
  title text NOT NULL,
  description text NOT NULL,
  mode text REFERENCES public.pr_game_modes(slug),
  metric text NOT NULL CHECK (metric IN ('score', 'memory_level', 'survival_seconds', 'accuracy', 'games_count', 'streak', 'fast_reaction_ms')),
  target_value integer NOT NULL CHECK (target_value > 0),
  xp_reward integer NOT NULL DEFAULT 150 CHECK (xp_reward >= 0),
  created_by uuid REFERENCES public.pr_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_date, slot)
);

CREATE INDEX IF NOT EXISTS pr_daily_challenges_date_idx ON public.pr_daily_challenges (challenge_date DESC, slot ASC);

CREATE TABLE IF NOT EXISTS public.pr_user_daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.pr_profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.pr_daily_challenges(id) ON DELETE CASCADE,
  progress_value integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS pr_user_daily_challenges_user_idx ON public.pr_user_daily_challenges (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.pr_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  badge text NOT NULL DEFAULT 'LIVE',
  variant text NOT NULL DEFAULT 'electric' CHECK (variant IN ('electric', 'emerald', 'amber', 'purple')),
  cta_label text,
  cta_href text,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_by uuid REFERENCES public.pr_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pr_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.pr_profiles(id) ON DELETE SET NULL,
  reported_user_id uuid NOT NULL REFERENCES public.pr_profiles(id) ON DELETE CASCADE,
  game_result_id uuid REFERENCES public.pr_game_results(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  admin_notes text NOT NULL DEFAULT '',
  resolved_by uuid REFERENCES public.pr_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pr_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.pr_profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  category text NOT NULL CHECK (category IN ('general', 'bug', 'account', 'leaderboard', 'partnership', 'feedback')),
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pr_platform_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  payments_enabled boolean NOT NULL DEFAULT false,
  tournaments_preview_enabled boolean NOT NULL DEFAULT true,
  pro_membership_preview_enabled boolean NOT NULL DEFAULT true,
  maintenance_mode boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pr-avatars',
  'pr-avatars',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_pr_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pr_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_suspended = false
  );
$$;

CREATE OR REPLACE FUNCTION public.pr_guard_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.pr_trusted_rpc', true) = 'true'
     OR current_setting('request.jwt.claim.role', true) = 'service_role'
     OR public.is_pr_admin() THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.membership_tier IS DISTINCT FROM OLD.membership_tier
     OR NEW.xp IS DISTINCT FROM OLD.xp
     OR NEW.level IS DISTINCT FROM OLD.level
     OR NEW.level_title IS DISTINCT FROM OLD.level_title
     OR NEW.games_played IS DISTINCT FROM OLD.games_played
     OR NEW.total_score IS DISTINCT FROM OLD.total_score
     OR NEW.total_play_time_ms IS DISTINCT FROM OLD.total_play_time_ms
     OR NEW.best_reaction_ms IS DISTINCT FROM OLD.best_reaction_ms
     OR NEW.longest_streak IS DISTINCT FROM OLD.longest_streak
     OR NEW.multiplayer_wins IS DISTINCT FROM OLD.multiplayer_wins
     OR NEW.daily_streak IS DISTINCT FROM OLD.daily_streak
     OR NEW.last_played_date IS DISTINCT FROM OLD.last_played_date
     OR NEW.is_suspended IS DISTINCT FROM OLD.is_suspended THEN
    RAISE EXCEPTION 'Unauthorized modification of protected player progression or role fields';
  END IF;

  IF length(trim(NEW.username)) < 3 OR length(trim(NEW.username)) > 24 OR NEW.username !~ '^[A-Za-z0-9_-]+$' THEN
    RAISE EXCEPTION 'Username must be 3-24 characters using letters, numbers, underscores, or hyphens';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pr_guard_profile_updates_trg ON public.pr_profiles;
CREATE TRIGGER pr_guard_profile_updates_trg
BEFORE UPDATE ON public.pr_profiles
FOR EACH ROW
EXECUTE FUNCTION public.pr_guard_profile_updates();

CREATE OR REPLACE FUNCTION public.pr_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw_username text;
  v_clean_username text;
  v_final_username text;
BEGIN
  v_raw_username := coalesce(
    nullif(trim(NEW.raw_user_meta_data ->> 'pr_username'), ''),
    nullif(trim(NEW.raw_user_meta_data ->> 'username'), ''),
    split_part(coalesce(NEW.email, 'player'), '@', 1)
  );
  v_clean_username := regexp_replace(v_raw_username, '[^A-Za-z0-9_-]', '', 'g');
  IF length(v_clean_username) < 3 THEN
    v_clean_username := 'player_' || substr(replace(NEW.id::text, '-', ''), 1, 6);
  END IF;
  v_clean_username := substr(v_clean_username, 1, 18);

  IF EXISTS (SELECT 1 FROM public.pr_profiles WHERE lower(username) = lower(v_clean_username)) THEN
    v_final_username := v_clean_username || '_' || substr(replace(NEW.id::text, '-', ''), 1, 5);
  ELSE
    v_final_username := v_clean_username;
  END IF;

  INSERT INTO public.pr_profiles (id, username, display_name)
  VALUES (
    NEW.id,
    v_final_username,
    coalesce(nullif(trim(NEW.raw_user_meta_data ->> 'display_name'), ''), v_final_username)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pr_on_auth_user_created ON auth.users;
CREATE TRIGGER pr_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.pr_handle_new_user();

ALTER TABLE public.pr_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_game_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_scoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_user_daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pr_profiles_select_public" ON public.pr_profiles FOR SELECT USING (true);
CREATE POLICY "pr_profiles_update_own_or_admin" ON public.pr_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_pr_admin())
  WITH CHECK (auth.uid() = id OR public.is_pr_admin());

CREATE POLICY "pr_game_modes_select_all" ON public.pr_game_modes FOR SELECT USING (true);
CREATE POLICY "pr_game_modes_admin_write" ON public.pr_game_modes FOR ALL TO authenticated
  USING (public.is_pr_admin()) WITH CHECK (public.is_pr_admin());

CREATE POLICY "pr_scoring_config_select_all" ON public.pr_scoring_config FOR SELECT USING (true);
CREATE POLICY "pr_scoring_config_admin_write" ON public.pr_scoring_config FOR ALL TO authenticated
  USING (public.is_pr_admin()) WITH CHECK (public.is_pr_admin());

CREATE POLICY "pr_game_results_select_public" ON public.pr_game_results FOR SELECT
  USING (is_revoked = false OR auth.uid() = user_id OR public.is_pr_admin());
CREATE POLICY "pr_game_results_admin_update" ON public.pr_game_results FOR UPDATE TO authenticated
  USING (public.is_pr_admin()) WITH CHECK (public.is_pr_admin());

CREATE POLICY "pr_achievements_select_all" ON public.pr_achievements FOR SELECT USING (true);
CREATE POLICY "pr_achievements_admin_write" ON public.pr_achievements FOR ALL TO authenticated
  USING (public.is_pr_admin()) WITH CHECK (public.is_pr_admin());

CREATE POLICY "pr_user_achievements_select_all" ON public.pr_user_achievements FOR SELECT USING (true);

CREATE POLICY "pr_daily_challenges_select_all" ON public.pr_daily_challenges FOR SELECT USING (true);
CREATE POLICY "pr_daily_challenges_admin_write" ON public.pr_daily_challenges FOR ALL TO authenticated
  USING (public.is_pr_admin()) WITH CHECK (public.is_pr_admin());

CREATE POLICY "pr_user_daily_challenges_select_own_or_admin" ON public.pr_user_daily_challenges FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_pr_admin());

CREATE POLICY "pr_announcements_select_active_or_admin" ON public.pr_announcements FOR SELECT
  USING ((is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now())) OR public.is_pr_admin());
CREATE POLICY "pr_announcements_admin_write" ON public.pr_announcements FOR ALL TO authenticated
  USING (public.is_pr_admin()) WITH CHECK (public.is_pr_admin());

CREATE POLICY "pr_reports_insert_authenticated" ON public.pr_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id AND reporter_id <> reported_user_id);
CREATE POLICY "pr_reports_select_own_or_admin" ON public.pr_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.is_pr_admin());
CREATE POLICY "pr_reports_admin_update" ON public.pr_reports FOR UPDATE TO authenticated
  USING (public.is_pr_admin()) WITH CHECK (public.is_pr_admin());

CREATE POLICY "pr_support_tickets_insert_any" ON public.pr_support_tickets FOR INSERT
  WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND length(trim(name)) >= 2 AND length(trim(email)) >= 5 AND length(trim(subject)) >= 3 AND length(trim(message)) >= 10);
CREATE POLICY "pr_support_tickets_select_own_or_admin" ON public.pr_support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_pr_admin());
CREATE POLICY "pr_support_tickets_admin_update" ON public.pr_support_tickets FOR UPDATE TO authenticated
  USING (public.is_pr_admin()) WITH CHECK (public.is_pr_admin());

CREATE POLICY "pr_platform_settings_select_all" ON public.pr_platform_settings FOR SELECT USING (true);
CREATE POLICY "pr_platform_settings_admin_write" ON public.pr_platform_settings FOR ALL TO authenticated
  USING (public.is_pr_admin()) WITH CHECK (public.is_pr_admin());

DROP POLICY IF EXISTS "pr_avatars_public_read" ON storage.objects;
CREATE POLICY "pr_avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'pr-avatars');
DROP POLICY IF EXISTS "pr_avatars_owner_insert" ON storage.objects;
CREATE POLICY "pr_avatars_owner_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pr-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "pr_avatars_owner_update" ON storage.objects;
CREATE POLICY "pr_avatars_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'pr-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "pr_avatars_owner_delete" ON storage.objects;
CREATE POLICY "pr_avatars_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'pr-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
