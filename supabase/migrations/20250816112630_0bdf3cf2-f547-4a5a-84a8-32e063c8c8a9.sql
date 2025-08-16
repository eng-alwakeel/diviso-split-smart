-- حل مشكلة Security Definer View
-- إزالة الview الذي يستخدم SECURITY DEFINER لأنه غير آمن
DROP VIEW IF EXISTS public.security_audit_sensitive_fields;