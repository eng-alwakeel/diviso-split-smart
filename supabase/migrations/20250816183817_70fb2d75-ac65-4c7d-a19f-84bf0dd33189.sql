-- إضافة نوع الميزانية المتخصص
DO $$ BEGIN
    CREATE TYPE budget_type AS ENUM ('monthly', 'trip', 'event', 'project', 'emergency', 'savings');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- إضافة حقل نوع الميزانية
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS budget_type budget_type DEFAULT 'monthly';

-- إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_budgets_type_group ON budgets(budget_type, group_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period_dates ON budgets(period, start_date, end_date);