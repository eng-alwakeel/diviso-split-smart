-- Add new action types to credit_consumption_log constraint
ALTER TABLE credit_consumption_log 
DROP CONSTRAINT IF EXISTS credit_consumption_log_action_type_check;

ALTER TABLE credit_consumption_log 
ADD CONSTRAINT credit_consumption_log_action_type_check 
CHECK (action_type = ANY (ARRAY[
  -- Existing operations
  'ocr_scan', 'smart_category', 'recommendation', 'advanced_report',
  'export', 'export_pdf', 'export_excel', 'create_group', 'settlement',
  'admin_grant', 'admin_deduct', 'expense_created', 'referral_bonus',
  'add_expense',
  -- New operations
  'edit_expense', 'delete_expense', 'delete_group', 'archive_group',
  'restore_group', 'update_group_settings', 'update_member_role',
  'generate_invite_link', 'send_sms_invite', 'create_budget',
  'update_budget', 'delete_budget', 'delete_settlement',
  'trip_planner', 'smart_budget_ai'
]));