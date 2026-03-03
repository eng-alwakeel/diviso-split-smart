

# المراحل 2-4: إكمال إعادة بناء صفحة المجموعة

## ملخص الوضع الحالي (المرحلة 1 مكتملة ✅)
- Header + Compact Summary + Settlement Progress Bar + Dynamic Status Banner
- الدردشة في قلب الصفحة مع فلترة (الكل/مالي/رسائل)
- 4 حالات للمجموعة (active/finished/balanced/closed)
- `FinishGroupDialog` + `useGroupStatus` محدّث
- Settlements table يدعم `status` (pending/confirmed/disputed) + `confirmed_by` + `dispute_reason`
- `member_ratings` table موجود في DB
- `ConfirmSettlementDialog` موجود ويعمل

---

## المرحلة 2: التسويات + التأكيد المزدوج + طلب سداد واتساب

### 2A. بطاقات إعلان الدفع في الدردشة
- تعديل `GroupChat.tsx`: عند إنشاء settlement جديدة، نُدخل رسالة في `messages` بنوع `settlement_announcement` مع `settlement_id`
- إنشاء `SettlementAnnouncementCard.tsx`: بطاقة تظهر في الدردشة "Saud أعلن دفع 120 ريال لـ Ibrahim" + زر "تأكيد الاستلام" (يظهر فقط للمستلم `to_user_id`)
- عند الضغط على "تأكيد الاستلام" → يفتح `ConfirmSettlementDialog` الموجود

### 2B. ربط الإعلان بالدردشة تلقائياً
- تعديل `GroupSettlementDialog.tsx`: بعد نجاح `insert` في settlements، ندخل رسالة تلقائية في `messages` table بنوع `settlement_announcement`

### 2C. طلب سداد عبر واتساب
- إنشاء `RequestPaymentDialog.tsx`: يعرض قائمة المدينين مع المبالغ
- زر "إرسال طلب" بجانب كل مدين → يفتح واتساب برسالة منسقة تتضمن المبلغ ورابط التطبيق
- ربطه بزر "طلب سداد" في `GroupStatusBanner`

### 2D. تذكير المدينين بعد 48 ساعة
- تعديل الـ Banner الحالي: إذا مضى 48 ساعة على settlement بدون تأكيد، يظهر زر "إرسال تذكير"
- يستخدم `notifySettlementReminder` الموجود + خيار واتساب

### DB Migration
- تعديل `messages` table: إضافة `settlement_id` (uuid, nullable, FK → settlements)

### الملفات المتأثرة
| الملف | التغيير |
|-------|---------|
| DB Migration | إضافة `settlement_id` لـ messages |
| `src/components/group/GroupChat.tsx` | عرض بطاقات settlement في الدردشة |
| `src/components/group/SettlementAnnouncementCard.tsx` | **جديد** |
| `src/components/group/GroupSettlementDialog.tsx` | إدخال رسالة تلقائية بعد التسوية |
| `src/components/group/RequestPaymentDialog.tsx` | **جديد** — طلب سداد واتساب |
| `src/components/group/GroupStatusBanner.tsx` | ربط زر "طلب سداد" |
| `src/pages/GroupDetails.tsx` | ربط RequestPaymentDialog |

---

## المرحلة 3: نظام السمعة + الملخص النهائي

### 3A. Badges داخل المجموعة
- إنشاء `GroupMemberBadges.tsx`: يحسب لكل عضو Badge واحدة فقط:
  - 🟢 **سريع السداد**: أقل متوسط وقت بين إنشاء settlement وتأكيدها
  - 💰 **أكثر مساهمة**: أعلى `amount_paid` في الـ balances
  - 🎯 **روح المجموعة**: أكثر رسائل في الدردشة
- يظهر في tab الأعضاء بجانب كل عضو
- محسوب client-side من البيانات الموجودة (لا حاجة لـ DB جديد)

