
-- Fix triggers that crash when user_id is NULL (pending members via phone invite)

-- 1. Fix trg_log_member_joined_event
CREATE OR REPLACE FUNCTION public.trg_log_member_joined_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_member_name text;
  v_msg_ar text;
  v_msg_en text;
BEGIN
  -- Skip for pending members (no user_id yet)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, name, 'عضو جديد') INTO v_member_name
  FROM profiles WHERE id = NEW.user_id;

  v_msg_ar := v_member_name || ' انضم للمجموعة 🎉';
  v_msg_en := v_member_name || ' joined the group 🎉';

  INSERT INTO group_activity_feed (group_id, event_type, actor_user_id, event_data, smart_message_ar, smart_message_en)
  VALUES (
    NEW.group_id,
    'member_joined',
    NEW.user_id,
    jsonb_build_object('member_name', v_member_name, 'role', NEW.role),
    v_msg_ar,
    v_msg_en
  );

  RETURN NEW;
END;
$function$;

-- 2. Fix update_known_contacts_on_member_join
CREATE OR REPLACE FUNCTION public.update_known_contacts_on_member_join()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_member RECORD;
  shared_count integer;
BEGIN
  -- Skip for pending members (no user_id yet)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  FOR existing_member IN
    SELECT user_id FROM public.group_members
    WHERE group_id = NEW.group_id AND user_id IS NOT NULL AND user_id <> NEW.user_id
  LOOP
    SELECT count(DISTINCT gm1.group_id) INTO shared_count
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = NEW.user_id AND gm2.user_id = existing_member.user_id;

    INSERT INTO public.known_contacts (user_id, contact_user_id, shared_groups_count, last_interaction_at)
    VALUES (NEW.user_id, existing_member.user_id, shared_count, now())
    ON CONFLICT (user_id, contact_user_id)
    DO UPDATE SET
      shared_groups_count = EXCLUDED.shared_groups_count,
      last_interaction_at = now(),
      updated_at = now();

    INSERT INTO public.known_contacts (user_id, contact_user_id, shared_groups_count, last_interaction_at)
    VALUES (existing_member.user_id, NEW.user_id, shared_count, now())
    ON CONFLICT (user_id, contact_user_id)
    DO UPDATE SET
      shared_groups_count = EXCLUDED.shared_groups_count,
      last_interaction_at = now(),
      updated_at = now();
  END LOOP;

  RETURN NEW;
END;
$function$;

-- 3. Fix update_invite_task_on_member_join
CREATE OR REPLACE FUNCTION public.update_invite_task_on_member_join()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Skip for pending members (no user_id yet)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT owner_id INTO v_owner_id 
  FROM public.groups 
  WHERE id = NEW.group_id;
  
  IF v_owner_id IS NOT NULL AND NEW.user_id != v_owner_id THEN
    UPDATE public.onboarding_tasks 
    SET first_invite_sent = true,
        tasks_completed = CASE 
          WHEN first_invite_sent = false THEN tasks_completed + 1 
          ELSE tasks_completed 
        END,
        updated_at = now()
    WHERE user_id = v_owner_id AND first_invite_sent = false;
  END IF;
  
  RETURN NEW;
END;
$function$;

NOTIFY pgrst, 'reload schema';
