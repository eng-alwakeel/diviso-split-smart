-- =====================================================
-- Fix Referral Points: Compensation + Auto-Triggers
-- =====================================================

-- 1. Update referral_progress for invitees who have expenses (first usage)
UPDATE referral_progress rp
SET 
  first_usage_at = (SELECT MIN(e.created_at) FROM expenses e WHERE e.created_by = rp.invitee_id),
  points_for_first_usage = 10,
  total_points = COALESCE(total_points, 0) + 10,
  updated_at = now()
WHERE first_usage_at IS NULL
AND EXISTS (SELECT 1 FROM expenses e WHERE e.created_by = rp.invitee_id);

-- 2. Update referral_progress for invitees who created groups
UPDATE referral_progress rp
SET 
  first_group_or_settlement_at = (SELECT MIN(g.created_at) FROM groups g WHERE g.owner_id = rp.invitee_id),
  points_for_group_settlement = 20,
  total_points = COALESCE(total_points, 0) + 20,
  updated_at = now()
WHERE first_group_or_settlement_at IS NULL
AND EXISTS (SELECT 1 FROM groups g WHERE g.owner_id = rp.invitee_id);

-- 3. Grant usage_credits for first usage bonus (10 UC per invitee)
INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
SELECT DISTINCT
  rp.inviter_id,
  10,
  'referral_first_usage',
  'تعويض: مكافأة أول استخدام للمدعو',
  now() + interval '90 days'
FROM referral_progress rp
WHERE rp.first_usage_at IS NOT NULL 
AND rp.points_for_first_usage = 10
AND rp.inviter_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM usage_credits uc 
  WHERE uc.user_id = rp.inviter_id 
  AND uc.source = 'referral_first_usage'
  AND uc.created_at > rp.first_usage_at - interval '1 minute'
);

-- 4. Grant usage_credits for group/settlement bonus (20 UC per invitee)
INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
SELECT DISTINCT
  rp.inviter_id,
  20,
  'referral_milestone',
  'تعويض: مكافأة أول قروب للمدعو',
  now() + interval '90 days'
FROM referral_progress rp
WHERE rp.first_group_or_settlement_at IS NOT NULL 
AND rp.points_for_group_settlement = 20
AND rp.inviter_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM usage_credits uc 
  WHERE uc.user_id = rp.inviter_id 
  AND uc.source = 'referral_milestone'
  AND uc.created_at > rp.first_group_or_settlement_at - interval '1 minute'
);

-- 5. Send notifications to compensated inviters
INSERT INTO notifications (user_id, type, payload)
SELECT DISTINCT
  rp.inviter_id,
  'referral_compensation',
  jsonb_build_object(
    'message_ar', 'تم تعويضك بنقاط إحالة مستحقة! راجع رصيدك 🎉',
    'message_en', 'You have been credited with pending referral points! Check your balance 🎉',
    'total_points', rp.total_points
  )
FROM referral_progress rp
WHERE rp.inviter_id IS NOT NULL
AND (rp.points_for_first_usage > 0 OR rp.points_for_group_settlement > 0);

-- =====================================================
-- 6. Create Trigger for automatic first usage bonus
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_grant_first_usage_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the user's first expense
  IF NOT EXISTS (
    SELECT 1 FROM expenses 
    WHERE created_by = NEW.created_by 
    AND id != NEW.id
  ) THEN
    -- Grant bonus to inviter
    PERFORM grant_referral_first_usage_bonus(NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop if exists and recreate
DROP TRIGGER IF EXISTS on_first_expense_referral_bonus ON expenses;
CREATE TRIGGER on_first_expense_referral_bonus
AFTER INSERT ON expenses
FOR EACH ROW
EXECUTE FUNCTION trigger_grant_first_usage_bonus();

-- =====================================================
-- 7. Create Trigger for automatic group milestone bonus
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_grant_group_milestone_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the user's first group
  IF NOT EXISTS (
    SELECT 1 FROM groups 
    WHERE owner_id = NEW.owner_id 
    AND id != NEW.id
  ) THEN
    -- Grant bonus to inviter
    PERFORM grant_referral_milestone_bonus(NEW.owner_id, 'group');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop if exists and recreate
DROP TRIGGER IF EXISTS on_first_group_referral_bonus ON groups;
CREATE TRIGGER on_first_group_referral_bonus
AFTER INSERT ON groups
FOR EACH ROW
EXECUTE FUNCTION trigger_grant_group_milestone_bonus();