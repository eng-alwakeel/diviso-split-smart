-- Allow members (non-owners) to leave their groups by deleting their own membership row
CREATE POLICY "Members can leave their groups"
ON public.group_members
FOR DELETE
USING (
  user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id AND g.owner_id = auth.uid()
  )
);
