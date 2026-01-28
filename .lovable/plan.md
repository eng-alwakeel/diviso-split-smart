

# خطة إصلاح مشكلة عدم إنشاء الفواتير للاشتراكات

## المشكلة المكتشفة

| العنصر | القيمة |
|--------|--------|
| عملية الشراء | `1673be5a-ac85-413e-8f8e-2cf8f37e94f7` |
| المستخدم | `ab24ff88-62a9-4df7-8a8c-0dbd9b7a531b` |
| حالة الشراء | `completed` |
| المبلغ | 19 ر.س |
| الفاتورة | **غير موجودة** |

## السبب الجذري

في ملف `PaymentCallback.tsx`، هناك مساران لإكمال الاشتراك:

**المسار 1 - `complete_subscription_purchase` RPC (ينشئ فاتورة):**
```tsx
const { data: result } = await supabase.rpc('complete_subscription_purchase', {...});
```
- هذا المسار يستدعي `create_invoice_for_purchase` داخل قاعدة البيانات

**المسار 2 - `handleSubscriptionPaymentManual` (لا ينشئ فاتورة):**
```tsx
await handleSubscriptionPaymentManual(purchaseId, paymentId);
```
- يتم استخدامه كـ fallback إذا فشل المسار الأول
- **لا يستدعي إنشاء الفاتورة**

ما حدث على الأرجح:
1. المستخدم دفع ونجح الدفع
2. تم استدعاء `complete_subscription_purchase` لكنه أرجع خطأ أو `success: false`
3. تم تنفيذ `handleSubscriptionPaymentManual` الذي أكمل الاشتراك **بدون إنشاء فاتورة**

---

## الحل المقترح

### 1. إصلاح `handleSubscriptionPaymentManual` في `PaymentCallback.tsx`

إضافة استدعاء إنشاء الفاتورة في نهاية الدالة:

```tsx
// بعد إكمال الاشتراك ومنح الرصيد، إنشاء الفاتورة
const { data: invoiceResult, error: invoiceError } = await supabase.rpc('create_invoice_for_purchase', {
  p_user_id: purchase.user_id,
  p_purchase_type: 'subscription',
  p_purchase_id: purchaseId,
  p_amount: purchase.price_paid,
  p_description: `${purchase.subscription_plans?.name || 'Subscription'} (${purchase.billing_cycle})`,
  p_description_ar: `اشتراك ${purchase.subscription_plans?.name || ''} (${purchase.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'})`,
  p_payment_reference: paymentId || null,
  p_billing_cycle: purchase.billing_cycle
});

if (invoiceError) {
  console.error('Error creating invoice:', invoiceError);
}
```

### 2. إنشاء الفاتورة المفقودة للمستخدم الحالي

تنفيذ SQL لإنشاء فاتورة للاشتراك المكتمل الذي لا يحتوي على فاتورة:

```sql
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
```

---

## الملفات التي سيتم تعديلها

| الملف | التعديل |
|-------|---------|
| `src/pages/PaymentCallback.tsx` | إضافة استدعاء `create_invoice_for_purchase` في `handleSubscriptionPaymentManual` |
| Database Migration | إنشاء الفواتير المفقودة للاشتراكات المكتملة |

---

## النتيجة المتوقعة

1. المستخدم الحالي سيرى فاتورته في قسم الفواتير
2. أي اشتراكات مستقبلية ستنشئ فواتير تلقائيا سواء عبر المسار الرئيسي أو الـ fallback
3. ضمان عدم وجود اشتراكات مكتملة بدون فواتير

