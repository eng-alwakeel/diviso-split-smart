

# تحسين تجربة تقييم الأعضاء — Flow متتابع مع فلترة

## التغييرات

### 1. `src/components/group/RatingSheet.tsx` — تحويل لـ Flow متتابع

**تغيير الـ Props** لقبول قائمة أعضاء بدل عضو واحد:
```ts
interface RatingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  members: MemberToRate[];  // قائمة الأعضاء غير المقيّمين
  onAllRated?: () => void;
}
```

**إضافة State داخلي**:
- `currentIndex` — فهرس العضو الحالي
- `completedCount` — عدد المقيّمين
- `allDone` — هل انتهى التقييم

**Progress Indicator** أعلى الشيت:
```
عضو 1 من 4
[========--------] شريط تقدم
```

**بعد الإرسال**:
- إذا فيه أعضاء متبقين → fade/slide للعضو التالي (CSS transition على opacity + translateX)
- إذا انتهوا → عرض شاشة "تم تقييم جميع الأعضاء ✅" مع زر إغلاق

**منع إعادة التقييم**: الأعضاء المقيّمون لا يمررون أصلاً للمكون (الفلترة من الخارج)

### 2. `src/components/group/PendingRatingsNotification.tsx` — تحسين النص

تغيير النص من "X أعضاء لم تقيّمهم" إلى:
```
"تم تقييم {rated} من {total}"
```
مع إضافة حالة فارغة: إذا `pendingCount === 0` وليس loading → عرض "تم تقييم جميع الأعضاء ✅" أو إخفاء

تصدير `pendingIds` عبر callback حتى يستخدمها `GroupDetails` لتمرير الأعضاء المفلترين للـ `RatingSheet`

### 3. `src/pages/GroupDetails.tsx` — ربط الـ Flow

- تغيير `onStartRating` ليجلب الأعضاء غير المقيّمين (`getPendingRatings`) ويمررهم كقائمة للـ `RatingSheet`
- حذف `memberToRate` (عضو واحد) واستبداله بـ `membersToRate` (قائمة)
- تحديث `RatingSheet` props لاستخدام القائمة الجديدة

### 4. UX Animation
- إضافة CSS transition في `RatingSheet`: عند الانتقال للعضو التالي، fade-out ثم fade-in للمحتوى باستخدام `transition-opacity duration-300`

## الملفات المتأثرة
| ملف | تغيير |
|---|---|
| `src/components/group/RatingSheet.tsx` | Flow متتابع + progress + شاشة إتمام |
| `src/components/group/PendingRatingsNotification.tsx` | نص "تم تقييم X من Y" + empty state |
| `src/pages/GroupDetails.tsx` | تمرير قائمة أعضاء مفلترة بدل عضو واحد |

