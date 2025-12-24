-- Add referral_id column to invites table to link group invites to referral system
ALTER TABLE public.invites 
ADD COLUMN IF NOT EXISTS referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL;

-- Add referral_source to referrals table to differentiate between personal and group referrals
-- Check if column exists first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'referrals' 
    AND column_name = 'group_id'
  ) THEN
    ALTER TABLE public.referrals ADD COLUMN group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add group_name column to referrals for display purposes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'referrals' 
    AND column_name = 'group_name'
  ) THEN
    ALTER TABLE public.referrals ADD COLUMN group_name text;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invites_referral_id ON public.invites(referral_id);
CREATE INDEX IF NOT EXISTS idx_referrals_group_id ON public.referrals(group_id);

-- Update RLS policy for referrals to include group-based access
-- Users can see referrals they created or referrals related to groups they're members of