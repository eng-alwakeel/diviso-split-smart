
-- Phase 1: Member statuses hardening

-- 1) Add member_status enum-like columns to group_members
ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 2) Add constraints
-- Status must be valid
ALTER TABLE public.group_members
  ADD CONSTRAINT group_members_status_check 
  CHECK (status IN ('active', 'invited', 'pending', 'rejected'));

-- Pending members have no user_id; active/invited must have user_id
-- NOTE: existing rows all have user_id, so we only enforce for new inserts via trigger
-- (Can't add CHECK that references nullable user_id with existing data easily)

-- Unique phone per group (prevent duplicate invites by phone)
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_group_phone 
  ON public.group_members (group_id, phone_e164) 
  WHERE phone_e164 IS NOT NULL AND archived_at IS NULL;

-- 3) Add share_status to expense_splits
ALTER TABLE public.expense_splits
  ADD COLUMN IF NOT EXISTS share_status text NOT NULL DEFAULT 'active';

ALTER TABLE public.expense_splits
  ADD CONSTRAINT expense_splits_share_status_check 
  CHECK (share_status IN ('active', 'rebalanced_out', 'void'));

-- 4) Add needs_attention to expenses
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS needs_attention boolean NOT NULL DEFAULT false;

-- 5) Prevent phone_e164 change after first share (trigger)
CREATE OR REPLACE FUNCTION public.prevent_phone_change_after_share()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.phone_e164 IS NOT NULL 
     AND NEW.phone_e164 IS DISTINCT FROM OLD.phone_e164 THEN
    -- Check if member has any expense splits
    IF EXISTS (
      SELECT 1 FROM public.expense_splits 
      WHERE member_id = OLD.user_id 
        AND share_status = 'active'
    ) THEN
      RAISE EXCEPTION 'Cannot change phone after member has active expense shares';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_phone_change ON public.group_members;
CREATE TRIGGER trg_prevent_phone_change
  BEFORE UPDATE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_phone_change_after_share();

-- 6) Rebalance function (server-side authoritative)
CREATE OR REPLACE FUNCTION public.rebalance_shares_for_member(
  p_group_id uuid,
  p_member_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expense RECORD;
  v_removed_amount numeric;
  v_eligible_count int;
  v_base_add numeric;
  v_remainder numeric;
  v_counter int;
  v_share RECORD;
BEGIN
  -- For each expense where this member has an active share
  FOR v_expense IN
    SELECT DISTINCT es.expense_id, es.share_amount, es.member_id as split_member_id
    FROM expense_splits es
    JOIN expenses e ON e.id = es.expense_id
    WHERE e.group_id = p_group_id
      AND es.member_id = p_member_user_id
      AND es.share_status = 'active'
  LOOP
    v_removed_amount := v_expense.share_amount;
    
    -- Mark removed member's share
    UPDATE expense_splits 
    SET share_status = 'rebalanced_out'
    WHERE expense_id = v_expense.expense_id 
      AND member_id = p_member_user_id 
      AND share_status = 'active';

    -- Count eligible remaining shares
    SELECT COUNT(*) INTO v_eligible_count
    FROM expense_splits es
    JOIN group_members gm ON gm.user_id = es.member_id AND gm.group_id = p_group_id
    WHERE es.expense_id = v_expense.expense_id
      AND es.share_status = 'active'
      AND gm.archived_at IS NULL
      AND gm.status NOT IN ('rejected');

    IF v_eligible_count = 0 THEN
      -- No eligible members left - mark expense as needs_attention
      UPDATE expenses SET needs_attention = true WHERE id = v_expense.expense_id;
      -- Void the share instead
      UPDATE expense_splits 
      SET share_status = 'void'
      WHERE expense_id = v_expense.expense_id 
        AND member_id = p_member_user_id 
        AND share_status = 'rebalanced_out';
    ELSE
      -- Distribute: use cents-level integer math (multiply by 100)
      v_base_add := FLOOR((v_removed_amount * 100) / v_eligible_count) / 100.0;
      v_remainder := v_removed_amount - (v_base_add * v_eligible_count);
      v_counter := 0;

      FOR v_share IN
        SELECT es.expense_id, es.member_id
        FROM expense_splits es
        JOIN group_members gm ON gm.user_id = es.member_id AND gm.group_id = p_group_id
        WHERE es.expense_id = v_expense.expense_id
          AND es.share_status = 'active'
          AND gm.archived_at IS NULL
          AND gm.status NOT IN ('rejected')
        ORDER BY es.member_id  -- deterministic
      LOOP
        v_counter := v_counter + 1;
        IF v_counter <= ROUND(v_remainder * 100) THEN
          UPDATE expense_splits 
          SET share_amount = share_amount + v_base_add + 0.01
          WHERE expense_id = v_share.expense_id 
            AND member_id = v_share.member_id 
            AND share_status = 'active';
        ELSE
          UPDATE expense_splits 
          SET share_amount = share_amount + v_base_add
          WHERE expense_id = v_share.expense_id 
            AND member_id = v_share.member_id 
            AND share_status = 'active';
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- 7) Insert activity on invite rejection
CREATE OR REPLACE FUNCTION public.reject_group_invite(
  p_group_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
  v_display_name text;
BEGIN
  -- Validate: must be invited member
  SELECT id INTO v_member_id
  FROM group_members
  WHERE group_id = p_group_id 
    AND user_id = p_user_id 
    AND status = 'invited'
    AND archived_at IS NULL;

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'No pending invite found for this user in this group';
  END IF;

  -- Get display name
  SELECT COALESCE(display_name, name, 'مستخدم') INTO v_display_name
  FROM profiles WHERE id = p_user_id;

  -- Update member status
  UPDATE group_members 
  SET status = 'rejected', archived_at = now()
  WHERE id = v_member_id;

  -- Rebalance all their shares
  PERFORM rebalance_shares_for_member(p_group_id, p_user_id);

  -- Log activity
  INSERT INTO group_activity_feed (group_id, actor_user_id, event_type, event_data, smart_message_ar, smart_message_en)
  VALUES (
    p_group_id,
    p_user_id,
    'invite_rejected',
    jsonb_build_object('user_id', p_user_id, 'display_name', v_display_name),
    'رفض ' || v_display_name || ' الدعوة',
    v_display_name || ' rejected the invite'
  );

  -- Notify group admins
  INSERT INTO notifications (user_id, title, body, type, data)
  SELECT gm.user_id, 
    'رفض دعوة',
    'رفض ' || v_display_name || ' الدعوة للمجموعة',
    'group_invite_rejected',
    jsonb_build_object('group_id', p_group_id, 'rejected_by', p_user_id)
  FROM group_members gm
  WHERE gm.group_id = p_group_id 
    AND gm.role IN ('owner', 'admin')
    AND gm.status = 'active'
    AND gm.user_id != p_user_id;
END;
$$;
