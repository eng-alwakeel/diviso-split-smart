
# خطة إضافة الرقم التسلسلي في الصفحة الرئيسية والهيدر

## المشكلة المكتشفة
الكود تم إضافته في ملف `OptimizedDashboard.tsx` لكن الصفحة الفعلية المستخدمة هي `Dashboard.tsx` (المُحمّلة من route `/dashboard` في `App.tsx`).

## التغييرات المطلوبة

### 1. إضافة الرقم التسلسلي في الهيدر العلوي (AppHeader)
**الملف:** `src/components/AppHeader.tsx`

**التغييرات:**
- إضافة استيراد `useFoundingUser` و `UserNumberBadge`
- جلب `userId` من الجلسة الحالية
- عرض الشارة بجانب أيقونة الإشعارات في الجانب الأيمن

**الموقع:** بين `CreditBalance` و `NotificationBell`

### 2. إضافة الرقم التسلسلي في صفحة الداشبورد الصحيحة
**الملف:** `src/pages/Dashboard.tsx`

**التغييرات:**
- إضافة استيراد `useFoundingUser` و `UserNumberBadge`
- إضافة query لجلب `userId` من الجلسة
- عرض الشارة بجانب عبارة "مرحباً بك!"

**الموقع:** بجانب العنوان في قسم الترحيب (Welcome Section)

---

## الشكل النهائي

### في الهيدر (جميع الصفحات)
```
+-------------------------------------------------------+
|  [👤] [شارات الأدوار]   [شعار]   [546] [🔔] [#45]   |
+-------------------------------------------------------+
```

### في الداشبورد
```
+------------------------------------------+
|  مرحباً بك!  [#45]           [المساعدة] |
|  إدارة ذكية للمصاريف المشتركة           |
+------------------------------------------+
```

---

## الملفات المتأثرة

| الملف | نوع التغيير |
|-------|-------------|
| `src/components/AppHeader.tsx` | إضافة عرض الشارة في الهيدر |
| `src/pages/Dashboard.tsx` | إضافة عرض الشارة بجانب الترحيب |

---

## التفاصيل التقنية

### في AppHeader.tsx
```tsx
// إضافة الاستيرادات
import { useFoundingUser } from "@/hooks/useFoundingUser";
import { UserNumberBadge } from "@/components/ui/user-number-badge";
import { useQuery } from "@tanstack/react-query";

// داخل المكون - جلب userId
const { data: userId } = useQuery({
  queryKey: ['current-user-id'],
  queryFn: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  },
  staleTime: Infinity,
  gcTime: Infinity,
  enabled: !minimal,
});

const { userNumber, isFoundingUser } = useFoundingUser(userId ?? undefined);

// في منطقة العرض
{!minimal && userNumber && (
  <UserNumberBadge 
    userNumber={userNumber} 
    isFoundingUser={isFoundingUser} 
    size="sm"
  />
)}
```

### في Dashboard.tsx
```tsx
// إضافة الاستيرادات
import { useFoundingUser } from "@/hooks/useFoundingUser";
import { UserNumberBadge } from "@/components/ui/user-number-badge";

// استخدام userId الموجود مسبقاً
const { userNumber, isFoundingUser } = useFoundingUser(userId);

// في قسم الترحيب - إضافة الشارة
<div className="flex items-center gap-3">
  <div>
    <h1>مرحباً بك!</h1>
    <p>إدارة ذكية...</p>
  </div>
  {userNumber && (
    <UserNumberBadge 
      userNumber={userNumber} 
      isFoundingUser={isFoundingUser} 
      size="md"
    />
  )}
</div>
```
