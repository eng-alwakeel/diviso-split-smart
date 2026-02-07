
-- ============================================
-- Known Contacts: Table + RLS + Trigger + RPCs
-- ============================================

-- 1. Create known_contacts table
CREATE TABLE public.known_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_groups_count integer NOT NULL DEFAULT 0,
  last_interaction_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT known_contacts_unique UNIQUE (user_id, contact_user_id),
  CONSTRAINT known_contacts_no_self CHECK (user_id <> contact_user_id)
);

-- Index for fast lookups
CREATE INDEX idx_known_contacts_user_id ON public.known_contacts(user_id);
CREATE INDEX idx_known_contacts_last_interaction ON public.known_contacts(user_id, last_interaction_at DESC);

-- 2. Enable RLS
ALTER TABLE public.known_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own known contacts"
  ON public.known_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own known contacts"
  ON public.known_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Trigger function: update known_contacts when a member joins a group
CREATE OR REPLACE FUNCTION public.update_known_contacts_on_member_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_member RECORD;
  shared_count integer;
BEGIN
  -- For each existing member in the group (excluding the new member)
  FOR existing_member IN
    SELECT user_id FROM public.group_members
    WHERE group_id = NEW.group_id AND user_id <> NEW.user_id
  LOOP
    -- Calculate shared groups count between new member and existing member
    SELECT count(DISTINCT gm1.group_id) INTO shared_count
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = NEW.user_id AND gm2.user_id = existing_member.user_id;

    -- Direction 1: new_member -> existing_member
    INSERT INTO public.known_contacts (user_id, contact_user_id, shared_groups_count, last_interaction_at)
    VALUES (NEW.user_id, existing_member.user_id, shared_count, now())
    ON CONFLICT (user_id, contact_user_id)
    DO UPDATE SET
      shared_groups_count = EXCLUDED.shared_groups_count,
      last_interaction_at = now(),
      updated_at = now();

    -- Direction 2: existing_member -> new_member
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
$$;

-- 4. Attach trigger
CREATE TRIGGER trg_update_known_contacts_on_member_join
  AFTER INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_known_contacts_on_member_join();

-- 5. RPC: get_known_contacts
CREATE OR REPLACE FUNCTION public.get_known_contacts(p_exclude_user_ids uuid[] DEFAULT '{}')
RETURNS TABLE (
  id uuid,
  contact_user_id uuid,
  shared_groups_count integer,
  last_interaction_at timestamptz,
  display_name text,
  name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    kc.id,
    kc.contact_user_id,
    kc.shared_groups_count,
    kc.last_interaction_at,
    p.display_name,
    p.name,
    p.avatar_url
  FROM public.known_contacts kc
  JOIN public.profiles p ON p.id = kc.contact_user_id
  WHERE kc.user_id = auth.uid()
    AND kc.contact_user_id <> ALL(p_exclude_user_ids)
  ORDER BY kc.last_interaction_at DESC, kc.shared_groups_count DESC;
$$;

-- 6. RPC: add_member_to_group
CREATE OR REPLACE FUNCTION public.add_member_to_group(p_group_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_group_status text;
  v_already_member boolean;
  v_group_name text;
  v_caller_name text;
BEGIN
  -- Check caller is owner or admin
  SELECT gm.role INTO v_caller_role
  FROM public.group_members gm
  WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid();

  IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin') THEN
    RETURN 'error:not_authorized';
  END IF;

  -- Check group status
  SELECT g.status, g.name INTO v_group_status, v_group_name
  FROM public.groups g
  WHERE g.id = p_group_id;

  IF v_group_status = 'closed' THEN
    RETURN 'error:group_closed';
  END IF;

  -- Check if already a member
  SELECT EXISTS(
    SELECT 1 FROM public.group_members WHERE group_id = p_group_id AND user_id = p_user_id
  ) INTO v_already_member;

  IF v_already_member THEN
    RETURN 'error:already_member';
  END IF;

  -- Add member
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (p_group_id, p_user_id, 'member');

  -- Get caller name for notification
  SELECT COALESCE(p.display_name, p.name, 'مستخدم') INTO v_caller_name
  FROM public.profiles p WHERE p.id = auth.uid();

  -- Send notification to added user
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    p_user_id,
    'group_invite',
    'تمت إضافتك لمجموعة',
    'أضافك ' || v_caller_name || ' إلى مجموعة "' || v_group_name || '"',
    jsonb_build_object('group_id', p_group_id, 'group_name', v_group_name, 'added_by', auth.uid())
  );

  RETURN 'added';
END;
$$;

-- 7. Backfill: populate known_contacts from existing group_members
INSERT INTO public.known_contacts (user_id, contact_user_id, shared_groups_count, last_interaction_at)
SELECT
  gm1.user_id,
  gm2.user_id,
  count(DISTINCT gm1.group_id),
  max(GREATEST(COALESCE(gm1.joined_at, now()), COALESCE(gm2.joined_at, now())))
FROM public.group_members gm1
JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id AND gm1.user_id <> gm2.user_id
GROUP BY gm1.user_id, gm2.user_id
ON CONFLICT (user_id, contact_user_id) DO UPDATE SET
  shared_groups_count = EXCLUDED.shared_groups_count,
  last_interaction_at = EXCLUDED.last_interaction_at,
  updated_at = now();
