-- حذف السياسة المسببة للمشكلة
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- إنشاء سياسة بسيطة بدون استعلام فرعي
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- إنشاء دالة لحماية حقل is_admin
CREATE OR REPLACE FUNCTION prevent_is_admin_change()
RETURNS trigger AS $$
BEGIN
  -- إذا حاول المستخدم تغيير is_admin وليس أدمن، نرجع القيمة القديمة
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- حذف الـ trigger إذا كان موجود
DROP TRIGGER IF EXISTS protect_is_admin ON profiles;

-- إنشاء trigger لحماية is_admin
CREATE TRIGGER protect_is_admin
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_is_admin_change();