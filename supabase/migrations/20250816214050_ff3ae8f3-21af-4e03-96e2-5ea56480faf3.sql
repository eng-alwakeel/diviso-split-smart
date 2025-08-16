-- Update lifetime plan limits to match personal plan (unlimited groups and members)
UPDATE public.subscription_limits 
SET limit_value = -1 
WHERE plan = 'lifetime' 
AND action IN ('add_member', 'group_created');

-- Also improve other lifetime plan limits to be more generous
UPDATE public.subscription_limits 
SET limit_value = 2000 
WHERE plan = 'lifetime' 
AND action = 'expense_created';

UPDATE public.subscription_limits 
SET limit_value = 1000 
WHERE plan = 'lifetime' 
AND action = 'invite_sent';

UPDATE public.subscription_limits 
SET limit_value = 2000 
WHERE plan = 'lifetime' 
AND action = 'ocr_used';