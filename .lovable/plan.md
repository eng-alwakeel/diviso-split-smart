
المشكلة ما زالت موجودة لأن الـ crash الحالي ليس من نفس المكان الذي اتصلّح سابقًا في `GroupDetails`، بل من مسار مختلف داخل حوار التسويات.

تشخيص دقيق بناءً على السجلات:
- الخطأ الحالي: `null is not an object (evaluating 'id.slice')`
- المصدر المؤكد من stack trace: `src/components/group/GroupSettlementDialog.tsx` عند `formatName` (حوالي السطر 65-68).
- السبب: `members` تحتوي عضوًا `user_id = null` (عضو دعوة جوال pending)، بينما `GroupSettlementDialog` يفترض أن `user_id` دائمًا string ويستدعي `id.slice(...)`.

Do I know what the issue is? نعم.

النطاق المتأثر فعليًا:
1) `GroupSettlementDialog.tsx`
- `MemberRow` معرفها الحالي: `user_id: string` (غير صحيح مع pending members).
- `formatName(id)` يستدعي `id.slice` بدون null-guard.
- قائمة `SelectItem` تبني `value={m.user_id}` حتى لو null (مخاطرة إضافية).

2) `GroupDetails.tsx` (تحصين إضافي مطلوب)
- ما زالت هناك خرائط أعضاء على `members` كلها في تبويب الأعضاء/التقييمات قد تمرر عناصر null user_id إلى مكونات أخرى.
- حوار التسوية يتم تمرير `members={members}` مباشرة بدون فلترة.
- `key={member.user_id}` قد يصبح null.

خطة التنفيذ المقترحة (مباشرة ومحددة):

المرحلة 1 — Hotfix يمنع التعطل فورًا (الأولوية القصوى)
- في `src/components/group/GroupSettlementDialog.tsx`:
  1. تعديل type:
     - `MemberRow.user_id` من `string` إلى `string | null`.
  2. تعديل `formatName` ليكون null-safe:
     - يقبل `id?: string | null`.
     - fallback: `"عضو معلق"` بدل `slice` عند غياب id.
  3. فلترة المستلمين في الـ Select:
     - الاعتماد على `members.filter(m => !!m.user_id && m.user_id !== currentUserId)`.
     - داخل map استخدام `const uid = m.user_id!` بعد guard فقط.
  4. ضمان أن `rows.to_user_id` لا يستقبل null بأي مسار.

المرحلة 2 — منع تكرار نفس النوع من الأخطاء في الصفحة
- في `src/pages/GroupDetails.tsx`:
  1. إنشاء قائمة مشتقة موحدة:
     - `const registeredMembers = useMemo(() => members.filter(m => !!m.user_id), [members])`
  2. تمرير `registeredMembers` بدل `members` إلى:
     - `GroupSettlementDialog`
     - `PendingRatingsNotification` (أو على الأقل فلترة قبل map)
     - تبويب `MemberCard` الذي يعتمد memberId حقيقي.
  3. إصلاح keys:
     - استخدام `key={member.user_id ?? \`pending-\${index}\`}` في أي map قد يحتوي pending.

المرحلة 3 — تحصين الاتساق النوعي (Type-level hardening)
- توحيد الواجهات التي تستهلك أعضاء المجموعة بحيث تعكس الواقع:
  - أعضاء مسجلون: `user_id: string`
  - أعضاء pending/invited: `user_id: null`
- حيث يلزم، الفصل بين القائمتين:
  - قائمة “registered” للعمليات المالية/التقييم/الملفات الشخصية.
  - قائمة “pending” للعرض فقط.

المرحلة 4 — تحقق قبول الإصلاح (Regression + scenario test)
- إعادة اختبار المجموعة المتأثرة `/group/2600b96e-...`:
  1. فتح الصفحة بدون ظهور `PageErrorBoundary`.
  2. فتح حوار “إضافة تسوية” بدون crash.
  3. التأكد أن عضو pending لا يظهر كمستلم تسوية.
  4. تبويب الأعضاء والتقييمات يعمل بدون أخطاء runtime.
- اختبار مجموعة عادية (كل users مسجلين):
  - لا تغيّر سلوكي في التسويات أو عرض الأعضاء.

ملاحظات هندسية مهمة:
- المشكلة ليست من قاعدة البيانات أو RLS هنا؛ البيانات صحيحة لكن الواجهة لا تتعامل مع `null user_id` في كل المسارات.
- الإصلاح السابق حل نقطة (Dice) فقط، لكن `GroupSettlementDialog` بقي بنفس الفرضية القديمة.
- أفضل نمط مستقبلي: “لا تمرر أعضاء pending لأي مكوّن يتطلب user_id فعلي”.
