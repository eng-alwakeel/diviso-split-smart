-- Update free plan limits for better conversion
UPDATE subscription_limits 
SET limit_value = 50 
WHERE plan = 'free' AND action = 'expense_created';

UPDATE subscription_limits 
SET limit_value = 10 
WHERE plan = 'free' AND action = 'ocr_used';

-- Add new restrictions for free plan
INSERT INTO subscription_limits (plan, action, limit_value) VALUES 
('free', 'report_export', 5),
('free', 'data_retention_months', 6);

-- Add same restrictions for other plans (unlimited)
INSERT INTO subscription_limits (plan, action, limit_value) VALUES 
('personal', 'report_export', -1),
('personal', 'data_retention_months', -1),
('family', 'report_export', -1),
('family', 'data_retention_months', -1),
('lifetime', 'report_export', -1),
('lifetime', 'data_retention_months', -1);