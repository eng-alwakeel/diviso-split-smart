
# Outstanding Balance Notification -- إشعار المبلغ المستحق (MVP)

## ملخص

إضافة إشعار خاص يُرسل لكل عضو عليه مبلغ مستحق بعد إنشاء أو اعتماد مصروف. يظهر الإشعار داخل التطبيق فقط مع صفحة تفاصيل وزر "تم الدفع".

---

## 1. قاعدة البيانات (Migration)

### جدول جديد: `balance_notifications`

يتتبع حالة الدفع لكل إشعار مستحق بشكل منفصل عن جدول `notifications` العام:

| العمود | النوع | الوصف |
|--------|------|-------|
| `id` | uuid (PK, default gen_random_uuid) | معرف فريد |
| `user_id` | uuid (NOT NULL, FK profiles) | العضو الذي عليه المبلغ |
| `group_id` | uuid (NOT NULL, FK groups) | المجموعة |
| `expense_id` | uuid (NOT NULL, FK expenses) | المصروف |
| `payer_id` | uuid (NOT NULL, FK profiles) | الشخص الذي يجب الدفع له |
| `amount_due` | numeric (NOT NULL) | المبلغ المستحق |
| `currency` | text (NOT NULL, default 'SAR') | العملة |
| `status` | text (NOT NULL, default 'unpaid') | الحالة: `unpaid` / `marked_as_paid` |
| `notification_id` | uuid (FK notifications) | ربط بالإشعار في جدول notifications |
| `created_at` | timestamptz (default now) | تاريخ الإنشاء |
| `updated_at` | timestamptz (default now) | تاريخ التحديث |

- Unique constraint: `(user_id, expense_id)` -- يمنع تكرار الإشعار لنفس العملية
- RLS: SELECT/UPDATE فقط لـ `user_id = auth.uid()`

### RPC جديد: `mark_balance_as_paid`

دالة تستقبل `p_balance_notification_id uuid` وتقوم بـ:
1. التحقق أن `user_id = auth.uid()`
2. تحديث `status` إلى `'marked_as_paid'`
3. أرشفة الإشعار المرتبط في جدول `notifications` (تعيين `archived_at`)
4. إرجاع `true` عند النجاح

### RPC جديد: `get_balance_notification_details`

دالة تستقبل `p_notification_id uuid` وترجع تفاصيل الإشعار مع بيانات المصروف والمجموعة والدافع:

```text
amount_due, currency, status,
expense_description, expense_amount, expense_date,
group_name, group_id,
payer_name, payer_avatar_url
```

---

## 2. منطق إرسال الإشعارات (Frontend)

### تعديل `src/pages/AddExpense.tsx`

بعد حفظ `expense_splits` بنجاح (سطر ~594)، إضافة استدعاء لدالة جديدة `sendBalanceNotifications()`:

```text
// بعد نجاح حفظ الـ splits:
await sendBalanceNotifications(expense, validatedSplits, selectedGroup);
```

الدالة تقوم بـ:
1. لكل split حيث `member_id !== payer_id` (العضو ليس هو الدافع):
   - حساب: `amount_due = share_amount`
2. إدخال سجل في `balance_notifications` لكل عضو مستحق عليه
3. إدخال إشعار في `notifications` بنوع `'balance_due'` لكل عضو
4. ربط الـ `notification_id` بسجل `balance_notifications`

**ملاحظة**: الإشعار يُرسل فقط للأعضاء الذين لم يدفعوا (ليسوا الـ payer).

---

## 3. ملفات جديدة

### `src/components/notifications/BalanceDetailsSheet.tsx`

مكون Drawer/Sheet يُعرض عند الضغط على إشعار `balance_due`:

```text
+------------------------------------------+
|     💸 مبلغ مستحق في مجموعة              |
+------------------------------------------+
|                                          |
|   عليك 45 ريال                           |
|   لصالح: [صورة] أحمد                     |
|   بسبب: عشاء                            |
|   بتاريخ: 5 فبراير 2026                  |
|   المجموعة: رحلة الشباب                  |
|                                          |
|  [====  ✔️ تم الدفع  ====]               |
|                                          |
+------------------------------------------+
```

- يستدعي RPC `get_balance_notification_details` لجلب البيانات
- زر "تم الدفع" يستدعي RPC `mark_balance_as_paid`
- بعد النجاح: Toast تأكيد + إغلاق الـ Sheet + refetch الإشعارات
- حالة `marked_as_paid`: يعرض شارة "تم الإقرار" بدل الزر

### `src/hooks/useBalanceNotification.ts`

Hook بسيط يوفر:
- `getDetails(notificationId)` -- جلب تفاصيل الإشعار
- `markAsPaid(balanceNotificationId)` -- إقرار الدفع
- حالة التحميل

---

## 4. الملفات المعدلة

### `src/hooks/useNotifications.ts`

- إضافة `case 'balance_due'` في `getNotificationDescription()`:
  ```text
  return t('descriptions.balance_due', {
    amount: payload.amount_due,
    currency: payload.currency,
    group: payload.group_name
  });
  ```

### `src/pages/Notifications.tsx`

