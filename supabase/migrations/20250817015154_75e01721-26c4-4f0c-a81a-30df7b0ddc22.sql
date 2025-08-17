-- Activate admin privileges for the specified user
UPDATE public.profiles 
SET is_admin = true, updated_at = now()
WHERE id = '096e33cc-68ab-4abb-9561-90a709a1f408';