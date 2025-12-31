-- =============================================
-- إلغاء نظام الاشتراك القديم بالكامل
-- =============================================

-- المرحلة 1: حذف جميع الـ Triggers
DROP TRIGGER IF EXISTS trg_groups_quota ON groups;
DROP TRIGGER IF EXISTS trg_expenses_quota ON expenses;
DROP TRIGGER IF EXISTS trg_gm_quota ON group_members;
DROP TRIGGER IF EXISTS trg_ocr_quota ON receipt_ocr;
DROP TRIGGER IF EXISTS trg_invites_quota ON invites;

-- المرحلة 2: حذف جميع الدوال المرتبطة بالنظام القديم
DROP FUNCTION IF EXISTS trg_groups_quota_fn();
DROP FUNCTION IF EXISTS trg_expenses_quota_fn();
DROP FUNCTION IF EXISTS trg_gm_quota_fn();
DROP FUNCTION IF EXISTS trg_ocr_quota_fn();
DROP FUNCTION IF EXISTS trg_invites_quota_fn();
DROP FUNCTION IF EXISTS assert_quota(text, uuid, uuid);
DROP FUNCTION IF EXISTS get_user_plan(uuid);
DROP FUNCTION IF EXISTS get_current_count(uuid, text, uuid);

-- المرحلة 3: إفراغ جداول النظام القديم
TRUNCATE TABLE user_subscriptions CASCADE;
TRUNCATE TABLE subscription_limits CASCADE;