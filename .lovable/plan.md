

# خطة شاملة: تحسين نظام التسويات (إشعارات + بانر + تأكيد تلقائي بعد 7 أيام)

## الملخص
3 محاور: (1) إشعار تلقائي للمستلم عند إنشاء تسوية، (2) بانر واضح في المجموعة + رصيد متوقع، (3) تأكيد تلقائي بعد 7 أيام إذا لم يُتخذ إجراء — مع تحديث `get_group_balance` لاحتساب المنتهية فوراً.

---

## 1. Database Migration

### أ) إضافة عمود `expires_at` لجدول settlements
```sql
ALTER TABLE public.settlements
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- تعيين القيمة الافتراضية للسجلات الجديدة
ALTER TABLE public.settlements
ALTER COLUMN expires_at SET DEFAULT (now() + interval '7 days');

-- تحديث السجلات القديمة المعلقة
UPDATE public.settlements
SET expires_at = created_at + interval '7 days'
WHERE status = 'pending' AND expires_at IS NULL;
```

### ب) تحديث `get_group_balance` لاحتساب التسويات المنتهية
تعديل شرط الفلتر من `status = 'confirmed'` إلى:
```sql
AND (s.status = 'confirmed'
     OR (s.status = 'pending' AND s.expires_at IS NOT NULL AND s.expires_at <= now()))
```
هذا يضمن أن التسويات المنتهية تُحتسب في الرصيد فوراً حتى بدون cron.

### ج) دالة التأكيد التلقائي (اختياري — تنظيف)
```sql
CREATE OR REPLACE FUNCTION public.auto_confirm_expired_settlements()
RETURNS integer AS $$
DECLARE affected integer;
BEGIN
  UPDATE public.settlements
  SET status = 'confirmed', confirmed_at = now()
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at <= now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### د) Cron Job (عبر SQL Insert — ليس migration)
جدولة `auto_confirm_expired_settlements()` كل ساعة عبر `pg_cron` + `pg_net`.

---

## 2. `GroupSettlementDialog.tsx` — إرسال إشعار للمستلم

بعد إدراج التسويات بنجاح (سطر ~206)، إضافة:
```typescript
// إرسال إشعار لكل مستلم
for (const s of insertedSettlements) {
  await supabase.from("notifications").insert({
    user_id: s.to_user_id,
    type: "settlement_pending",
    payload: {
      group_name: groupName,
      group_id: groupId,
      settlement_id: s.id,
      amount: s.amount,
      currency: groupCurrency,
      sender_name: formatName(currentUserId!, profiles),
    }
  });
}
```
يحتاج تمرير `groupName` كـ prop جديد للمكون.

---

## 3. `BalanceDashboard.tsx` — بانر التسويات المعلقة + رصيد متوقع

### أ) بانر أعلى الـ Tabs
حساب التسويات المعلقة الموجهة للمستخدم الحالي وعرض بانر:
```
⏳ لديك X تسوية بانتظار تأكيدك (المبلغ: Y ر.س)
   سيتم التأكيد تلقائياً خلال Z أيام  |  [عرض في السجل]
```

### ب) رصيد متوقع في بطاقة "رصيدي الصافي"
سطر إضافي يعرض الرصيد بعد احتساب التسويات المعلقة:
```
رصيدي الصافي: -90.43 ر.س
(بعد التسويات المعلقة: 0.00 ر.س)
```

---

## 4. `SettlementAnnouncementCard.tsx` — عرض المدة المتبقية

إضافة `expires_at` للـ settlement interface وعرض العد التنازلي:
```
⏳ تأكيد تلقائي خلال 5 أيام
```
أسفل حالة "بانتظار التأكيد" في بطاقة الدردشة.

---

## 5. `ConfirmSettlementDialog.tsx` — ملاحظة التأكيد التلقائي

إضافة تنبيه أسفل تفاصيل التسوية:
```
ℹ️ سيتم التأكيد تلقائياً بعد 7 أيام في حال عدم اتخاذ إجراء
```

---

## 6. i18n — ترجمات جديدة

### `ar/notifications.json` و `en/notifications.json`
إضافة `settlement_pending` في types, titles, descriptions.

### `ar/groups.json` و `en/groups.json`
```json
"auto_confirm_note": "سيتم التأكيد تلقائياً خلال {{days}} أيام",
"auto_confirm_info": "سيتم التأكيد تلقائياً بعد 7 أيام في حال عدم اتخاذ إجراء",
"pending_banner": "لديك {{count}} تسوية بانتظار تأكيدك",
"pending_banner_amount": "المبلغ الإجمالي: {{amount}} {{currency}}",
"expected_balance": "بعد التسويات المعلقة",
"auto_confirmed": "تم التأكيد تلقائياً"
```

---

## 7. `NotificationBell.tsx` و `Notifications.tsx` — دعم النوع الجديد

- إضافة `settlement_pending` في `handleNotificationClick` → ينقل لصفحة المجموعة
- إضافة في `getNotificationText` و `getNotificationIcon` (أيقونة: 💸)

---

## 8. `useGroupData.ts` — جلب `expires_at`

إضافة `expires_at` في الـ select عند جلب settlements لتمريره للمكونات.

---

## الملفات المتأثرة

| الملف | التغيير |
|---|---|
| Migration جديد | عمود `expires_at` + تحديث `get_group_balance` + دالة auto-confirm |
| SQL Insert (cron) | جدولة `pg_cron` كل ساعة |
| `GroupSettlementDialog.tsx` | إرسال notification + تمرير groupName |
| `BalanceDashboard.tsx` | بانر المعلقة + رصيد متوقع |
| `SettlementAnnouncementCard.tsx` | عد تنازلي |
| `ConfirmSettlementDialog.tsx` | ملاحظة التأكيد التلقائي |
| `useGroupData.ts` | جلب `expires_at` |
| `NotificationBell.tsx` | دعم `settlement_pending` |
| `Notifications.tsx` | دعم `settlement_pending` |
| `ar/notifications.json` + `en/notifications.json` | ترجمات الإشعار الجديد |
| `ar/groups.json` + `en/groups.json` | ترجمات البانر والتأكيد التلقائي |

