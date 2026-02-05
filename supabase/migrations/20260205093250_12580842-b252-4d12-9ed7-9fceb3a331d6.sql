-- Enable the 'rewarded' ad type to show the "Watch Ad" option in ZeroCreditsPaywall
UPDATE ad_types 
SET is_enabled = true, updated_at = now() 
WHERE type_key = 'rewarded';