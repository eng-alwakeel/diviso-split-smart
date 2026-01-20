-- Fix user_roles RLS policies to allow both owner and admin to manage roles

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

-- Create new policies that allow both owner and admin
CREATE POLICY "Owners and admins can insert roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Owners and admins can update roles"
ON user_roles FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Owners and admins can delete roles"
ON user_roles FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add protection trigger to prevent non-owners from assigning owner role
CREATE OR REPLACE FUNCTION prevent_unauthorized_owner_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent assigning owner role unless current user is already an owner
  IF NEW.role = 'owner'::app_role AND NOT has_role(auth.uid(), 'owner'::app_role) THEN
    RAISE EXCEPTION 'Only owners can assign the owner role';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS protect_owner_role_assignment ON user_roles;

CREATE TRIGGER protect_owner_role_assignment
BEFORE INSERT OR UPDATE ON user_roles
FOR EACH ROW EXECUTE FUNCTION prevent_unauthorized_owner_assignment();