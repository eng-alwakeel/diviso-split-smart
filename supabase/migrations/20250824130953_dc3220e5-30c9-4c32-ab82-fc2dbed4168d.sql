-- Add privacy_policy_accepted_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN privacy_policy_accepted_at timestamp with time zone DEFAULT NULL;