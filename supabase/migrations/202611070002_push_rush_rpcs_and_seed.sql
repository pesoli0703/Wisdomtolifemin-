-- ============================================================================
-- PUSH RUSH — Migration 0002: Server Validation RPCs, Leaderboards & Seed Data
-- ============================================================================

CREATE OR REPLACE FUNCTION public.pr_ensure_profile(p_preferred_username text DEFAULT NULL)
RETURNS public.pr_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_meta jsonb;
  v_raw text;
  v_clean text;
  v_final text;
  v_profile public.pr_profiles;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_profile FROM public.pr_profiles WHERE id = v_uid;
  IF FOUND THEN
    RETURN v_profile;
  END IF;

  SELECT email, raw_user_meta_data INTO v_email, v_meta FROM auth.users WHERE id = v_uid;

  v_raw := coalesce(
    nullif(trim(p_preferred_username), ''),
    nullif(trim(v_meta ->> 'pr_username'), ''),
    nullif(trim(v_meta ->> 'username'), ''),
    split_part(coalesce(v_email, 'player'), '@', 1)
  );
  v_clean := regexp_replace(v_raw, '[^A-Za-z0-9_-]', '', 'g');
  IF length(v_clean) < 3 THEN
    v_clean := 'player_' || substr(replace(v_uid::text, '-', ''), 1, 6);
  END IF;
  v_clean := substr(v_clean, 1, 18);

  IF EXISTS (SELECT 1 FROM public.pr_profiles WHERE lower(username) = lower(v_clean)) THEN
    v_final := v_clean || '_' || substr(replace(v_uid::text, '-', ''), 1, 5);
  ELSE
    v_final := v_clean;
  END IF;

  INSERT INTO public.pr_profiles (id, username, display_name)
  VALUES (
    v_uid,
    v_final,
    coalesce(nullif(trim(v_meta ->> 'display_name'), ''), v_final)
  )
  ON CONFLICT (id) DO UPDATE SET updated_at = now()
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.pr_compute_level(p_xp integer)
RETURNS TABLE(lvl integer, title text, floor_xp integer, next_xp integer)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_xp integer := greatest(coalesce(p_xp, 0), 0);
  v_extra_levels integer;
BEGIN
  IF v_xp < 250 THEN
    RETURN QUERY SELECT 1, 'Beginner'::text, 0, 250;
  ELSIF v_xp < 700 THEN
    RETURN QUERY SELECT 2, 'Rookie'::text, 250, 700;
  ELSIF v_xp < 1500 THEN
    RETURN QUERY SELECT 3, 'Fast Hands'::text, 700, 1500;
  ELSIF v_xp < 3000 THEN
    RETURN QUERY SELECT 4, 'Speed Master'::text, 1500, 3000;
  ELSIF v_xp < 5500 THEN
    RETURN QUERY SELECT 5, 'Reflex Expert'::text, 3000, 5500;
  ELSIF v_xp < 9000 THEN
    RETURN QUERY SELECT 6, 'Lightning Legend'::text, 5500, 9000;
  ELSE
    v_extra_levels := (v_xp - 9000) / 4500;
    RETURN QUERY SELECT
      7 + v_extra_levels,
      'PUSH RUSH Champion'::text,
      9000 + (v_extra_levels * 4500),
      9000 + ((v_extra_levels + 1) * 4500);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.pr_ensure_daily_challenges(p_date date DEFAULT (now() AT TIME ZONE 'UTC')::date)
