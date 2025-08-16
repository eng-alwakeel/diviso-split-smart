-- إنشاء جدول أعضاء الخطة العائلية
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_owner_id UUID NOT NULL,
  member_user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_owner_id, member_user_id)
);

-- إنشاء جدول دعوات الخطة العائلية
CREATE TABLE public.family_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_owner_id UUID NOT NULL,
  invited_email TEXT,
  invited_phone TEXT,
  invitation_code TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_by UUID,
  accepted_at TIMESTAMP WITH TIME ZONE,
  CHECK (invited_email IS NOT NULL OR invited_phone IS NOT NULL)
);

-- تمكين RLS للجداول الجديدة
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول family_members
CREATE POLICY "Family owners can manage all members"
ON public.family_members
FOR ALL
USING (family_owner_id = auth.uid())
WITH CHECK (family_owner_id = auth.uid());

CREATE POLICY "Family members can view other members"
ON public.family_members
FOR SELECT
USING (
  family_owner_id = auth.uid() OR 
  member_user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.family_owner_id = family_members.family_owner_id 
    AND fm.member_user_id = auth.uid()
  )
);

CREATE POLICY "Members can leave family"
ON public.family_members
FOR DELETE
USING (member_user_id = auth.uid());

-- سياسات RLS لجدول family_invitations
CREATE POLICY "Family owners can manage invitations"
ON public.family_invitations
FOR ALL
USING (family_owner_id = auth.uid())
WITH CHECK (family_owner_id = auth.uid());

CREATE POLICY "Invited users can view their invitations"
ON public.family_invitations
FOR SELECT
USING (
  family_owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE (p.display_name = family_invitations.invited_email OR p.phone = family_invitations.invited_phone)
    AND p.id = auth.uid()
  )
);

CREATE POLICY "Invited users can accept invitations"
ON public.family_invitations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE (p.display_name = family_invitations.invited_email OR p.phone = family_invitations.invited_phone)
    AND p.id = auth.uid()
  )
);

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_family_invitations_updated_at
  BEFORE UPDATE ON public.family_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- دالة للحصول على حدود الخطة العائلية المشتركة
CREATE OR REPLACE FUNCTION public.get_family_quota_limits(p_user_id uuid)
RETURNS TABLE(
  plan_type TEXT,
  members_limit INTEGER,
  groups_limit INTEGER,
  expenses_limit INTEGER,
  invites_limit INTEGER,
  ocr_limit INTEGER
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_family_owner_id UUID;
  v_user_plan TEXT;
BEGIN
  -- التحقق من وجود المستخدم في خطة عائلية
  SELECT family_owner_id INTO v_family_owner_id
  FROM public.family_members 
  WHERE member_user_id = p_user_id;
  
  -- إذا كان المستخدم عضو في خطة عائلية، استخدم خطة المالك
  IF v_family_owner_id IS NOT NULL THEN
    v_user_plan := public.get_user_plan(v_family_owner_id);
  ELSE
    -- التحقق من كون المستخدم مالك خطة عائلية
    IF EXISTS (SELECT 1 FROM public.family_members WHERE family_owner_id = p_user_id) THEN
      v_user_plan := public.get_user_plan(p_user_id);
    ELSE
      -- المستخدم ليس في خطة عائلية
      v_user_plan := public.get_user_plan(p_user_id);
    END IF;
  END IF;
  
  -- إرجاع حدود الخطة
  RETURN QUERY
  SELECT 
    v_user_plan as plan_type,
    sl1.limit_value as members_limit,
    sl2.limit_value as groups_limit,
    sl3.limit_value as expenses_limit,
    sl4.limit_value as invites_limit,
    sl5.limit_value as ocr_limit
  FROM 
    public.subscription_limits sl1,
    public.subscription_limits sl2,
    public.subscription_limits sl3,
    public.subscription_limits sl4,
    public.subscription_limits sl5
  WHERE 
    sl1.plan = v_user_plan AND sl1.action = 'add_member' AND
    sl2.plan = v_user_plan AND sl2.action = 'group_created' AND
    sl3.plan = v_user_plan AND sl3.action = 'expense_created' AND
    sl4.plan = v_user_plan AND sl4.action = 'invite_sent' AND
    sl5.plan = v_user_plan AND sl5.action = 'ocr_used';
END;
$$;