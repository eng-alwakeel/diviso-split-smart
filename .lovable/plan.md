

# مشاركة/طباعة التسويات المقترحة + إشعار "عليك مبلغ" + إنهاء الرحلة

## ملخص
3 ميزات مرتبطة بتبويب التسويات داخل المجموعة:

1. **مشاركة/طباعة التسويات المقترحة كصورة PDF-like** مع watermark "Diviso"
2. **إشعار "عليك مبلغ ارجو تسويته"** لكل مدين من التسويات المقترحة
3. **إنهاء الرحلة** (إغلاق المجموعة لمنع مصاريف جديدة) — موجود أصلاً (`closeGroup`)، نضيف زر واضح في تبويب التسويات

---

## A) مشاركة/طباعة التسويات المقترحة

### مكون جديد: `SettlementShareCard.tsx`

**الملف:** `src/components/group/SettlementShareCard.tsx`

مكون يعرض التسويات المقترحة بتنسيق "كرت قابل للمشاركة":
- عنوان: "التسويات المقترحة" + اسم المجموعة
- قائمة التسويات (من → إلى → المبلغ) بنفس الشكل الحالي في `AllMembersBalances`
- Watermark "Diviso" شفاف في الخلفية (نمط `ReportWatermark` الموجود)
- تاريخ التصدير

**أزرار المشاركة** (تضاف في `AllMembersBalances.tsx` أو `BalanceDashboard.tsx`):
- زر "📤 مشاركة" → يستخدم `html2canvas` لتحويل الكرت إلى صورة + مشاركة عبر Web Share API / Capacitor Share
- زر "🖨️ طباعة" → `window.print()` بنفس نمط `GroupReportDialog`
- زر "📋 نسخ" → نسخ نص التسويات المقترحة (نص عادي)

**تقنياً:**
- تثبيت `html2canvas` (أو استخدام DOM-to-image pattern بسيط)
- إنشاء div مخفي بتنسيق جميل → تحويله لصورة → مشاركة
- بديل أبسط: بناء نص formatted + مشاركة كنص (مثل `ShareDiceResult`) مع رابط التطبيق

**النهج المختار (الأبسط والأفعل):**
- نسخة نصية جاهزة للمشاركة (WhatsApp/Social) مع watermark نصي "Diviso"
- نسخة طباعة عبر `window.print()` مع CSS print styles
- استخدام Web Share API / Capacitor Share للمشاركة الأصلية

### تعديل: `AllMembersBalances.tsx`
- إضافة أزرار "مشاركة" و"طباعة" أعلى قسم التسويات المقترحة
- إضافة زر "تذكير المدينين" (إشعارات)

---

## B) إشعار "عليك مبلغ ارجو تسويته"

### تعديل: `AllMembersBalances.tsx` أو `BalanceDashboard.tsx`

إضافة زر "🔔 تذكير" بجانب كل تسوية مقترحة حيث المستخدم الحالي هو الدائن (creditor):
- عند الضغط → إرسال إشعار من نوع `balance_due` للمدين
- الإشعار يحتوي: اسم المجموعة + المبلغ + رسالة "عليك مبلغ X ارجو تسويته"
- استخدام `useGroupNotifications.sendNotifications()` الموجود أو `useBalanceNotification.sendBalanceNotifications()` 

**منطق الإشعار:**
- إدراج صف في جدول `notifications` بنوع `settlement_reminder` (نوع جديد)
- أو إعادة استخدام نوع `balance_due` مع payload مختلف
- زر التذكير يظهر فقط إذا المستخدم الحالي هو الدائن (الشخص الذي ينتظر المبلغ)
- بعد الإرسال: toast نجاح + تعطيل الزر مؤقتاً

### تعديل: `useGroupNotifications.ts`
- إضافة دالة `notifySettlementReminder(groupId, groupName, debtorUserId, amount, currency)`

### تعديل i18n:
- إضافة مفاتيح ترجمة للتذكير في `notifications.json` و `groups.json`

---

## C) إنهاء الرحلة — زر واضح في التسويات

### تعديل: `BalanceDashboard.tsx` أو `GroupDetails.tsx` (تبويب التسويات)

الميزة موجودة أصلاً (`closeGroup` في `useGroupStatus` + `CloseGroupDialog`). المطلوب:
- إضافة زر "🏁 إنهاء الرحلة" بارز في أعلى أو أسفل تبويب التسويات
- يظهر فقط لمالك/مدير المجموعة
- عند الضغط → يفتح `CloseGroupDialog` الموجود
- بعد الإغلاق: تُمنع إضافة مصاريف جديدة (السلوك الحالي) ويمكن فقط عمل تسويات

---

## D) الملفات المتأثرة

| الملف | نوع التغيير |
|-------|-------------|
| `src/components/group/SettlementShareCard.tsx` | **جديد** — كرت المشاركة/الطباعة |
| `src/components/group/AllMembersBalances.tsx` | تعديل — أزرار مشاركة + تذكير |
| `src/components/group/BalanceDashboard.tsx` | تعديل — تمرير props + زر إنهاء الرحلة |
| `src/hooks/useGroupNotifications.ts` | تعديل — إضافة `notifySettlementReminder` |
| `src/pages/GroupDetails.tsx` | تعديل — تمرير props جديدة لـ BalanceDashboard |
| `src/i18n/locales/ar/groups.json` | تعديل — مفاتيح ترجمة |
| `src/i18n/locales/en/groups.json` | تعديل — مفاتيح ترجمة |
| `src/i18n/locales/ar/notifications.json` | تعديل — نوع إشعار جديد |
| `src/i18n/locales/en/notifications.json` | تعديل — نوع إشعار جديد |

---

## E) القيود المُلتزم بها
- لا تغيير في منطق الحسابات
- لا API calls جديدة (الإشعارات تستخدم جدول notifications الموجود)
- RTL صحيح 100%
- Watermark "Diviso" في المشاركة/الطباعة
- المشاركة تعمل على الويب (Web Share API) وعلى Native (Capacitor Share)

