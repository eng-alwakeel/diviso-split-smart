-- Create function to update onboarding task: first_referral_made (fix: use inviter_id)
CREATE OR REPLACE FUNCTION public.update_onboarding_first_referral()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.onboarding_tasks (user_id, first_referral_made, tasks_completed)
  VALUES (NEW.inviter_id, true, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    first_referral_made = true,
    tasks_completed = (
      SELECT COUNT(*) FILTER (WHERE val = true) FROM (
        VALUES 
          (onboarding_tasks.profile_completed),
          (onboarding_tasks.first_group_created),
          (onboarding_tasks.first_expense_added),
          (onboarding_tasks.first_invite_sent),
          (true)
      ) AS t(val)
    ),
    updated_at = now()
  WHERE NOT onboarding_tasks.first_referral_made;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for first referral
DROP TRIGGER IF EXISTS on_referral_onboarding ON public.referrals;
CREATE TRIGGER on_referral_onboarding
  AFTER INSERT ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_onboarding_first_referral();

-- First referral made (fix: use inviter_id)
UPDATE public.onboarding_tasks ot
SET first_referral_made = true, updated_at = now()
FROM public.referrals r
WHERE ot.user_id = r.inviter_id
  AND NOT ot.first_referral_made;

-- Update tasks_completed count for all users
UPDATE public.onboarding_tasks
SET tasks_completed = (
  (CASE WHEN profile_completed THEN 1 ELSE 0 END) +
  (CASE WHEN first_group_created THEN 1 ELSE 0 END) +
  (CASE WHEN first_expense_added THEN 1 ELSE 0 END) +
  (CASE WHEN first_invite_sent THEN 1 ELSE 0 END) +
  (CASE WHEN first_referral_made THEN 1 ELSE 0 END)
),
updated_at = now();