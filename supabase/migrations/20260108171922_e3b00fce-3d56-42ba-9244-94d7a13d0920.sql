-- Step 2: Create referral_progress for group invite referrals
INSERT INTO public.referral_progress (
  referral_id,
  inviter_id,
  invitee_id,
  signup_completed,
  points_for_signup,
  total_points
)
SELECT 
  r.id as referral_id,
  r.inviter_id,
  REPLACE(r.invitee_phone, 'group_member_', '')::uuid as invitee_id,
  true as signup_completed,
  0 as points_for_signup,
  0 as total_points
FROM public.referrals r
WHERE r.referral_source = 'group_invite'
  AND r.invitee_phone LIKE 'group_member_%'
  AND NOT EXISTS (
    SELECT 1 FROM public.referral_progress rp WHERE rp.referral_id = r.id
  )
ON CONFLICT DO NOTHING;