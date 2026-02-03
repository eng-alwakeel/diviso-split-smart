

# إصلاح التنقل بين تسجيل الدخول وإنشاء الحساب

## المشكلة
من الصور المرفقة، يظهر أن صفحة تسجيل الدخول تحتوي على زر "إنشاء حساب مجاني + 50 نقطة" لكن عند الضغط عليه لا ينتقل لوضع إنشاء الحساب.

**السبب التقني:**
- الزر يستخدم `navigate('/auth?mode=signup&redirect=/create-group')`
- لكن صفحة Auth لا تحتوي على كود يقرأ `?mode=signup` من URL ويعين `setMode("signup")`
- الصفحة تبدأ دائماً بـ `mode="signup"` لكن عند التنقل داخلياً لا تتحدث

---

## الحل

### التعديل على `src/pages/Auth.tsx`

إضافة useEffect جديد يقرأ mode parameter من URL:

```typescript
// بعد السطر 31 مباشرة
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const urlMode = params.get('mode');
  if (urlMode === 'signup' || urlMode === 'login') {
    setMode(urlMode);
  }
}, []);
```

---

## إصلاح إضافي

بالإضافة لذلك، سأغير زر "إنشاء حساب" ليستخدم `setMode("signup")` مباشرة بدلاً من navigation كامل، لتجربة أسرع:

**قبل (سطر 1187-1190):**
```typescript
onClick={() => {
  trackGAEvent('login_to_signup_cta_clicked');
  navigate('/auth?mode=signup&redirect=/create-group');
}}
```

**بعد:**
```typescript
onClick={() => {
  trackGAEvent('login_to_signup_cta_clicked');
  setMode("signup");
}}
```

---

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `src/pages/Auth.tsx` | إضافة قراءة URL mode + تبسيط التنقل |

---

## النتيجة

```text
┌─────────────────────────────────────┐
│     صفحة تسجيل الدخول (Login)        │
│                                     │
│  [ سجّل بحساب Google - الأسرع ]     │
│                                     │
│  [ باقي خيارات الدخول ▼ ]           │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ إنشاء حساب مجاني + 50 نقطة │    │ ← الضغط هنا
│  └─────────────────────────────┘    │
│                ↓                    │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│     صفحة إنشاء الحساب (Signup)       │ ← ينتقل بنجاح
│                                     │
│  [ سجّل بحساب Google - الأسرع ]     │
│                                     │
│  [ باقي خيارات التسجيل ▼ ]          │
│                                     │
│  لديك حساب؟ [ تسجيل الدخول ]        │
└─────────────────────────────────────┘
```

