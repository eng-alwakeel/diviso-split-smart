

# إزالة بادج الخطة من قائمة الأعضاء وتحسين ترتيب البادجات

## المشكلة
في `MemberCard.tsx`، يتم تمرير `showPlanBadge={true}` و `planConfig` إلى `UserDisplayWithBadges`، مما يعرض بادج FREE/PRO بجانب كل عضو في قائمة الأعضاء وهو غير مطلوب.

## التغييرات

### 1. `src/components/group/MemberCard.tsx`
- تغيير `showPlanBadge={true}` إلى `showPlanBadge={false}` (سطر 182)
- حذف تمرير `planConfig` (سطر 184) لأنه لم يعد مستخدما هنا
- نقل بادج "أنت" وبادج الدور إلى نفس صف البادجات داخل `UserDisplayWithBadges` لتوحيد الترتيب وتقليل الفوضى البصرية

### 2. ترتيب البادجات النهائي في قائمة الأعضاء
1. **FoundingBadge** (ذهبي، مثل #90) -- يظهر تلقائيا من `UserDisplayWithBadges`
2. **Role badge** (مالك/مدير) -- من `getRoleBadge()`
3. **"أنت"** badge -- إذا كان العضو هو المستخدم الحالي

لا يظهر بادج الخطة (FREE/PRO) ولا بادج Admin (الإدارة العامة للتطبيق).

### الملفات المتأثرة

| الملف | التغيير |
|---|---|
| `src/components/group/MemberCard.tsx` | `showPlanBadge={false}` وحذف `planConfig` prop |

تغيير بسيط في سطرين فقط. باقي المنطق (FoundingBadge، Role badge، "أنت") يعمل بالفعل بشكل صحيح.
