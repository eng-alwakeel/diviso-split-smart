

# خطة إلغاء Guest Mode

## الملفات المراد حذفها

| الملف | السبب |
|-------|-------|
| `src/contexts/GuestSessionContext.tsx` | Context الرئيسي للـ Guest Mode |
| `src/hooks/useGuestSession.ts` | Hook للوصول للـ Context |
| `src/hooks/useGuestAnalytics.ts` | تتبع إحصائيات الضيف |
| `src/components/guest/GuestModeBanner.tsx` | شريط "أنت في وضع التجربة" |
| `src/components/guest/GuestConversionPrompt.tsx` | رسالة التحويل الذكية |

---

## الملفات المراد تعديلها

### 1. `src/App.tsx`
- إزالة import الـ `GuestSessionProvider`
- إزالة الـ `<GuestSessionProvider>` wrapper من الـ App component

### 2. `src/pages/LaunchPage.tsx`
- إزالة imports:
  - `useGuestSession`
  - `useGuestAnalytics`
  - `Gamepad2`
- إزالة استخدام `isGuestMode` و `trackSessionStarted`
- إزالة زر "جرّب بدون تسجيل" والنص التابع له
- إزالة دالة `handleTryWithoutRegistration`
- إرجاع الـ CTA الأساسي للتسجيل

### 3. `src/components/launch/DemoExperience.tsx`
- إزالة imports:
  - `GuestModeBanner`
  - `GuestConversionPrompt`
  - `useGuestSession`
  - `useGuestAnalytics`
- إزالة الـ `GuestModeBanner` component
- إزالة منطق `shouldShowConversionPrompt`
- إزالة `GuestConversionPrompt` component
- تبسيط CTA section

---

## ملاحظة حول قاعدة البيانات

جدول `demo_sessions` ودالة `get_demo_stats()` سيبقيان في قاعدة البيانات لأنهما:
- لا يؤثران على الأداء
- قد تحتاجهما لاحقاً
- حذفهما يتطلب migration منفصل

إذا أردت حذفهما أيضاً، أخبرني.

---

## النتيجة النهائية

- صفحة `/launch` سترجع لوضعها السابق
- زر التسجيل سيكون الـ CTA الأساسي
- التجربة (Demo) ستبقى متاحة لكن بدون Guest Mode logic