### 3B. ملخص نهائي قابل للمشاركة
- إنشاء `TripSummaryCard.tsx`: بطاقة تظهر بعد الإغلاق النهائي
  - إجمالي المصاريف، أكثر شخص دفع، أسرع سداد، عدد العمليات، عدد مرات النرد
- إنشاء `TripSummarySheet.tsx`: Bottom Sheet يعرض الملخص مع زر مشاركة (صورة + نص واتساب)
- تعديل `CloseGroupDialog.tsx`: بعد الإغلاق الناجح → يفتح الملخص تلقائياً
- تعديل `GroupStatusBanner` (حالة closed): يضيف زر "عرض الملخص"

### الملفات المتأثرة
| الملف | التغيير |
|-------|---------|
| `src/components/group/GroupMemberBadges.tsx` | **جديد** — حساب + عرض badges |
| `src/components/group/TripSummaryCard.tsx` | **جديد** — بطاقة الملخص |
| `src/components/group/TripSummarySheet.tsx` | **جديد** — Sheet مشاركة |
| `src/components/group/MemberCard.tsx` | إضافة Badge السمعة |
| `src/components/group/CloseGroupDialog.tsx` | فتح الملخص بعد الإغلاق |
| `src/components/group/GroupStatusBanner.tsx` | زر عرض الملخص |
| `src/pages/GroupDetails.tsx` | ربط الملخص و badges |

---

## المرحلة 4: الأرصدة السابقة + التذكيرات + إدارة الأعضاء

### 4A. إضافة أرصدة سابقة
- إنشاء `PreviousBalanceSheet.tsx`: Bottom Sheet لإضافة رصيد سابق
  - حقول: المدين، الدائن، المبلغ، وصف، تاريخ (اختياري)
  - متاح للأدمن فقط
- يحفظ كـ settlement خاصة بنوع `legacy_balance` أو كـ expense بنوع خاص
- ينشر تلقائياً في الدردشة كبطاقة "رصيد سابق"
- يظهر من قائمة ⋮ للأدمن

### 4B. بطاقة الرصيد السابق في الدردشة
- إنشاء `LegacyBalanceCard.tsx`: بطاقة مالية مميزة "💰 رصيد سابق — Saud مدين لـ Ibrahim بـ 200 ريال (قبل استخدام Diviso)"

### 4C. إدارة الأعضاء غير المنضمين
- تعديل `GroupStatusBanner` أو إنشاء banner ثانوي: إذا يوجد أعضاء pending/invited
  - "Saud لم ينضم بعد" + زر "إعادة دعوة"
- تعديل `PendingMemberCard.tsx`: إضافة زر إعادة الدعوة عبر واتساب

### 4D. تذكيرات ذكية
- إذا عضو لم يسدد بعد 48 ساعة من الإنهاء: يظهر زر "إرسال تذكير" في الدردشة + واتساب
- يستخدم النظام الموجود `notifySettlementReminder`

### DB Migration
- إضافة `settlement_type` (text, default 'normal') لـ settlements table — للتفريق بين التسويات العادية والأرصدة السابقة

### الملفات المتأثرة
| الملف | التغيير |
|-------|---------|
| DB Migration | إضافة `settlement_type` لـ settlements |
| `src/components/group/PreviousBalanceSheet.tsx` | **جديد** |
| `src/components/group/LegacyBalanceCard.tsx` | **جديد** |
| `src/components/group/GroupChat.tsx` | عرض بطاقات الرصيد السابق |
| `src/components/group/PendingMemberCard.tsx` | زر إعادة دعوة واتساب |
| `src/pages/GroupDetails.tsx` | ربط PreviousBalanceSheet + قائمة ⋮ |

---

## ترتيب التنفيذ المقترح

**المرحلة 2 أولاً** (الأهم — التأكيد المزدوج وطلب السداد)
ثم **المرحلة 3** (السمعة + الملخص — تجربة الإغلاق)
ثم **المرحلة 4** (الأرصدة السابقة — ميزة اختيارية)

هل أبدأ بتنفيذ المرحلة 2؟

