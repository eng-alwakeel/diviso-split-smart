
-- ============================================
-- Group Invites for Known People (existing accounts)
-- ============================================

-- 1. Create group_invites table
CREATE TABLE public.group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'canceled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique: only one active pending invite per (group_id, invited_user_id)
CREATE UNIQUE INDEX idx_group_invites_unique_pending
  ON public.group_invites (group_id, invited_user_id)
  WHERE status = 'pending';

-- Indexes for common queries
CREATE INDEX idx_group_invites_invited_user ON public.group_invites (invited_user_id, status);
CREATE INDEX idx_group_invites_group ON public.group_invites (group_id, status);
CREATE INDEX idx_group_invites_invited_by ON public.group_invites (invited_by_user_id);

-- Enable RLS
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own invites"
  ON public.group_invites FOR SELECT
  USING (
    invited_user_id = auth.uid()
    OR invited_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_invites.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can create invites"
  ON public.group_invites FOR INSERT
  WITH CHECK (
    invited_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_invites.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can update relevant invites"
  ON public.group_invites FOR UPDATE
  USING (
    invited_user_id = auth.uid()
    OR invited_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_invites.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role IN ('owner', 'admin')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_group_invites_updated_at
  BEFORE UPDATE ON public.group_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. RPC: send_group_invite
-- ============================================
CREATE OR REPLACE FUNCTION public.send_group_invite(
  p_group_id uuid,
  p_invited_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id uuid;
  v_user_role text;
  v_existing_member boolean;
  v_invite_id uuid;
  v_group_name text;
  v_inviter_name text;
  v_notification_id uuid;
  v_today_count integer;
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT role INTO v_user_role
  FROM group_members
  WHERE group_id = p_group_id AND user_id = v_current_user_id;

  IF v_user_role IS NULL OR v_user_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('error', 'not_authorized');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_invited_user_id
  ) INTO v_existing_member;

  IF v_existing_member THEN
    RETURN jsonb_build_object('error', 'already_member');
  END IF;

  SELECT COUNT(*) INTO v_today_count
  FROM group_invites
  WHERE invited_by_user_id = v_current_user_id
    AND created_at >= (now() - interval '24 hours');

  IF v_today_count >= 10 THEN
    RETURN jsonb_build_object('error', 'rate_limited');
  END IF;

  IF EXISTS (
    SELECT 1 FROM group_invites
    WHERE group_id = p_group_id
      AND invited_user_id = p_invited_user_id
      AND status = 'pending'
  ) THEN
    RETURN jsonb_build_object('error', 'already_invited');
  END IF;

  SELECT name INTO v_group_name FROM groups WHERE id = p_group_id;
  SELECT COALESCE(display_name, name, 'مستخدم') INTO v_inviter_name
  FROM profiles WHERE id = v_current_user_id;

  INSERT INTO group_invites (group_id, invited_user_id, invited_by_user_id, status)
  VALUES (p_group_id, p_invited_user_id, v_current_user_id, 'pending')
  RETURNING id INTO v_invite_id;

  INSERT INTO notifications (user_id, type, payload)
  VALUES (
    p_invited_user_id,
    'group_invite_request',
    jsonb_build_object(
      'group_id', p_group_id,
      'group_name', v_group_name,
      'invite_id', v_invite_id,
      'inviter_name', v_inviter_name,
      'invited_by_user_id', v_current_user_id
    )
  )
  RETURNING id INTO v_notification_id;

  RETURN jsonb_build_object(
    'success', true,
    'invite_id', v_invite_id,
    'notification_id', v_notification_id
  );
END;
$$;

-- ============================================
-- 3. RPC: respond_group_invite (accept/decline)
-- ============================================
CREATE OR REPLACE FUNCTION public.respond_group_invite(
  p_invite_id uuid,
  p_response text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id uuid;
  v_invite record;
  v_group_name text;
  v_responder_name text;
  v_inviter_id uuid;
  v_admin_ids uuid[];
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  IF p_response NOT IN ('accept', 'decline') THEN
    RETURN jsonb_build_object('error', 'invalid_response');
  END IF;

  SELECT * INTO v_invite
  FROM group_invites
  WHERE id = p_invite_id AND status = 'pending';

  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('error', 'invite_not_found');
  END IF;

  IF v_invite.invited_user_id != v_current_user_id THEN
    RETURN jsonb_build_object('error', 'not_authorized');
  END IF;

  SELECT name INTO v_group_name FROM groups WHERE id = v_invite.group_id;
  SELECT COALESCE(display_name, name, 'مستخدم') INTO v_responder_name
  FROM profiles WHERE id = v_current_user_id;

  v_inviter_id := v_invite.invited_by_user_id;

  IF p_response = 'accept' THEN
    UPDATE group_invites
    SET status = 'accepted', responded_at = now(), updated_at = now()
    WHERE id = p_invite_id;

    INSERT INTO group_members (group_id, user_id, role)
    VALUES (v_invite.group_id, v_current_user_id, 'member')
    ON CONFLICT DO NOTHING;

    INSERT INTO notifications (user_id, type, payload)
    VALUES (
      v_inviter_id,
      'group_invite_accepted',
      jsonb_build_object(
        'group_id', v_invite.group_id,
        'group_name', v_group_name,
        'member_name', v_responder_name,
        'invite_id', p_invite_id
      )
    );

    SELECT array_agg(user_id) INTO v_admin_ids
    FROM group_members
    WHERE group_id = v_invite.group_id
      AND role IN ('owner', 'admin')
      AND user_id != v_inviter_id
      AND user_id != v_current_user_id;

    IF v_admin_ids IS NOT NULL AND array_length(v_admin_ids, 1) > 0 THEN
      INSERT INTO notifications (user_id, type, payload)
      SELECT
        unnest(v_admin_ids),
        'group_invite_accepted',
        jsonb_build_object(
          'group_id', v_invite.group_id,
          'group_name', v_group_name,
          'member_name', v_responder_name,
          'invite_id', p_invite_id
        );
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'accepted');

  ELSE
    UPDATE group_invites
    SET status = 'declined', responded_at = now(), updated_at = now()
    WHERE id = p_invite_id;

    INSERT INTO notifications (user_id, type, payload)
    VALUES (
      v_inviter_id,
      'group_invite_declined',
      jsonb_build_object(
        'group_id', v_invite.group_id,
        'group_name', v_group_name,
        'member_name', v_responder_name,
        'invite_id', p_invite_id
      )
    );

    SELECT array_agg(user_id) INTO v_admin_ids
    FROM group_members
    WHERE group_id = v_invite.group_id
      AND role IN ('owner', 'admin')
      AND user_id != v_inviter_id;

    IF v_admin_ids IS NOT NULL AND array_length(v_admin_ids, 1) > 0 THEN
      INSERT INTO notifications (user_id, type, payload)
      SELECT
        unnest(v_admin_ids),
        'group_invite_declined',
        jsonb_build_object(
          'group_id', v_invite.group_id,
          'group_name', v_group_name,
          'member_name', v_responder_name,
          'invite_id', p_invite_id
        );
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'declined');
  END IF;
END;
$$;

-- ============================================
-- 4. RPC: cancel_group_invite
-- ============================================
CREATE OR REPLACE FUNCTION public.cancel_group_invite(
  p_invite_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id uuid;
  v_invite record;
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT * INTO v_invite
  FROM group_invites
  WHERE id = p_invite_id AND status = 'pending';

  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('error', 'invite_not_found');
  END IF;

  IF v_invite.invited_by_user_id != v_current_user_id
    AND NOT EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = v_invite.group_id
        AND user_id = v_current_user_id
        AND role IN ('owner', 'admin')
    )
  THEN
    RETURN jsonb_build_object('error', 'not_authorized');
  END IF;

  UPDATE group_invites
  SET status = 'canceled', updated_at = now()
  WHERE id = p_invite_id;

  UPDATE notifications
  SET archived_at = now()
  WHERE user_id = v_invite.invited_user_id
    AND type = 'group_invite_request'
    AND (payload->>'invite_id')::text = p_invite_id::text
    AND archived_at IS NULL;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================
-- 5. RPC: get_pending_group_invites
-- ============================================
CREATE OR REPLACE FUNCTION public.get_pending_group_invites(
  p_group_id uuid
)
RETURNS TABLE (
  id uuid,
  invited_user_id uuid,
  invited_by_user_id uuid,
  status text,
  created_at timestamptz,
  invited_user_name text,
  invited_user_avatar text,
  invited_by_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    gi.id,
    gi.invited_user_id,
    gi.invited_by_user_id,
    gi.status,
    gi.created_at,
    COALESCE(invited_p.display_name, invited_p.name, 'مستخدم')::text AS invited_user_name,
    invited_p.avatar_url::text AS invited_user_avatar,
    COALESCE(inviter_p.display_name, inviter_p.name, 'مستخدم')::text AS invited_by_name
  FROM group_invites gi
  JOIN profiles invited_p ON invited_p.id = gi.invited_user_id
  JOIN profiles inviter_p ON inviter_p.id = gi.invited_by_user_id
  WHERE gi.group_id = p_group_id
    AND gi.status = 'pending'
  ORDER BY gi.created_at DESC;
END;
$$;
