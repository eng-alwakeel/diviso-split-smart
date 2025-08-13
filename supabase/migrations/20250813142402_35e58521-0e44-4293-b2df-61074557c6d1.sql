-- Remove the broad "ALL" policy and replace with more granular policies
DROP POLICY IF EXISTS "Owner/admins can manage invites" ON public.invites;

-- Create more specific policies for better security granularity
CREATE POLICY "Only group owners can create invites" 
ON public.invites 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups g 
    WHERE g.id = group_id AND g.owner_id = auth.uid()
  ) 
  AND created_by = auth.uid()
);

CREATE POLICY "Only group owners can update invites" 
ON public.invites 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.groups g 
    WHERE g.id = group_id AND g.owner_id = auth.uid()
  )
);

CREATE POLICY "Only group owners can delete invites" 
ON public.invites 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.groups g 
    WHERE g.id = group_id AND g.owner_id = auth.uid()
  )
);

-- Update the read policy to be more explicit (keep existing but make it clearer)
DROP POLICY IF EXISTS "Owner/admins can read invites" ON public.invites;

CREATE POLICY "Only group owners can read invites" 
ON public.invites 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.groups g 
    WHERE g.id = group_id AND g.owner_id = auth.uid()
  )
);

-- Add a comment to document the security reasoning
COMMENT ON TABLE public.invites IS 'Contains sensitive phone/email data - access restricted to group owners only to prevent contact harvesting by group members';