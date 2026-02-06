
# خطة التنفيذ: Phase 1.1 - Profile Foundation inside Groups

## نظرة عامة

تنفيذ طبقة بروفايل داخلية للمجموعات لبناء الثقة بين الأعضاء، مع الالتزام الكامل بعدم تحويل Diviso إلى شبكة اجتماعية.

---

## المرحلة 1: تحديثات قاعدة البيانات

### 1.1 إضافة أعمدة جديدة لجدول `profiles`

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS bio text CHECK (char_length(bio) <= 120);
```

### 1.2 إضافة عمود `status` لجدول `groups`

```sql
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' 
CHECK (status IN ('active', 'closed'));
```

### 1.3 إنشاء جدول `member_ratings` للتقييمات

```sql
CREATE TABLE public.member_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  rater_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rated_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  financial_commitment integer CHECK (financial_commitment BETWEEN 1 AND 5) NOT NULL,
  time_commitment integer CHECK (time_commitment BETWEEN 1 AND 5) NOT NULL,
  cooperation integer CHECK (cooperation BETWEEN 1 AND 5) NOT NULL,
  internal_comment text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(group_id, rater_id, rated_user_id)
);
```

### 1.4 إنشاء جدول `user_reputation` للسمعة

```sql
CREATE TABLE public.user_reputation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  average_rating decimal(3,2) DEFAULT 0,
  total_ratings integer DEFAULT 0,
  completed_activities integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now()
);
```

### 1.5 سياسات RLS للأمان

```sql
-- member_ratings: فقط أعضاء المجموعة المغلقة يمكنهم التقييم
ALTER TABLE public.member_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can rate after group closed"
ON public.member_ratings FOR INSERT
WITH CHECK (
  auth.uid() = rater_id AND
  rater_id != rated_user_id AND
  EXISTS (
    SELECT 1 FROM groups g 
    WHERE g.id = group_id AND g.status = 'closed'
  ) AND
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = member_ratings.group_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their ratings"
ON public.member_ratings FOR SELECT
USING (rated_user_id = auth.uid() OR rater_id = auth.uid());

-- user_reputation: الكل يمكنه القراءة
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reputation"
ON public.user_reputation FOR SELECT USING (true);
```

### 1.6 Trigger لتحديث السمعة تلقائياً

```sql
CREATE OR REPLACE FUNCTION update_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_reputation (user_id, average_rating, total_ratings)
  VALUES (
    NEW.rated_user_id,
    (NEW.financial_commitment + NEW.time_commitment + NEW.cooperation) / 3.0,
    1
  )
  ON CONFLICT (user_id) DO UPDATE SET
    average_rating = (
      (user_reputation.average_rating * user_reputation.total_ratings) + 
      ((NEW.financial_commitment + NEW.time_commitment + NEW.cooperation) / 3.0)
    ) / (user_reputation.total_ratings + 1),
    total_ratings = user_reputation.total_ratings + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_rating_created
AFTER INSERT ON member_ratings
FOR EACH ROW EXECUTE FUNCTION update_user_reputation();
```

---

## المرحلة 2: تحديثات الواجهة الخلفية (Hooks)

### 2.1 تحديث `src/hooks/useGroupData.ts`
- إضافة حقل `status` للمجموعة
- إضافة دالة `closeGroup` لإغلاق المجموعة

### 2.2 إنشاء `src/hooks/useMemberRatings.ts`
- `submitRating`: تقديم تقييم لعضو
- `hasRatedMember`: التحقق من تقييم سابق
- `getPendingRatings`: قائمة الأعضاء غير المقيّمين

### 2.3 إنشاء `src/hooks/useUserReputation.ts`
- `getReputation`: جلب سمعة المستخدم
- `calculateProfileCompletion`: حساب نسبة اكتمال البروفايل

---

## المرحلة 3: مكونات الواجهة الأمامية

### 3.1 تحديث صفحة الإعدادات `ProfileTab.tsx`
- إضافة حقل **المدينة** (اختياري)
- إضافة حقل **النبذة** (اختياري - 120 حرف)

### 3.2 إنشاء `src/components/profile/ProfileCompletionSheet.tsx`
- Bottom Sheet يظهر عند إنشاء/انضمام للمجموعة
- يعرض نسبة الاكتمال: "بروفايلك مكتمل 40%"
- زر "أكمل الآن" للانتقال للإعدادات

### 3.3 إنشاء `src/components/group/MemberMiniProfile.tsx`
- Dialog/Sheet يعرض:
  - الصورة والاسم
  - المدينة (إن وجدت)
  - النبذة (إن وجدت)
  - متوسط التقييم
  - عدد الأنشطة المكتملة

### 3.4 تحديث `src/components/group/MemberCard.tsx`
- إضافة onClick لفتح MemberMiniProfile
- عرض مؤشر السمعة (نجوم صغيرة)

### 3.5 إنشاء `src/components/group/CloseGroupDialog.tsx`
- حوار تأكيد إغلاق المجموعة
- يظهر فقط للمالك/Admin
- يوضح أن الإغلاق يمنع إضافة مصاريف جديدة

### 3.6 إنشاء `src/components/group/RatingSheet.tsx`
- Bottom Sheet للتقييم بعد إغلاق المجموعة
- 3 معايير: التزام مالي، التزام بالوقت، تعاون (1-5 نجوم)
- تعليق اختياري (داخلي)
- يظهر تلقائياً عند دخول مجموعة مغلقة

### 3.7 إنشاء `src/components/group/PendingRatingsNotification.tsx`
- إشعار يظهر إذا كان هناك أعضاء لم يتم تقييمهم
- يوجه للتقييم

---

## المرحلة 4: تحديث الصفحات

### 4.1 تحديث `src/pages/GroupDetails.tsx`
- إضافة زر "إنهاء النشاط" في Header (للمالك/Admin فقط)
- إضافة حالة `isGroupClosed` للتحكم في الوظائف
- تعطيل إضافة المصاريف إذا المجموعة مغلقة
- عرض PendingRatingsNotification للمجموعات المغلقة

### 4.2 تحديث `src/pages/CreateGroup.tsx`
- عرض ProfileCompletionSheet بعد إنشاء المجموعة

### 4.3 تحديث `src/pages/GroupInvite.tsx`
- عرض ProfileCompletionSheet بعد الانضمام للمجموعة

---

## المرحلة 5: حساب نسبة اكتمال البروفايل

### المنطق (Frontend فقط):

```typescript
const calculateProfileCompletion = (profile) => {
  let score = 0;
  const total = 4; // عدد الحقول
  
  if (profile.display_name || profile.name) score++;
  if (profile.avatar_url) score++;
  if (profile.city) score++;
  if (profile.bio) score++;
  
  return Math.round((score / total) * 100);
};
```

---

## هيكل الملفات الجديدة

```
src/
├── components/
│   ├── group/
│   │   ├── CloseGroupDialog.tsx          (جديد)
│   │   ├── MemberMiniProfile.tsx         (جديد)
│   │   ├── RatingSheet.tsx               (جديد)
│   │   ├── PendingRatingsNotification.tsx (جديد)
│   │   └── MemberCard.tsx                (تحديث)
│   └── profile/
│       └── ProfileCompletionSheet.tsx    (جديد)
├── hooks/
│   ├── useMemberRatings.ts               (جديد)
│   ├── useUserReputation.ts              (جديد)
│   └── useGroupData.ts                   (تحديث)
└── pages/
    ├── GroupDetails.tsx                  (تحديث)
    ├── CreateGroup.tsx                   (تحديث)
    └── GroupInvite.tsx                   (تحديث)
```

---

## الجدول الزمني المقترح

| المرحلة | الوصف | الأولوية |
|---------|-------|----------|
| 1 | تحديثات قاعدة البيانات | عالية |
| 2 | Hooks الخلفية | عالية |
| 3.1-3.2 | ProfileTab + CompletionSheet | عالية |
| 3.3-3.4 | MiniProfile + MemberCard | متوسطة |
| 3.5-3.7 | CloseGroup + Rating | متوسطة |
| 4 | تحديث الصفحات | عالية |
| 5 | اختبار شامل | عالية |

---

## ملاحظات أمنية مهمة

1. **RLS صارمة**: البروفايل يُرى فقط من أعضاء نفس المجموعة
2. **لا API عامة**: لا يوجد endpoint لجلب بروفايل بدون سياق مجموعة
3. **التقييم محمي**: فقط بعد إغلاق المجموعة، ولا يمكن تقييم النفس
4. **التعليقات داخلية**: لا تظهر للمستخدمين، فقط للتحليل

---

## ما لن يتم تنفيذه (حسب المطلوب)

- لا بروفايل عام
- لا بحث عن أشخاص
- لا متابعة (Follow)
- لا اهتمامات
- لا ربط سوشيال ميديا
- لا نفاذ
- لا رابط بروفايل قابل للمشاركة
