-- Step 1: Backfill referrals for existing group members
INSERT INTO public.referrals (
  inviter_id,
  invitee_phone,
  invitee_name,
  status,
  joined_at,
  reward_days,
  referral_source,
  group_id,
  expires_at
)
SELECT DISTINCT
  g.owner_id as inviter_id,
  'group_member_' || gm.user_id::text as invitee_phone,
  COALESCE(p.display_name, p.name, 'عضو') as invitee_name,
  'joined'::referral_status as status,
  gm.joined_at as joined_at,
  7 as reward_days,
  'group_invite' as referral_source,
  g.id as group_id,
  now() + interval '30 days' as expires_at
FROM public.group_members gm
JOIN public.groups g ON g.id = gm.group_id
LEFT JOIN public.profiles p ON p.id = gm.user_id
WHERE gm.user_id != g.owner_id
  AND NOT EXISTS (
    SELECT 1 FROM public.referrals r 
    WHERE r.inviter_id = g.owner_id 
      AND r.invitee_phone = 'group_member_' || gm.user_id::text
  )
ON CONFLICT DO NOTHING;