-- إضافة القيم الجديدة للـ enum بشكل منفصل
-- ملاحظة: ADD VALUE IF NOT EXISTS لا يعمل في transaction، لذا نستخدم DO block
DO $$
BEGIN
  BEGIN
    ALTER TYPE subscription_plan ADD VALUE 'starter_monthly';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE subscription_plan ADD VALUE 'starter_yearly';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE subscription_plan ADD VALUE 'pro_monthly';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE subscription_plan ADD VALUE 'pro_yearly';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE subscription_plan ADD VALUE 'max_monthly';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE subscription_plan ADD VALUE 'max_yearly';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END;
$$;