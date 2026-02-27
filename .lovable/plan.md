
# إصلاح تأخر تحديث صلاحيات العضو في المجموعة

## المشكلة الجذرية

عند تغيير صلاحيات عضو، الكود يستدعي `refetch` (وهو `load`) لكن `load` يتحقق من الكاش أولاً (سطر 124 في `useGroupData.ts`) ويعيد البيانات القديمة بدون إعادة الجلب من قاعدة البيانات. بالإضافة إلى ذلك، لا يوجد listener للتغييرات في جدول `group_members`.

## الحل (تغييران)

### 1. استخدام `forceRefresh` بدل `refetch` في صفحة المجموعة

في `src/pages/GroupDetails.tsx`:
- تمرير `forceRefresh` (الذي يمسح الكاش ثم يعيد الجلب) بدل `refetch` كـ `onMemberRemoved` للـ `MemberCard`
- هذا يضمن أن أي تغيير في الصلاحيات يمسح الكاش ويجلب البيانات الجديدة فوراً

### 2. إضافة realtime listener لجدول `group_members`

في `src/hooks/useGroupData.ts`:
- إضافة قناة جديدة تستمع لتغييرات جدول `group_members` (مثل قنوات expenses و settlements الموجودة)
- عند أي تغيير (INSERT, UPDATE, DELETE) في أعضاء المجموعة، يمسح الكاش ويعيد الجلب تلقائياً
- هذا يضمن التحديث الفوري حتى لو فتح المستخدم نفس المجموعة من جهاز آخر

## التفاصيل التقنية

### الملف 1: `src/pages/GroupDetails.tsx`
- تغيير `onMemberRemoved={refetch}` إلى `onMemberRemoved={forceRefresh}` في مكون `MemberCard`

### الملف 2: `src/hooks/useGroupData.ts`
- إضافة قناة realtime جديدة `group_members_${groupId}` تستمع لتغييرات `group_members` بنفس نمط القنوات الموجودة
- إضافة `supabase.removeChannel(membersChannel)` في cleanup

## النتيجة
- تحديث فوري للصلاحيات بدون الحاجة للخروج من المجموعة
- تحديث تلقائي عبر الـ realtime إذا تغيرت الصلاحيات من مكان آخر
