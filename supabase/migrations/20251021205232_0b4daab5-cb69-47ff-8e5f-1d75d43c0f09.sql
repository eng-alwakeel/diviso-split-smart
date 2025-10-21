-- ===================================
-- CRITICAL SECURITY FIX: User Roles System
-- ===================================

-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Migrate existing admin users from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT id, 'admin'::app_role, now()
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Update is_admin_user function to use new roles table
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(auth.uid(), 'admin')
$$;

-- Add trigger to prevent users from self-promoting via profiles.is_admin
CREATE OR REPLACE FUNCTION public.prevent_admin_self_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent non-admins from changing is_admin flag
  IF OLD.is_admin != NEW.is_admin THEN
    IF NOT has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only administrators can modify admin status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER block_admin_self_promotion
BEFORE UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD.is_admin IS DISTINCT FROM NEW.is_admin)
EXECUTE FUNCTION public.prevent_admin_self_promotion();

-- Update profiles RLS policy to prevent is_admin modifications
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND is_admin = (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- Add security logging for role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_security_event(
      'role_assigned',
      'user_roles',
      jsonb_build_object(
        'user_id', NEW.user_id,
        'role', NEW.role,
        'assigned_by', auth.uid()
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_security_event(
      'role_removed',
      'user_roles',
      jsonb_build_object(
        'user_id', OLD.user_id,
        'role', OLD.role,
        'removed_by', auth.uid()
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER log_user_role_changes
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.log_role_changes();