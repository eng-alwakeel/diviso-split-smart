-- إنشاء الفواتير المفقودة للاشتراكات المكتملة
DO $$
DECLARE
  v_purchase RECORD;
  v_plan RECORD;
  v_billing_cycle_ar TEXT;
BEGIN
  FOR v_purchase IN 
    SELECT sp.* FROM subscription_purchases sp
    WHERE sp.status = 'completed'
    AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.subscription_id = sp.id)
  LOOP
    SELECT * INTO v_plan FROM subscription_plans WHERE id = v_purchase.plan_id;
    
    IF v_purchase.billing_cycle = 'yearly' THEN
      v_billing_cycle_ar := 'سنوي';
    ELSE
      v_billing_cycle_ar := 'شهري';
    END IF;
    
    PERFORM create_invoice_for_purchase(
      v_purchase.user_id, 
      'subscription', 
      v_purchase.id, 
      v_purchase.price_paid,
      COALESCE(v_plan.name, 'Subscription') || ' (' || v_purchase.billing_cycle || ')',
      'اشتراك ' || COALESCE(v_plan.name, '') || ' (' || v_billing_cycle_ar || ')',
      v_purchase.payment_id,
      v_purchase.billing_cycle
    );
  END LOOP;
END;
$$;