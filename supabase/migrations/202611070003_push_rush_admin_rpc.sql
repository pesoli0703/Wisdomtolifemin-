-- =============================================================================
-- PUSH RUSH — Migration 0003: Admin Role-Protected User Directory & Moderation RPCs
-- =============================================================================

CREATE OR REPLACE FUNCTION public.pr_admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  username text,
  display_name text,
  role text,
  xp integer,
  level integer,
  level_title text,
  games_played integer,
  total_score bigint,
  best_reaction_ms integer,
  is_suspended boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_pr_admin() THEN
    RAISE EXCEPTION 'Forbidden: Administrator role required';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    p.username,
    p.display_name,
    p.role,
    p.xp,
    p.level,
    p.level_title,
    p.games_played,
    p.total_score,
    p.best_reaction_ms,
    p.is_suspended,
    p.created_at
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
  v_row public.pr_profiles;
BEGIN
  IF NOT public.is_pr_admin() THEN
    RAISE EXCEPTION 'Forbidden: Administrator role required';
  END IF;

  IF p_user_id = auth.uid() AND (p_is_suspended = true OR p_role = 'player') THEN
    RAISE EXCEPTION 'Cannot suspend or demote your own administrator account';
  END IF;

  PERFORM set_config('app.pr_trusted_rpc', 'true', true);

  UPDATE public.pr_profiles
  SET
    is_suspended = COALESCE(p_is_suspended, is_suspended),
    role = CASE WHEN p_role IN ('player', 'admin') THEN p_role ELSE role END,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.pr_admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pr_admin_update_user(uuid, boolean, text) TO authenticated;
