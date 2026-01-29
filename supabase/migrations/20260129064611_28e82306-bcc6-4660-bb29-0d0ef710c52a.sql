-- Create invoice for user 096e33cc-68ab-4abb-9561-90a709a1f408
DO $$
DECLARE
  v_invoice_id uuid;
BEGIN
  SELECT create_invoice_for_purchase(
    '096e33cc-68ab-4abb-9561-90a709a1f408'::uuid,
    'subscription',
    '257e2add-ba78-4d5a-9f1e-ed4d6aa0ff7f'::uuid,
    19,
    'Starter Monthly Subscription',
    'اشتراك ستارتر (شهري)',
    'f0a9e8f0-9202-432c-8b82-19502dc848b6',
    'monthly'
  ) INTO v_invoice_id;
  
  RAISE NOTICE 'Created invoice with ID: %', v_invoice_id;
END $$;