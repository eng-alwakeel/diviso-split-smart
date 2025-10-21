-- Performance Optimization: Add indexes for faster queries

-- Index for expenses queries (most common filters)
CREATE INDEX IF NOT EXISTS idx_expenses_payer_status 
ON expenses(payer_id, status) 
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_group_created 
ON expenses(group_id, created_at DESC) 
WHERE group_id IS NOT NULL;

-- Index for expense_splits queries
CREATE INDEX IF NOT EXISTS idx_expense_splits_member 
ON expense_splits(member_id, expense_id);

-- Index for group_members queries
CREATE INDEX IF NOT EXISTS idx_group_members_user 
ON group_members(user_id, group_id);

CREATE INDEX IF NOT EXISTS idx_group_members_group 
ON group_members(group_id, user_id);

-- Index for user_subscriptions queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status 
ON user_subscriptions(user_id, status) 
WHERE status IN ('active', 'trialing');

-- Index for ad_impressions queries
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user_created 
ON ad_impressions(user_id, created_at DESC);

-- Index for affiliate_products queries
CREATE INDEX IF NOT EXISTS idx_affiliate_products_active_conversion 
ON affiliate_products(active, conversion_rate DESC) 
WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_affiliate_products_category_active 
ON affiliate_products(category, active, conversion_rate DESC) 
WHERE active = true;

-- Index for referral_rewards queries
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_applied 
ON referral_rewards(user_id, applied_to_subscription);

-- Index for user_ad_preferences queries
CREATE INDEX IF NOT EXISTS idx_user_ad_preferences_user 
ON user_ad_preferences(user_id);

-- Analyze tables to update statistics
ANALYZE expenses;
ANALYZE expense_splits;
ANALYZE group_members;
ANALYZE user_subscriptions;
ANALYZE ad_impressions;
ANALYZE affiliate_products;
ANALYZE referral_rewards;
ANALYZE user_ad_preferences;