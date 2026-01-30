

# خطة: تحويل CTA من /launch إلى صفحة إنشاء حساب (Signup)

## الوضع الحالي

### ✅ صفحة LaunchPage.tsx - صحيحة!

```typescript
// سطر 146 - التحويل الحالي صحيح
navigate('/auth?mode=signup&redirect=/create-group');
```

### ❌ صفحة Auth.tsx - المشكلة

```typescript
// سطر 27 - الافتراضي login
const [mode, setMode] = useState<...>("login");

// سطر 489-493 - تقرأ mode=reset فقط!
if (params.get("mode") === "reset") {
  setMode("reset-password");
}
// ⚠️ لا تقرأ mode=signup!
```

**النتيجة:** عند الوصول إلى `/auth?mode=signup` تظهر صفحة تسجيل الدخول بدلاً من إنشاء الحساب.

---

## الحل

### تعديل صفحة Auth.tsx

#### 1. قراءة mode=signup من URL

```typescript
// تحديث useEffect الموجود (سطر 477-494)
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  
  // Check for access_token in URL hash (from Supabase email link)
  if (hash && (hash.includes('access_token') || hash.includes('type=recovery'))) {
    setMode("reset-password");
    setAuthType("email");
    return;
  }
  
  // Check for mode parameter in URL
  const urlMode = params.get("mode");
  if (urlMode === "reset") {
    setMode("reset-password");
    setAuthType("email");
  } else if (urlMode === "signup") {
    setMode("signup");  // ← إضافة جديدة
  }
  // إذا لم يوجد mode، يبقى الافتراضي "login"
}, []);
```

---

## الملفات المطلوب تعديلها

| الملف | التعديل | الأسطر |
|-------|---------|--------|
| `src/pages/Auth.tsx` | إضافة قراءة `mode=signup` | 489-493 |

---

## سيناريو الاختبار

| الخطوة | الفعل | النتيجة المتوقعة |
|--------|-------|-----------------|
| 1 | فتح `/launch` كزائر جديد | صفحة التجارب التفاعلية |
| 2 | اختيار سيناريو (مثل السفر) | فتح التجربة التفاعلية |
| 3 | الضغط على "ابدأ مجموعتك الحين" | تحويل إلى `/auth?mode=signup&redirect=/create-group` |
| 4 | تظهر صفحة Auth | **نموذج إنشاء حساب جديد** (ليس تسجيل دخول) |
| 5 | إتمام التسجيل | تحويل تلقائي إلى `/create-group` |

---

## معايير القبول

| # | المعيار |
|---|---------|
| 1 | `/auth?mode=signup` يفتح نموذج إنشاء حساب مباشرة |
| 2 | `/auth?mode=login` أو `/auth` يفتح نموذج تسجيل الدخول |
| 3 | CTA من `/launch` يأخذ المستخدم لإنشاء حساب |
| 4 | بعد التسجيل يتم التحويل للـ `redirect` parameter |

---

## ملخص التغييرات

| التغيير | الأثر |
|---------|-------|
| قراءة `mode=signup` من URL | المستخدم الجديد يرى نموذج التسجيل مباشرة |
| الحفاظ على `mode=login` كافتراضي | لا تأثير على المستخدمين الحاليين |

**الوقت المتوقع للتنفيذ:** 2 دقيقة

