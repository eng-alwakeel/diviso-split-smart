-- إزالة الـ constraint القديم
ALTER TABLE credit_consumption_log 
DROP CONSTRAINT IF EXISTS credit_consumption_log_action_type_check;

-- إضافة constraint جديد مع القيم الإضافية
ALTER TABLE credit_consumption_log 
ADD CONSTRAINT credit_consumption_log_action_type_check 
CHECK (action_type = ANY (ARRAY[
  'ocr_scan',
  'smart_category', 
  'recommendation',
  'advanced_report',
  'export',
  'create_group',
  'settlement',
  'admin_grant',
  'admin_deduct',
  'expense_created',
  'referral_bonus'
]));