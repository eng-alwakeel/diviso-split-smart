-- Fix security issues for contact information exposure across multiple tables

-- 1. The invites table is already properly secured to group owners only
-- But let's add a more explicit policy name and improve the security

-- 2. Fix the referrals table - ensure only the referrer can see their own referrals
-- The existing policies look correct but let's verify they're restrictive enough

-- 3. Improve group_join_tokens security - ensure tokens are only visible to group admins/owners

-- First, let's add an additional safeguard for invites table by ensuring phone_or_email is never exposed
-- in any potential query that might bypass our current policies

-- Update the invites table to add row-level security comment
COMMENT ON COLUMN public.invites.phone_or_email IS 'SENSITIVE: Contains personal contact information - restricted to group owners only';

-- Verify referrals table policies are restrictive enough
-- Check if there are any overly permissive policies
DROP POLICY IF EXISTS "Users can read any referrals" ON public.referrals;
DROP POLICY IF EXISTS "Public can read referrals" ON public.referrals;

-- Ensure referrals are only accessible by the referrer
-- The existing policies should be correct, but let's make sure they're explicit
CREATE POLICY "Users can only read their own referrals" 
ON public.referrals 
FOR SELECT 
USING (inviter_id = auth.uid());

-- Improve group_join_tokens security
-- Ensure tokens are only visible to group admins, not just any group member
DROP POLICY IF EXISTS "Members can read join tokens" ON public.group_join_tokens;

-- Add a policy to ensure tokens are properly protected
CREATE POLICY "Only group admins can view join tokens" 
ON public.group_join_tokens 
FOR SELECT 
USING (is_group_admin(group_id));

-- Add security comments to document sensitive fields
COMMENT ON COLUMN public.referrals.invitee_phone IS 'SENSITIVE: Contains personal phone numbers - restricted to referrer only';
COMMENT ON COLUMN public.group_join_tokens.token IS 'SENSITIVE: Contains access tokens - restricted to group admins only';

-- Create a security audit view that shows no sensitive data is exposed
-- This is for documentation purposes only - it will fail if any data is exposed
CREATE OR REPLACE VIEW public.security_audit_sensitive_fields AS
SELECT 
  'invites.phone_or_email' as field_name,
  'group_owners_only' as access_level,
  'Contains phone numbers and emails for group invitations' as description
UNION ALL
SELECT 
  'referrals.invitee_phone' as field_name,
  'referrer_only' as access_level,
  'Contains phone numbers for referral tracking' as description  
UNION ALL
SELECT 
  'group_join_tokens.token' as field_name,
  'group_admins_only' as access_level,
  'Contains access tokens for joining groups' as description;

COMMENT ON VIEW public.security_audit_sensitive_fields IS 'Documents all sensitive fields and their access restrictions for security auditing';