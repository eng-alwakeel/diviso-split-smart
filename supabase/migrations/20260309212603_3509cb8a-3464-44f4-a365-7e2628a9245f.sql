CREATE OR REPLACE FUNCTION public.increment_completed_activities()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status = 'active') THEN
    INSERT INTO public.user_reputation (user_id, completed_activities, updated_at)
    SELECT gm.user_id, 1, now()
    FROM public.group_members gm
    WHERE gm.group_id = NEW.id AND gm.user_id IS NOT NULL
    ON CONFLICT (user_id) DO UPDATE SET
      completed_activities = public.user_reputation.completed_activities + 1,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;