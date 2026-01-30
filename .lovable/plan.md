
# خطة: إصلاح زر "كل التجارب" في صفحات التجارب

## المشكلة

عند الضغط على زر "← كل التجارب" في صفحة التجربة:
- الزر يستدعي `navigate('/launch')` مباشرة
- لكن الـ `showDemo` state يبقى `true`
- النتيجة: لا يحدث شيء ظاهرياً

## السبب الجذري

```typescript
// DemoExperience.tsx - سطر 69-72
const handleBackToLaunch = useCallback(() => {
  trackEvent('back_to_launch_clicked', ...);
  navigate('/launch');  // ❌ يغير URL فقط، لا يُغلق الـ Overlay
}, ...);
```

## الحل

تغيير `handleBackToLaunch` ليستخدم `onClose` (الذي يُحدّث الـ state) **ثم** `navigate`:

```typescript
// DemoExperience.tsx
const handleBackToLaunch = useCallback(() => {
  trackEvent('back_to_launch_clicked', { from_mode: demoMode, scenario: scenario.id });
  onClose();              // 1. إغلاق الـ Overlay
  navigate('/launch');    // 2. ثم التنقل للـ Hub
}, [navigate, trackEvent, demoMode, scenario.id, onClose]);
```

---

## الملفات المطلوب تعديلها

| الملف | التعديل |
|-------|---------|
| `src/components/launch/DemoExperience.tsx` | إضافة `onClose()` قبل `navigate('/launch')` |

---

## التغيير في الكود

### DemoExperience.tsx - سطر 69-72

**قبل:**
```typescript
const handleBackToLaunch = useCallback(() => {
  trackEvent('back_to_launch_clicked', { from_mode: demoMode, scenario: scenario.id });
  navigate('/launch');
}, [navigate, trackEvent, demoMode, scenario.id]);
```

**بعد:**
```typescript
const handleBackToLaunch = useCallback(() => {
  trackEvent('back_to_launch_clicked', { from_mode: demoMode, scenario: scenario.id });
  onClose();           // إغلاق الـ Overlay أولاً
  navigate('/launch'); // ثم التنقل للـ Hub
}, [navigate, trackEvent, demoMode, scenario.id, onClose]);
```

---

## تدفق العمل بعد الإصلاح

```text
المستخدم في /launch?demo=travel
       ↓
يضغط "← كل التجارب"
       ↓
handleBackToLaunch()
       ↓
onClose() → showDemo=false, selectedScenario=null
       ↓
navigate('/launch')
       ↓
يظهر Hub صفحة /launch بشكل صحيح
```

---

## معايير القبول

| # | المعيار |
|---|---------|
| 1 | زر "كل التجارب" يُغلق صفحة التجربة |
| 2 | المستخدم يعود لصفحة `/launch` (Hub) |
| 3 | الـ URL يتغير من `/launch?demo=X` إلى `/launch` |
| 4 | Analytics event يُرسل بشكل صحيح |

---

## ملخص

| العنصر | التفاصيل |
|--------|----------|
| ملفات معدلة | 1 |
| أسطر معدلة | 2 |
| الوقت المتوقع | 2 دقيقة |