RETURNS SETOF public.pr_daily_challenges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seed integer;
  v_mode_1 text;
  v_title_1 text;
  v_desc_1 text;
  v_target_1 integer;
  v_slot2_variant integer;
  v_slot3_variant integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.pr_daily_challenges WHERE challenge_date = p_date) THEN
    v_seed := extract(doy FROM p_date)::integer + (extract(year FROM p_date)::integer * 7);

    CASE (v_seed % 4)
      WHEN 0 THEN
        v_mode_1 := 'classic';
        v_target_1 := 2200;
        v_title_1 := 'Classic Speed Blitz';
        v_desc_1 := 'Score at least 2,200 points in a single Classic Speed match.';
      WHEN 1 THEN
        v_mode_1 := 'target';
        v_target_1 := 2000;
        v_title_1 := 'Precision Target Hunter';
        v_desc_1 := 'Score at least 2,000 points in Target Rush without falling for decoys.';
      WHEN 2 THEN
        v_mode_1 := 'colour';
        v_target_1 := 1800;
        v_title_1 := 'Chromatic Reflex Run';
        v_desc_1 := 'Score at least 1,800 points in Colour Rush under shifting rules.';
      ELSE
        v_mode_1 := 'numbers';
        v_target_1 := 2000;
        v_title_1 := 'Numeric Sequence Sprint';
        v_desc_1 := 'Score at least 2,000 points in Number Rush.';
    END CASE;

    INSERT INTO public.pr_daily_challenges (challenge_date, slot, title, description, mode, metric, target_value, xp_reward)
    VALUES (p_date, 1, v_title_1, v_desc_1, v_mode_1, 'score', v_target_1, 175)
    ON CONFLICT (challenge_date, slot) DO NOTHING;

    v_slot2_variant := (v_seed % 3);
    IF v_slot2_variant = 0 THEN
      INSERT INTO public.pr_daily_challenges (challenge_date, slot, title, description, mode, metric, target_value, xp_reward)
      VALUES (p_date, 2, 'Memory Matrix 8', 'Reach Level 8 or higher in Memory Rush.', 'memory', 'memory_level', 8, 200)
      ON CONFLICT (challenge_date, slot) DO NOTHING;
    ELSIF v_slot2_variant = 1 THEN
      INSERT INTO public.pr_daily_challenges (challenge_date, slot, title, description, mode, metric, target_value, xp_reward)
      VALUES (p_date, 2, '60-Second Survivor', 'Survive for at least 60 seconds in Survival Mode.', 'survival', 'survival_seconds', 60, 200)
      ON CONFLICT (challenge_date, slot) DO NOTHING;
    ELSE
      INSERT INTO public.pr_daily_challenges (challenge_date, slot, title, description, mode, metric, target_value, xp_reward)
      VALUES (p_date, 2, 'Endurance Streak 25', 'Hit a 25-tap unbroken streak in Endurance Challenge.', 'endurance', 'streak', 25, 200)
      ON CONFLICT (challenge_date, slot) DO NOTHING;
    END IF;

    v_slot3_variant := ((v_seed + 1) % 2);
    IF v_slot3_variant = 0 THEN
      INSERT INTO public.pr_daily_challenges (challenge_date, slot, title, description, mode, metric, target_value, xp_reward)
      VALUES (p_date, 3, 'Laser Accuracy 95%', 'Finish any match with at least 95% accuracy (min 10 correct taps).', NULL, 'accuracy', 95, 150)
      ON CONFLICT (challenge_date, slot) DO NOTHING;
    ELSE
      INSERT INTO public.pr_daily_challenges (challenge_date, slot, title, description, mode, metric, target_value, xp_reward)
      VALUES (p_date, 3, 'Daily Warmup Trio', 'Complete 3 matches across any PUSH RUSH game modes today.', NULL, 'games_count', 3, 150)
      ON CONFLICT (challenge_date, slot) DO NOTHING;
    END IF;
  END IF;

  RETURN QUERY
  SELECT * FROM public.pr_daily_challenges
  WHERE challenge_date = p_date
  ORDER BY slot ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.pr_record_validated_game(
  p_mode text,
  p_difficulty text,
  p_duration_bucket integer,
  p_grid_size integer,
  p_correct_taps integer,
  p_wrong_taps integer,
  p_missed_taps integer,
  p_avg_reaction_ms integer,
  p_best_reaction_ms integer,
  p_longest_streak integer,
  p_level_reached integer,
  p_survival_time_ms integer,
  p_play_time_ms integer,
  p_time_remaining_ms integer DEFAULT 0,
  p_is_multiplayer_win boolean DEFAULT false,
  p_reaction_samples jsonb DEFAULT '[]'::jsonb,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.pr_profiles;
  v_mode_cfg public.pr_game_modes;
  v_score_cfg public.pr_scoring_config;
  v_total_attempts integer;
  v_accuracy numeric(5,2);
  v_diff_mult numeric(6,2);
  v_base_score integer := 0;
  v_speed_bonus integer := 0;
  v_streak_bonus integer := 0;
  v_accuracy_bonus integer := 0;
  v_level_bonus integer := 0;
  v_time_bonus integer := 0;
  v_penalty_points integer := 0;
  v_raw_subtotal numeric;
  v_verified_score integer := 0;
  v_breakdown jsonb;
  v_prev_best integer;
  v_is_pb boolean := false;
  v_xp_base integer := 0;
  v_xp_bonus integer := 0;
  v_result_id uuid;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_new_daily_streak integer;
  v_lvl record;
  v_ach record;
  v_unlocked jsonb := '[]'::jsonb;
  v_chal record;
  v_chal_prog integer;
  v_chal_done boolean;
  v_completed_chals jsonb := '[]'::jsonb;
  v_daily_top_user uuid;
  v_daily_completed_count integer;
  v_clean_avg_ms integer;
  v_clean_best_ms integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to record official scores';
  END IF;

  v_profile := public.pr_ensure_profile(NULL);

  IF v_profile.is_suspended THEN
    RAISE EXCEPTION 'Account is suspended from submitting official scores';
  END IF;

  SELECT * INTO v_mode_cfg FROM public.pr_game_modes WHERE slug = p_mode;
  IF NOT FOUND OR NOT v_mode_cfg.is_enabled THEN
    RAISE EXCEPTION 'Selected game mode is invalid or currently disabled';
  END IF;

  IF p_difficulty NOT IN ('beginner', 'intermediate', 'advanced', 'expert') THEN
    RAISE EXCEPTION 'Invalid difficulty level';
  END IF;

  SELECT * INTO v_score_cfg FROM public.pr_scoring_config WHERE id = 1;

  IF p_correct_taps < 0 OR p_wrong_taps < 0 OR p_missed_taps < 0 OR p_play_time_ms < 500 THEN
    RAISE EXCEPTION 'Invalid game telemetry values';
  END IF;

  IF p_correct_taps > greatest(20, ceil((p_play_time_ms / 1000.0) * 14.0)::integer) THEN
    RAISE EXCEPTION 'Tap rate exceeds human anti-cheat threshold';
  END IF;

  IF p_longest_streak < 0 OR p_longest_streak > p_correct_taps THEN
    p_longest_streak := least(greatest(p_longest_streak, 0), p_correct_taps);
  END IF;

  IF p_correct_taps > 0 AND p_best_reaction_ms IS NOT NULL THEN
    IF p_best_reaction_ms < v_score_cfg.min_valid_reaction_ms THEN
      RAISE EXCEPTION 'Reaction time below human physiological minimum (% ms)', v_score_cfg.min_valid_reaction_ms;
    END IF;
    v_clean_best_ms := least(p_best_reaction_ms, 10000);
    v_clean_avg_ms := greatest(v_clean_best_ms, least(coalesce(p_avg_reaction_ms, v_clean_best_ms), 10000));
  ELSE
    v_clean_best_ms := NULL;
    v_clean_avg_ms := NULL;
  END IF;

  v_total_attempts := p_correct_taps + p_wrong_taps + p_missed_taps;
  IF v_total_attempts > 0 THEN
    v_accuracy := round((p_correct_taps::numeric * 100.0) / v_total_attempts::numeric, 2);
  ELSE
    v_accuracy := 0;
  END IF;

  v_diff_mult := coalesce((v_score_cfg.difficulty_multipliers ->> p_difficulty)::numeric, 1.0);

  IF p_correct_taps > 0 THEN
    v_base_score := p_correct_taps * v_mode_cfg.base_points;
    IF v_clean_avg_ms IS NOT NULL AND v_clean_avg_ms < v_score_cfg.reaction_target_ms THEN
      v_speed_bonus := round(
        p_correct_taps * v_mode_cfg.speed_bonus_max *
        least(1.0, (v_score_cfg.reaction_target_ms - v_clean_avg_ms)::numeric / greatest(1, v_score_cfg.reaction_target_ms - 150)::numeric)
      )::integer;
    END IF;
    v_streak_bonus := least(
      (p_longest_streak / greatest(1, v_score_cfg.streak_interval)) * v_mode_cfg.streak_bonus_step * greatest(1, p_longest_streak / 2),
      p_correct_taps * 60
    );
    IF v_accuracy >= v_score_cfg.accuracy_bonus_threshold AND p_correct_taps >= 5 THEN
      v_accuracy_bonus := round(v_score_cfg.accuracy_bonus_points * (v_accuracy / 100.0))::integer;
    END IF;
    v_level_bonus := greatest(0, p_level_reached - 1) * 75;
    v_time_bonus := least(600, greatest(0, coalesce(p_time_remaining_ms, 0) / 100));
  END IF;

  v_penalty_points := (p_wrong_taps * v_mode_cfg.wrong_penalty) + (p_missed_taps * (v_mode_cfg.wrong_penalty / 2));

  IF p_correct_taps = 0 THEN
    v_verified_score := 0;
  ELSE
    v_raw_subtotal := greatest(0, (v_base_score + v_speed_bonus + v_streak_bonus + v_accuracy_bonus + v_level_bonus + v_time_bonus) - v_penalty_points);
    v_verified_score := round(v_raw_subtotal * v_diff_mult)::integer;
  END IF;

  v_breakdown := jsonb_build_object(
    'basePoints', v_base_score,
    'speedBonus', v_speed_bonus,
    'streakBonus', v_streak_bonus,
    'accuracyBonus', v_accuracy_bonus,
    'levelBonus', v_level_bonus,
    'timeBonus', v_time_bonus,
    'penalties', v_penalty_points,
    'difficultyMultiplier', v_diff_mult,
    'finalScore', v_verified_score
  );

  SELECT max(score) INTO v_prev_best
  FROM public.pr_game_results
  WHERE user_id = v_uid AND mode = p_mode AND is_revoked = false;

  IF v_verified_score > coalesce(v_prev_best, 0) AND v_verified_score > 0 THEN
    v_is_pb := true;
  END IF;

  IF p_correct_taps > 0 THEN
    v_xp_base := v_score_cfg.xp_per_game_base + least(350, (v_verified_score / greatest(1, v_score_cfg.xp_score_divisor)));
  ELSE
    v_xp_base := 10;
  END IF;

  INSERT INTO public.pr_game_results (
    user_id, mode, difficulty, duration_bucket, grid_size,
    score, score_breakdown, correct_taps, wrong_taps, missed_taps,
    accuracy, avg_reaction_ms, best_reaction_ms, longest_streak,
    level_reached, survival_time_ms, play_time_ms, xp_awarded,
    is_multiplayer_win, reaction_samples, metadata
  ) VALUES (
    v_uid, p_mode, p_difficulty, p_duration_bucket, coalesce(p_grid_size, 9),
    v_verified_score, v_breakdown, p_correct_taps, p_wrong_taps, p_missed_taps,
    v_accuracy, v_clean_avg_ms, v_clean_best_ms, p_longest_streak,
    greatest(1, coalesce(p_level_reached, 1)), greatest(0, coalesce(p_survival_time_ms, 0)),
    p_play_time_ms, v_xp_base, coalesce(p_is_multiplayer_win, false),
    coalesce(p_reaction_samples, '[]'::jsonb), coalesce(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_result_id;

  IF v_profile.last_played_date = v_today THEN
    v_new_daily_streak := greatest(1, v_profile.daily_streak);
  ELSIF v_profile.last_played_date = (v_today - 1) THEN
    v_new_daily_streak := v_profile.daily_streak + 1;
  ELSE
    v_new_daily_streak := 1;
  END IF;

  PERFORM set_config('app.pr_trusted_rpc', 'true', true);

  UPDATE public.pr_profiles
  SET
    games_played = games_played + 1,
    total_score = total_score + v_verified_score,
    total_play_time_ms = total_play_time_ms + p_play_time_ms,
    best_reaction_ms = CASE
      WHEN v_clean_best_ms IS NULL THEN best_reaction_ms
      WHEN best_reaction_ms IS NULL THEN v_clean_best_ms
      ELSE least(best_reaction_ms, v_clean_best_ms)
    END,
    longest_streak = greatest(longest_streak, p_longest_streak),
    multiplayer_wins = multiplayer_wins + (CASE WHEN p_mode = 'multiplayer' AND p_is_multiplayer_win THEN 1 ELSE 0 END),
    daily_streak = v_new_daily_streak,
    last_played_date = v_today
  WHERE id = v_uid
  RETURNING * INTO v_profile;

  PERFORM public.pr_ensure_daily_challenges(v_today);

  FOR v_chal IN
    SELECT * FROM public.pr_daily_challenges WHERE challenge_date = v_today ORDER BY slot ASC
  LOOP
    IF v_chal.mode IS NULL OR v_chal.mode = p_mode THEN
      SELECT progress_value, is_completed INTO v_chal_prog, v_chal_done
      FROM public.pr_user_daily_challenges
      WHERE user_id = v_uid AND challenge_id = v_chal.id;

      IF NOT FOUND THEN
        v_chal_prog := 0;
        v_chal_done := false;
      END IF;

      IF NOT v_chal_done THEN
        CASE v_chal.metric
          WHEN 'score' THEN v_chal_prog := greatest(v_chal_prog, v_verified_score);
          WHEN 'memory_level' THEN IF p_mode = 'memory' THEN v_chal_prog := greatest(v_chal_prog, p_level_reached); END IF;
          WHEN 'survival_seconds' THEN IF p_mode = 'survival' THEN v_chal_prog := greatest(v_chal_prog, (p_survival_time_ms / 1000)); END IF;
          WHEN 'accuracy' THEN IF p_correct_taps >= 10 THEN v_chal_prog := greatest(v_chal_prog, floor(v_accuracy)::integer); END IF;
          WHEN 'games_count' THEN v_chal_prog := v_chal_prog + 1;
          WHEN 'streak' THEN v_chal_prog := greatest(v_chal_prog, p_longest_streak);
          WHEN 'fast_reaction_ms' THEN IF v_clean_best_ms IS NOT NULL AND v_clean_best_ms <= v_chal.target_value THEN v_chal_prog := v_chal.target_value; END IF;
          ELSE NULL;
        END CASE;

        IF v_chal_prog >= v_chal.target_value THEN
          v_chal_done := true;
          v_xp_bonus := v_xp_bonus + v_chal.xp_reward;
          v_completed_chals := v_completed_chals || jsonb_build_array(jsonb_build_object(
            'id', v_chal.id, 'title', v_chal.title, 'xpReward', v_chal.xp_reward
          ));
        END IF;

        INSERT INTO public.pr_user_daily_challenges (user_id, challenge_id, progress_value, is_completed, completed_at, updated_at)
        VALUES (v_uid, v_chal.id, v_chal_prog, v_chal_done, CASE WHEN v_chal_done THEN now() ELSE NULL END, now())
        ON CONFLICT (user_id, challenge_id) DO UPDATE SET
          progress_value = EXCLUDED.progress_value,
          is_completed = EXCLUDED.is_completed,
          completed_at = coalesce(public.pr_user_daily_challenges.completed_at, EXCLUDED.completed_at),
          updated_at = now();
      END IF;
    END IF;
  END LOOP;

  SELECT gr.user_id INTO v_daily_top_user
  FROM public.pr_game_results gr
  JOIN public.pr_profiles pr ON pr.id = gr.user_id
  WHERE gr.is_revoked = false AND pr.is_suspended = false
    AND gr.created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')
  GROUP BY gr.user_id
  ORDER BY sum(gr.score) DESC, min(gr.best_reaction_ms) ASC NULLS LAST
  LIMIT 1;

  SELECT count(*) INTO v_daily_completed_count
  FROM public.pr_user_daily_challenges
  WHERE user_id = v_uid AND is_completed = true;

  FOR v_ach IN
    SELECT a.* FROM public.pr_achievements a
    WHERE NOT EXISTS (SELECT 1 FROM public.pr_user_achievements ua WHERE ua.user_id = v_uid AND ua.achievement_slug = a.slug)
    ORDER BY a.sort_order ASC
  LOOP
    IF (
      (v_ach.metric = 'games_played' AND v_profile.games_played >= v_ach.target_value)
      OR (v_ach.metric = 'single_score' AND v_verified_score >= v_ach.target_value)
      OR (v_ach.metric = 'best_reaction_ms' AND v_clean_best_ms IS NOT NULL AND v_clean_best_ms <= v_ach.target_value AND p_correct_taps >= 5)
      OR (v_ach.metric = 'perfect_accuracy' AND v_accuracy = 100.00 AND p_correct_taps >= v_ach.target_value)
      OR (v_ach.metric = 'memory_level' AND p_mode = 'memory' AND p_level_reached >= v_ach.target_value)
      OR (v_ach.metric = 'survival_seconds' AND p_mode = 'survival' AND (p_survival_time_ms / 1000) >= v_ach.target_value)
      OR (v_ach.metric = 'multiplayer_wins' AND v_profile.multiplayer_wins >= v_ach.target_value)
      OR (v_ach.metric = 'daily_rank_1' AND v_daily_top_user = v_uid AND v_verified_score > 0)
      OR (v_ach.metric = 'daily_completed' AND v_daily_completed_count >= v_ach.target_value)
      OR (v_ach.metric = 'longest_streak' AND v_profile.longest_streak >= v_ach.target_value)
      OR (v_ach.metric = 'target_score' AND p_mode = 'target' AND v_verified_score >= v_ach.target_value)
      OR (v_ach.metric = 'colour_score' AND p_mode = 'colour' AND v_verified_score >= v_ach.target_value)
      OR (v_ach.metric = 'numbers_score' AND p_mode = 'numbers' AND v_verified_score >= v_ach.target_value)
      OR (v_ach.metric = 'endurance_streak' AND p_mode = 'endurance' AND p_longest_streak >= v_ach.target_value)
      OR (v_ach.metric = 'total_xp' AND (v_profile.xp + v_xp_base + v_xp_bonus) >= v_ach.target_value)
    ) THEN
      INSERT INTO public.pr_user_achievements (user_id, achievement_slug, game_result_id)
      VALUES (v_uid, v_ach.slug, v_result_id)
      ON CONFLICT (user_id, achievement_slug) DO NOTHING;

      v_xp_bonus := v_xp_bonus + v_ach.xp_reward;
      v_unlocked := v_unlocked || jsonb_build_array(jsonb_build_object(
        'slug', v_ach.slug, 'title', v_ach.title, 'description', v_ach.description,
        'icon', v_ach.icon, 'badgeColor', v_ach.badge_color, 'xpReward', v_ach.xp_reward
      ));
    END IF;
  END LOOP;

  SELECT * INTO v_lvl FROM public.pr_compute_level(v_profile.xp + v_xp_base + v_xp_bonus);

  UPDATE public.pr_profiles
  SET xp = v_profile.xp + v_xp_base + v_xp_bonus, level = v_lvl.lvl, level_title = v_lvl.title
  WHERE id = v_uid
  RETURNING * INTO v_profile;

  UPDATE public.pr_game_results SET xp_awarded = v_xp_base + v_xp_bonus WHERE id = v_result_id;

  RETURN jsonb_build_object(
    'resultId', v_result_id,
    'verifiedScore', v_verified_score,
    'scoreBreakdown', v_breakdown,
    'accuracy', v_accuracy,
    'xpEarned', v_xp_base,
    'bonusXp', v_xp_bonus,
    'totalXp', v_profile.xp,
    'level', v_profile.level,
    'levelTitle', v_profile.level_title,
    'nextLevelXp', v_lvl.next_xp,
    'floorLevelXp', v_lvl.floor_xp,
    'isPersonalBest', v_is_pb,
    'unlockedAchievements', v_unlocked,
    'completedChallenges', v_completed_chals
  );
END;
$$;

INSERT INTO public.pr_scoring_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pr_platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pr_game_modes (slug, name, tagline, description, is_enabled, is_featured, pro_only, base_points, wrong_penalty, speed_bonus_max, streak_bonus_step, sort_order)
VALUES
  ('classic', 'Classic Speed Mode', 'Pure Reflex Fury', 'Tap randomly illuminating neon pads across 9 or 12 targets in 30s, 60s, or 90s sprints as tempo accelerates.', true, true, false, 100, 45, 85, 18, 1),
  ('memory', 'Memory Rush', 'Neural Sequence Matrix', 'Memorize and replay progressively longer illuminated pad sequences with rising speed and precision.', true, true, false, 140, 60, 60, 22, 2),
  ('survival', 'Survival Mode', 'Three Lives. Zero Mercy.', 'React before each shrinking light window expires. Every mistake costs a life—how long can you survive?', true, true, false, 115, 50, 90, 20, 3),
  ('target', 'Target Rush', 'Filter the Chaos', 'Multiple pads ignite simultaneously with colors and symbols. Strike only the assigned target and ignore decoys.', true, true, false, 125, 55, 80, 20, 4),
  ('colour', 'Colour Rush', 'Cognitive Rule Shifter', 'Follow live-shifting chromatic rules—including Stroop ink-vs-word traps—as speed intensifies.', true, false, false, 130, 55, 85, 20, 5),
  ('numbers', 'Number Rush', 'Rapid Numerical Order', 'Clear randomized numbered pads in ascending or descending order against a ticking round clock.', true, false, false, 120, 50, 75, 18, 6),
  ('multiplayer', 'Multiplayer Battle', '1v1 Same-Device Arena', 'Go head-to-head with a friend in split-screen simultaneous duel or alternating turn showdowns.', true, true, false, 105, 45, 85, 18, 7),
  ('endurance', 'Endurance Challenge', 'Unbroken Stamina Test', 'Continuous high-velocity reaction marathon with a strict mistake budget. Chase your longest streak.', true, false, false, 110, 50, 85, 25, 8)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pr_achievements (slug, title, description, category, icon, badge_color, metric, target_value, xp_reward, sort_order)
VALUES
  ('first_game', 'First Game', 'Complete your very first official PUSH RUSH match.', 'milestone', 'Rocket', 'cyan', 'games_played', 1, 75, 1),
  ('speed_starter', 'Speed Starter', 'Reach a score of 1,500 or higher in a single game.', 'milestone', 'Zap', 'blue', 'single_score', 1500, 100, 2),
  ('high_voltage', 'High Voltage Scorer', 'Reach an electrifying 4,500+ points in one match.', 'milestone', 'Flame', 'orange', 'single_score', 4500, 250, 3),
  ('lightning_hands', 'Lightning Hands', 'Record a verified tap reaction time of 220ms or faster.', 'speed', 'Bolt', 'amber', 'best_reaction_ms', 220, 225, 4),
  ('quantum_reflex', 'Quantum Reflex', 'Achieve an elite reaction time of 165ms or faster.', 'speed', 'Sparkles', 'purple', 'best_reaction_ms', 165, 350, 5),
  ('perfect_accuracy', 'Perfect Accuracy', 'Finish a match with 100% accuracy and at least 15 correct taps.', 'accuracy', 'Target', 'emerald', 'perfect_accuracy', 15, 200, 6),
  ('unstoppable_streak', 'Unstoppable Streak', 'Chain 30 consecutive correct taps without a single miss.', 'accuracy', 'Activity', 'cyan', 'longest_streak', 30, 200, 7),
  ('memory_champion', 'Memory Champion', 'Complete Level 10 or higher in Memory Rush.', 'mode', 'Brain', 'purple', 'memory_level', 10, 250, 8),
  ('survival_expert', 'Survival Expert', 'Survive for at least 60 seconds in Survival Mode.', 'mode', 'HeartPulse', 'emerald', 'survival_seconds', 60, 250, 9),
  ('sharpshooter', 'Target Sharpshooter', 'Score 2,500+ points in Target Rush.', 'mode', 'Crosshair', 'blue', 'target_score', 2500, 175, 10),
  ('chroma_master', 'Chroma Master', 'Score 2,500+ points in Colour Rush.', 'mode', 'Palette', 'orange', 'colour_score', 2500, 175, 11),
  ('number_wizard', 'Number Wizard', 'Score 2,500+ points in Number Rush.', 'mode', 'Hash', 'cyan', 'numbers_score', 2500, 175, 12),
  ('iron_reflexes', 'Iron Reflexes', 'Reach a 40-tap streak in Endurance Challenge.', 'mode', 'Shield', 'amber', 'endurance_streak', 40, 250, 13),
  ('winning_streak', 'Winning Streak', 'Win 3 Multiplayer Battle matches.', 'social', 'Swords', 'orange', 'multiplayer_wins', 3, 200, 14),
  ('daily_challenger', 'Daily Challenger', 'Complete 3 Daily Challenges.', 'daily', 'CalendarCheck', 'emerald', 'daily_completed', 3, 200, 15),
  ('daily_champion', 'Daily Champion', 'Claim the #1 spot on the global Daily Leaderboard.', 'daily', 'Crown', 'amber', 'daily_rank_1', 1, 400, 16)
ON CONFLICT (slug) DO NOTHING;

SELECT count(*) FROM public.pr_ensure_daily_challenges();

CREATE OR REPLACE FUNCTION public.pr_get_leaderboard(
  p_period text DEFAULT 'all_time',
  p_mode text DEFAULT 'all',
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  country text,
  level integer,
  level_title text,
  total_score bigint,
  best_score integer,
  best_reaction_ms integer,
  avg_accuracy numeric,
  games_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since timestamptz;
  v_cap integer := least(greatest(coalesce(p_limit, 50), 1), 100);
BEGIN
  CASE p_period
    WHEN 'daily' THEN v_since := date_trunc('day', now() AT TIME ZONE 'UTC');
    WHEN 'weekly' THEN v_since := (now() AT TIME ZONE 'UTC') - interval '7 days';
    WHEN 'monthly' THEN v_since := date_trunc('month', now() AT TIME ZONE 'UTC');
    ELSE v_since := '1970-01-01'::timestamptz;
  END CASE;

  RETURN QUERY
  WITH filtered AS (
    SELECT
      gr.user_id,
      sum(gr.score)::bigint AS sum_score,
      max(gr.score)::integer AS max_score,
      min(gr.best_reaction_ms)::integer AS min_reaction,
      round(avg(gr.accuracy), 1) AS mean_accuracy,
      count(*)::bigint AS matches
    FROM public.pr_game_results gr
    JOIN public.pr_profiles p ON p.id = gr.user_id
    WHERE gr.is_revoked = false
      AND p.is_suspended = false
      AND gr.score > 0
      AND gr.created_at >= v_since
      AND (p_mode IS NULL OR p_mode = 'all' OR gr.mode = p_mode)
    GROUP BY gr.user_id
  )
  SELECT
    row_number() OVER (
      ORDER BY
        CASE WHEN p_mode IS NULL OR p_mode = 'all' THEN f.sum_score ELSE f.max_score::bigint END DESC,
        f.max_score DESC,
        f.min_reaction ASC NULLS LAST
    ) AS rank,
    p.id AS user_id,
    p.username,
    coalesce(p.display_name, p.username) AS display_name,
    p.avatar_url,
    p.country,
    p.level,
    p.level_title,
    f.sum_score AS total_score,
    f.max_score AS best_score,
    f.min_reaction AS best_reaction_ms,
    f.mean_accuracy AS avg_accuracy,
    f.matches AS games_count
  FROM filtered f
  JOIN public.pr_profiles p ON p.id = f.user_id
  ORDER BY rank ASC
  LIMIT v_cap;
END;
$$;

CREATE OR REPLACE FUNCTION public.pr_get_platform_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_players bigint;
  v_games bigint;
  v_games_today bigint;
  v_fastest_ms integer;
  v_avg_ms integer;
BEGIN
  SELECT count(*) INTO v_players FROM public.pr_profiles WHERE is_suspended = false;
  SELECT count(*), min(best_reaction_ms), round(avg(avg_reaction_ms))::integer
    INTO v_games, v_fastest_ms, v_avg_ms
    FROM public.pr_game_results WHERE is_revoked = false;
  SELECT count(*) INTO v_games_today
    FROM public.pr_game_results
    WHERE is_revoked = false AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');

  RETURN jsonb_build_object(
    'registeredPlayers', coalesce(v_players, 0),
    'totalGamesPlayed', coalesce(v_games, 0),
    'gamesToday', coalesce(v_games_today, 0),
    'fastestReactionMs', v_fastest_ms,
    'avgReactionMs', v_avg_ms
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.pr_admin_list_users()
RETURNS TABLE(
  id uuid,
  email text,
  username text,
  display_name text,
  role text,
  membership_tier text,
  xp integer,
  level integer,
  level_title text,
  games_played integer,
  total_score bigint,
  best_reaction_ms integer,
  is_suspended boolean,
  created_at timestamptz,
  last_played_date date
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_pr_admin() THEN
    RAISE EXCEPTION 'Administrator privileges required';
  END IF;

  RETURN QUERY
  SELECT
    p.id, u.email::text, p.username, p.display_name, p.role, p.membership_tier,
    p.xp, p.level, p.level_title, p.games_played, p.total_score, p.best_reaction_ms,
    p.is_suspended, p.created_at, p.last_played_date
  FROM public.pr_profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC
  LIMIT 250;
END;
$$;

CREATE OR REPLACE FUNCTION public.pr_admin_update_user(
  p_user_id uuid,
  p_is_suspended boolean DEFAULT NULL,
  p_role text DEFAULT NULL
)
RETURNS public.pr_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated public.pr_profiles;
BEGIN
  IF NOT public.is_pr_admin() THEN
    RAISE EXCEPTION 'Administrator privileges required';
  END IF;

  IF p_role IS NOT NULL AND p_role NOT IN ('player', 'admin') THEN
    RAISE EXCEPTION 'Invalid role specified';
  END IF;

  IF p_user_id = auth.uid() AND (p_is_suspended = true OR p_role = 'player') THEN
    RAISE EXCEPTION 'You cannot suspend or demote your own active admin account';
  END IF;

  PERFORM set_config('app.pr_trusted_rpc', 'true', true);

  UPDATE public.pr_profiles
  SET
    is_suspended = coalesce(p_is_suspended, is_suspended),
    role = coalesce(p_role, role),
    updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player profile not found';
  END IF;

  RETURN v_updated;
END;
$$;
