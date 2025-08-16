-- Add expires_at field to referrals table
ALTER TABLE public.referrals 
ADD COLUMN expires_at timestamp with time zone DEFAULT (now() + interval '7 days');

-- Update existing referrals to have expiration date
UPDATE public.referrals 
SET expires_at = created_at + interval '7 days' 
WHERE expires_at IS NULL;

-- Make expires_at not null
ALTER TABLE public.referrals 
ALTER COLUMN expires_at SET NOT NULL;