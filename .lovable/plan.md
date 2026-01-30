
# خطة: تحسين تتبع صفحات الحملات في Google Analytics

## الهدف
جعل كل حملة تظهر كصفحة مستقلة في تقارير GA4 بدلاً من دمجها تحت عنوان واحد.

---

## الوضع الحالي

| العنصر | الحالة |
|--------|--------|
| Page Title ديناميكي حسب السيناريو | ❌ ثابت لكل /launch |
| Event للحملات (campaign_page_view) | ❌ غير موجود |
| trackPageView مع العنوان الديناميكي | ❌ غير مُفعّل |

### المشكلة الحالية
```
📊 GA4 Reports → Pages and screens
Diviso | القسمة دايمًا تلخبط؟ خلّها واضحة    1,200
```
كل الحملات تظهر تحت عنوان واحد!

---

## الملفات المطلوب تعديلها

| الملف | التعديل |
|-------|---------|
| `src/pages/LaunchPage.tsx` | إضافة Page Title ديناميكي + campaign_page_view event |

---

## التغييرات المطلوبة

### 1. إضافة خريطة العناوين (TITLES_MAP)

```typescript
// Campaign-specific page titles for GA4 tracking
const CAMPAIGN_TITLES: Record<ScenarioType | 'main', string> = {
  main: 'Diviso | قسّم المصاريف بذكاء',
  travel: 'Diviso | حملة السفر ✈️',
  friends: 'Diviso | حملة طلعة أصدقاء 🧑‍🤝‍🧑',
  housing: 'Diviso | حملة السكن المشترك 🏠',
  activities: 'Diviso | حملة الأنشطة 🎯',
  desert: 'Diviso | حملة رحلة البر 🏕️',
  groups: 'Diviso | حملة المجموعات 👥',
  family: 'Diviso | حملة العائلة 👨‍👩‍👧',
  carpool: 'Diviso | حملة المشوار المشترك 🚗',
  events: 'Diviso | حملة المناسبات 🎉',
  friday: 'Diviso | حملة شلة الجمعة 👬',
};
```

### 2. تحديث useEffect لتغيير العنوان وإرسال Events

**الحالي (سطر 38-45):**
```typescript
useEffect(() => {
  const demoParam = searchParams.get('demo');
  trackWithUTM('launch_page_view', {
    page_path: '/launch',
    demo: demoParam || undefined,
  });
}, [trackWithUTM, searchParams]);
```

**الجديد:**
```typescript
// Track page view and set dynamic title for GA4 campaign tracking
useEffect(() => {
  const demoParam = searchParams.get('demo') as ScenarioType | null;
  const scenarioKey = (demoParam && VALID_SCENARIOS.includes(demoParam)) 
    ? demoParam 
    : 'main';
  
  // 1. Set dynamic page title for GA4 Pages & Screens report
  const pageTitle = CAMPAIGN_TITLES[scenarioKey];
  document.title = pageTitle;
  
  // 2. Track page view with UTM parameters
  trackWithUTM('launch_page_view', {
    page_path: '/launch',
    page_title: pageTitle,
    demo: demoParam || undefined,
  });
  
  // 3. Send campaign_page_view event for custom reporting
  trackEvent('campaign_page_view', {
    campaign_type: 'launch',
    scenario: scenarioKey,
    page_title: pageTitle,
  });
  
}, [searchParams, trackWithUTM, trackEvent]);
```

### 3. تحديث SEO component dynamically

استبدال الـ SEO component بعنوان ديناميكي:

**الحالي (سطر 162-167):**
```typescript
<SEO 
  title="القسمة دايمًا تلخبط؟ خلّها واضحة"
  description="جرّب المثال وشوف القسمة قدامك بدون إحراج"
  ...
/>
```

**الجديد:**
```typescript
<SEO 
  title={(() => {
    const demoParam = searchParams.get('demo') as ScenarioType | null;
    const scenarioKey = (demoParam && VALID_SCENARIOS.includes(demoParam)) 
      ? demoParam 
      : 'main';
    // Return title without "Diviso |" prefix since SEO component adds it
    return CAMPAIGN_TITLES[scenarioKey].replace('Diviso | ', '');
  })()}
  description="جرّب المثال وشوف القسمة قدامك بدون إحراج"
  ...
/>
```

---

## النتيجة المتوقعة في GA4

### 📊 Reports → Pages and screens

| Page Title | Sessions |
|------------|----------|
| Diviso \| حملة السفر ✈️ | 820 |
| Diviso \| حملة طلعة أصدقاء 🧑‍🤝‍🧑 | 310 |
| Diviso \| حملة السكن المشترك 🏠 | 190 |
| Diviso \| قسّم المصاريف بذكاء | 120 |

### 📊 Events → campaign_page_view

| scenario | Count |
|----------|-------|
| travel | 820 |
| friends | 310 |
| housing | 190 |
| main | 120 |

---

## إعداد Custom Dimension في GA4 (خطوة يدوية)

> هذه الخطوة يجب تنفيذها في Google Analytics Console:

1. **Admin** → **Custom definitions** → **Create custom dimension**
2. الإعدادات:
   - **Name:** Scenario
   - **Scope:** Event
   - **Event parameter:** scenario

---

## معايير القبول

| # | المعيار |
|---|---------|
| 1 | Page Title يتغير حسب السيناريو ✔ |
| 2 | كل حملة تظهر كصفحة مستقلة في Pages & Screens ✔ |
| 3 | Event campaign_page_view يُرسل مع scenario parameter ✔ |
| 4 | لا تغيير على الروابط أو القسمة الفنية ✔ |

---

## ملخص التغييرات

| الملف | الأسطر | التعقيد |
|-------|--------|---------|
| `LaunchPage.tsx` | ~25 سطر تعديل | بسيط |

**الوقت المتوقع للتنفيذ:** 5-10 دقائق
