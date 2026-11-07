-- =============================================================================
-- PUSH RUSH — Migration 0004: Server-Protected Admin Email Allowlist & Promotion
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pr_admin_emails (
  email text PRIMARY KEY CHECK (email = lower(trim(email))),
  note text NOT NULL DEFAULT 'Authorized PUSH RUSH Administrator',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pr_admin_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pr_admin_emails_admin_all" ON public.pr_admin_emails;
CREATE POLICY "pr_admin_emails_admin_all"
  ON public.pr_admin_emails
  FOR ALL
  TO authenticated
  USING (public.is_pr_admin())
  WITH CHECK (public.is_pr_admin());

INSERT INTO public.pr_admin_emails (email, note)
VALUES ('akindelepeace11@gmail.com', 'Primary Platform Administrator')
ON CONFLICT (email) DO NOTHING;

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
  v_assigned_role text := 'player';
BEGIN
  IF NEW.email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.pr_admin_emails WHERE email = lower(trim(NEW.email))
  ) THEN
    v_assigned_role := 'admin';
  END IF;

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

  PERFORM set_config('app.pr_trusted_rpc', 'true', true);

  INSERT INTO public.pr_profiles (id, username, display_name, role)
  VALUES (
    NEW.id,
    v_final_username,
    coalesce(
      nullif(trim(NEW.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
      v_final_username
    ),
    v_assigned_role
  )
  ON CONFLICT (id) DO UPDATE
    SET role = CASE WHEN EXCLUDED.role = 'admin' THEN 'admin' ELSE public.pr_profiles.role END,
        updated_at = now();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

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
  v_is_designated_admin boolean := false;
  v_raw text;
  v_clean text;
  v_final text;
  v_profile public.pr_profiles;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email, raw_user_meta_data INTO v_email, v_meta FROM auth.users WHERE id = v_uid;

  IF v_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.pr_admin_emails WHERE email = lower(trim(v_email))
  ) THEN
    v_is_designated_admin := true;
  END IF;

  SELECT * INTO v_profile FROM public.pr_profiles WHERE id = v_uid;
  IF FOUND THEN
    IF v_is_designated_admin AND v_profile.role <> 'admin' THEN
      PERFORM set_config('app.pr_trusted_rpc', 'true', true);
      UPDATE public.pr_profiles
      SET role = 'admin', updated_at = now()
      WHERE id = v_uid
      RETURNING * INTO v_profile;
    END IF;
    RETURN v_profile;
  END IF;

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

  PERFORM set_config('app.pr_trusted_rpc', 'true', true);

  INSERT INTO public.pr_profiles (id, username, display_name, role)
  VALUES (
    v_uid,
    v_final,
    coalesce(
      nullif(trim(v_meta ->> 'display_name'), ''),
      nullif(trim(v_meta ->> 'full_name'), ''),
      v_final
    ),
    CASE WHEN v_is_designated_admin THEN 'admin' ELSE 'player' END
  )
  ON CONFLICT (id) DO UPDATE
    SET role = CASE WHEN v_is_designated_admin THEN 'admin' ELSE public.pr_profiles.role END,
        updated_at = now()
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

DO $$
DECLARE
  r record;
  v_uname text;
BEGIN
  PERFORM set_config('app.pr_trusted_rpc', 'true', true);

  FOR r IN
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    JOIN public.pr_admin_emails ae ON ae.email = lower(trim(u.email))
  LOOP
    v_uname := regexp_replace(split_part(r.email, '@', 1), '[^A-Za-z0-9_-]', '', 'g');
    IF length(v_uname) < 3 THEN
      v_uname := 'admin_' || substr(replace(r.id::text, '-', ''), 1, 6);
    END IF;
    v_uname := substr(v_uname, 1, 18);

    IF EXISTS (SELECT 1 FROM public.pr_profiles WHERE lower(username) = lower(v_uname) AND id <> r.id) THEN
      v_uname := v_uname || '_' || substr(replace(r.id::text, '-', ''), 1, 4);
    END IF;

    INSERT INTO public.pr_profiles (id, username, display_name, role)
    VALUES (
      r.id,
      v_uname,
      coalesce(
        nullif(trim(r.raw_user_meta_data ->> 'display_name'), ''),
        nullif(trim(r.raw_user_meta_data ->> 'full_name'), ''),
        v_uname
      ),
      'admin'
    )
    ON CONFLICT (id) DO UPDATE
      SET role = 'admin',
          is_suspended = false,
          updated_at = now();
  END LOOP;
END;
$$;