- إضافة `case 'balance_due'` في `getNotificationIcon()`: return `'💸'`
- إضافة `case 'balance_due'` في `getNotificationText()`
- تعديل `handleNotificationClick()`: عند `balance_due` فتح `BalanceDetailsSheet` بدل التنقل
- إضافة state لـ `selectedBalanceNotification` و `showBalanceSheet`

### `src/components/NotificationBell.tsx`

- إضافة التعامل مع `balance_due` في `handleNotificationClick` -- توجيه لصفحة `/notifications`

### `src/hooks/useGroupNotifications.ts`

- إضافة `'balance_due'` في `GroupNotificationType`
- إضافة دالة `notifyBalanceDue()` لإرسال إشعارات المبلغ المستحق

### `src/i18n/locales/ar/notifications.json`

إضافة:
```text
"types": {
  "balance_due": "💸 عليك {{amount}} {{currency}} في مجموعة {{group}}"
},
"titles": {
  "balance_due": "مبلغ مستحق 💸"
},
"descriptions": {
  "balance_due": "عليك {{amount}} {{currency}} في مجموعة {{group}}"
},
"balance_details": {
  "title": "مبلغ مستحق",
  "amount_label": "عليك",
  "for_label": "لصالح",
  "reason_label": "بسبب",
  "date_label": "بتاريخ",
  "group_label": "المجموعة",
  "mark_paid": "تم الدفع",
  "marking_paid": "جاري التحديث...",
  "paid_success": "تم تسجيل الدفع",
  "paid_success_desc": "تم إقرار الدفع بنجاح",
  "already_paid": "تم الإقرار ✅",
  "view_details": "عرض التفاصيل"
}
```

### `src/i18n/locales/en/notifications.json`

إضافة نفس المفاتيح بالإنجليزية:
```text
"types": {
  "balance_due": "💸 You owe {{amount}} {{currency}} in {{group}}"
},
"titles": {
  "balance_due": "Outstanding Balance 💸"
},
"descriptions": {
  "balance_due": "You owe {{amount}} {{currency}} in {{group}}"
},
"balance_details": {
  "title": "Outstanding Balance",
  "amount_label": "You owe",
  "for_label": "To",
  "reason_label": "For",
  "date_label": "Date",
  "group_label": "Group",
  "mark_paid": "Mark as Paid",
  "marking_paid": "Updating...",
  "paid_success": "Payment Recorded",
  "paid_success_desc": "Payment has been recorded successfully",
  "already_paid": "Paid",
  "view_details": "View Details"
}
```

---

## 5. التفاصيل التقنية

### سلوك إرسال الإشعار

```text
AddExpense: handleSaveExpense()
  --> expense created + splits saved
  --> sendBalanceNotifications():
      --> For each split where member_id != payer_id:
          1. INSERT INTO balance_notifications (user_id, group_id, expense_id, payer_id, amount_due, currency)
             ON CONFLICT (user_id, expense_id) DO NOTHING  -- منع التكرار
          2. INSERT INTO notifications (user_id, type: 'balance_due', payload: {
               amount_due, currency, group_name, group_id,
               expense_id, expense_description, payer_name
             })
          3. UPDATE balance_notifications SET notification_id = <new notification id>
```

### سلوك "تم الدفع"

```text
User clicks "تم الدفع"
  --> useBalanceNotification.markAsPaid(id)
    --> RPC: mark_balance_as_paid(p_balance_notification_id)
      --> UPDATE balance_notifications SET status = 'marked_as_paid'
      --> UPDATE notifications SET archived_at = now() WHERE id = notification_id
    --> Toast: "تم تسجيل الدفع"
    --> Close Sheet
    --> Refetch notifications
```

### منع التكرار

- الـ Unique constraint `(user_id, expense_id)` على `balance_notifications` يمنع إنشاء إشعارين لنفس العملية والعضو
- استخدام `ON CONFLICT DO NOTHING` في الـ INSERT

### صياغة محايدة

- لا نستخدم: "مدين"، "متأخر"، "ديون"
- نستخدم: "عليك مبلغ"، "مبلغ مستحق"، "لصالح"

---

## 6. ملخص الملفات

| الملف | العملية | الأولوية |
|-------|---------|---------|
| Migration: جدول `balance_notifications` + RPCs | إنشاء جديد | حرجة |
| `src/hooks/useBalanceNotification.ts` | إنشاء جديد | حرجة |
| `src/components/notifications/BalanceDetailsSheet.tsx` | إنشاء جديد | حرجة |
| `src/pages/AddExpense.tsx` | إضافة منطق الإشعار | حرجة |
| `src/hooks/useNotifications.ts` | إضافة case جديد | حرجة |
| `src/pages/Notifications.tsx` | إضافة عرض + Sheet | حرجة |
| `src/components/NotificationBell.tsx` | إضافة case جديد | مهمة |
| `src/hooks/useGroupNotifications.ts` | إضافة نوع جديد | مهمة |
| `src/i18n/locales/ar/notifications.json` | إضافة مفاتيح | مهمة |
| `src/i18n/locales/en/notifications.json` | إضافة مفاتيح | مهمة |

## 7. ما لا يشمله التنفيذ

- لا دفع إلكتروني
- لا تأكيد من الطرف الآخر (الدافع)
- لا نزاعات
- لا Push Notifications
- لا تنبيه متكرر -- إشعار واحد فقط لكل عملية
