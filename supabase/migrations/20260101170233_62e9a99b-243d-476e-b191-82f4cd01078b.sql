-- Insert subscription limits for all plans
INSERT INTO subscription_limits (plan, action, limit_value) VALUES
-- Free Plan
('free', 'add_member', 5),
('free', 'group_created', 3),
('free', 'expense_created', 50),
('free', 'invite_sent', 10),
('free', 'ocr_used', 10),
('free', 'report_export', 5),
('free', 'data_retention_months', 6),
-- Starter Plan
('starter', 'add_member', 15),
('starter', 'group_created', 10),
('starter', 'expense_created', 200),
('starter', 'invite_sent', 50),
('starter', 'ocr_used', 50),
('starter', 'report_export', 20),
('starter', 'data_retention_months', 12),
-- Pro Plan
('pro', 'add_member', -1),
('pro', 'group_created', -1),
('pro', 'expense_created', -1),
('pro', 'invite_sent', -1),
('pro', 'ocr_used', 100),
('pro', 'report_export', -1),
('pro', 'data_retention_months', 24),
-- Max Plan
('max', 'add_member', -1),
('max', 'group_created', -1),
('max', 'expense_created', -1),
('max', 'invite_sent', -1),
('max', 'ocr_used', -1),
('max', 'report_export', -1),
('max', 'data_retention_months', -1)
ON CONFLICT (plan, action) DO UPDATE SET limit_value = EXCLUDED.limit_value;