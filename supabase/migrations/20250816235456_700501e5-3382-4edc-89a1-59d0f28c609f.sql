-- Fix infinite recursion in family_members RLS by creating security definer functions
CREATE OR REPLACE FUNCTION public.is_family_owner(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_owner_id = p_user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_family_member_of(p_family_owner_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_owner_id = p_family_owner_id AND member_user_id = p_user_id
  );
END;
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Family members can view other members" ON public.family_members;
DROP POLICY IF EXISTS "Family owners can manage all members" ON public.family_members;
DROP POLICY IF EXISTS "Members can leave family" ON public.family_members;

-- Create new safe RLS policies for family_members
CREATE POLICY "Family owners can manage all members"
ON public.family_members
FOR ALL
TO authenticated
USING (family_owner_id = auth.uid())
WITH CHECK (family_owner_id = auth.uid());

CREATE POLICY "Family members can view family data"
ON public.family_members
FOR SELECT
TO authenticated
USING (
  family_owner_id = auth.uid() OR 
  member_user_id = auth.uid() OR
  public.is_family_member_of(family_owner_id, auth.uid())
);

CREATE POLICY "Members can leave family"
ON public.family_members
FOR DELETE
TO authenticated
USING (member_user_id = auth.uid());

-- Protect sensitive business data - lifetime_offer_tracking
DROP POLICY IF EXISTS "Everyone can read offer status" ON public.lifetime_offer_tracking;

CREATE POLICY "Only authenticated users can read offer status"
ON public.lifetime_offer_tracking
FOR SELECT
TO authenticated
USING (true);

-- Protect sensitive business data - subscription_limits  
DROP POLICY IF EXISTS "Authenticated users can read subscription limits" ON public.subscription_limits;

CREATE POLICY "Only authenticated users can read subscription limits"
ON public.subscription_limits
FOR SELECT
TO authenticated
USING (true);

-- Protect currency data - require authentication
DROP POLICY IF EXISTS "Authenticated users can read currencies" ON public.currencies;
DROP POLICY IF EXISTS "Authenticated users can read exchange rates" ON public.exchange_rates;

CREATE POLICY "Only authenticated users can read currencies"
ON public.currencies
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can read exchange rates"
ON public.exchange_rates
FOR SELECT
TO authenticated
USING (true);