-- Add lifetime plan to subscription_plan enum
ALTER TYPE subscription_plan ADD VALUE 'lifetime';

-- Add subscription limits for lifetime plan
INSERT INTO subscription_limits (plan, action, limit_value) VALUES 
('lifetime', 'add_member', 100),
('lifetime', 'group_created', 50),
('lifetime', 'expense_created', 10000),
('lifetime', 'invite_sent', 500),
('lifetime', 'ocr_used', 1000);

-- Update family plan limits to 5 members
UPDATE subscription_limits 
SET limit_value = 5 
WHERE plan = 'family' AND action = 'add_member';