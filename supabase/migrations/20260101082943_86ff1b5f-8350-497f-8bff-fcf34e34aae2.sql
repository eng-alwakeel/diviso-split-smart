-- ============================================
-- المرحلة 2: إنشاء نظام الصلاحيات
-- ============================================

-- Create permission_scope enum with all permissions
CREATE TYPE public.permission_scope AS ENUM (
  -- Users permissions
  'users.view',
  'users.edit',
  'users.ban',
  'users.delete',
  -- Billing permissions
  'billing.view',
  'billing.refund',
  'billing.cancel_subscription',
  -- Pricing permissions
  'pricing.view',
  'pricing.edit',
  -- Credits permissions
  'credits.view',
  'credits.grant',
  'credits.deduct',
  -- Rewards permissions
  'rewards.view',
  'rewards.manage_campaigns',
  'rewards.grant_manual',
  -- Ads permissions
  'ads.view',
  'ads.manage_partners',
  'ads.manage_campaigns',
  -- Analytics permissions
  'analytics.view',
  'analytics.export',
  -- System permissions
  'system.feature_flags',
  'system.logs',
  'system.settings'
);

-- Create role_permissions table
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission public.permission_scope NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only owners/admins can view permissions
CREATE POLICY "Admins can view role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner') OR 
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policy: Only owners can modify permissions
CREATE POLICY "Only owners can modify role permissions"
ON public.role_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- ============================================
-- دوال التحقق من الصلاحيات
-- ============================================

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission public.permission_scope)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.permission = _permission
  )
$$;

-- Function to check if user has any of the specified permissions
CREATE OR REPLACE FUNCTION public.has_any_permission(_user_id uuid, _permissions public.permission_scope[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.permission = ANY(_permissions)
  )
$$;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS public.permission_scope[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(DISTINCT rp.permission),
    ARRAY[]::public.permission_scope[]
  )
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role = rp.role
  WHERE ur.user_id = _user_id
$$;

-- Function to get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS public.app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(DISTINCT ur.role),
    ARRAY[]::public.app_role[]
  )
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
$$;

-- Function to check if user is any kind of admin (has admin-level role)
CREATE OR REPLACE FUNCTION public.is_admin_level_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role IN ('owner', 'admin', 'finance_admin', 'growth_admin', 'ads_admin', 'developer')
  )
$$;

-- Create index for faster permission lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission);

-- ============================================
-- إدراج الصلاحيات الافتراضية لكل دور
-- ============================================

-- Owner: جميع الصلاحيات
INSERT INTO public.role_permissions (role, permission) VALUES
  ('owner', 'users.view'),
  ('owner', 'users.edit'),
  ('owner', 'users.ban'),
  ('owner', 'users.delete'),
  ('owner', 'billing.view'),
  ('owner', 'billing.refund'),
  ('owner', 'billing.cancel_subscription'),
  ('owner', 'pricing.view'),
  ('owner', 'pricing.edit'),
  ('owner', 'credits.view'),
  ('owner', 'credits.grant'),
  ('owner', 'credits.deduct'),
  ('owner', 'rewards.view'),
  ('owner', 'rewards.manage_campaigns'),
  ('owner', 'rewards.grant_manual'),
  ('owner', 'ads.view'),
  ('owner', 'ads.manage_partners'),
  ('owner', 'ads.manage_campaigns'),
  ('owner', 'analytics.view'),
  ('owner', 'analytics.export'),
  ('owner', 'system.feature_flags'),
  ('owner', 'system.logs'),
  ('owner', 'system.settings');

-- Admin: إدارة المستخدمين + التحليلات
INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin', 'users.view'),
  ('admin', 'users.edit'),
  ('admin', 'users.ban'),
  ('admin', 'analytics.view');

-- Finance Admin: إدارة المالية
INSERT INTO public.role_permissions (role, permission) VALUES
  ('finance_admin', 'billing.view'),
  ('finance_admin', 'billing.refund'),
  ('finance_admin', 'billing.cancel_subscription'),
  ('finance_admin', 'analytics.view');

-- Growth Admin: إدارة النمو والمكافآت
INSERT INTO public.role_permissions (role, permission) VALUES
  ('growth_admin', 'rewards.view'),
  ('growth_admin', 'rewards.manage_campaigns'),
  ('growth_admin', 'analytics.view');

-- Ads Admin: إدارة الإعلانات والشركاء
INSERT INTO public.role_permissions (role, permission) VALUES
  ('ads_admin', 'ads.view'),
  ('ads_admin', 'ads.manage_partners'),
  ('ads_admin', 'ads.manage_campaigns'),
  ('ads_admin', 'analytics.view');

-- Support Agent: خدمة العملاء (قراءة فقط)
INSERT INTO public.role_permissions (role, permission) VALUES
  ('support_agent', 'users.view'),
  ('support_agent', 'billing.view');

-- Analyst: تحليلات فقط
INSERT INTO public.role_permissions (role, permission) VALUES
  ('analyst', 'analytics.view'),
  ('analyst', 'analytics.export');

-- Developer: DevOps
INSERT INTO public.role_permissions (role, permission) VALUES
  ('developer', 'system.feature_flags'),
  ('developer', 'system.logs');