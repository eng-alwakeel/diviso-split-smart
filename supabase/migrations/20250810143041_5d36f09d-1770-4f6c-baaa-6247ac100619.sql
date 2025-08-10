
-- السماح لأعضاء نفس المجموعة بقراءة ملفات بعضهم (profiles)
-- تبقى سياسة "المالك فقط" كما هي، وهذه السياسة تُضيف سماحاً إضافياً مشروطاً بعضوية مشتركة
CREATE POLICY "Group members can view each other's profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.group_members gm_self
    JOIN public.group_members gm_other
      ON gm_self.group_id = gm_other.group_id
    WHERE gm_self.user_id = auth.uid()
      AND gm_other.user_id = profiles.id
  )
);
