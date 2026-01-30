

# خطة: تحسين سرعة التطبيق على متصفح الجوال

## الوضع الحالي

| المعيار | النتيجة |
|---------|---------|
| Performance | 54% ❌ |
| Accessibility | 85% ✅ |
| Best Practices | 100% ✅ |
| SEO | 100% ✅ |

**المشكلة الرئيسية:** "Avoid large layout shifts" (CLS)

---

## تحليل المشاكل

### 1. Layout Shifts (CLS) - المشكلة الأكبر

| المكون | المشكلة |
|--------|---------|
| `HeroSection.tsx` | Trust indicators تظهر بعد AnimatedCounter |
| `AnimatedCounter.tsx` | الأرقام تتغير وتسبب تحريك النص |
| `Header.tsx` | الشعار يتحمل بدون أبعاد محجوزة |
| Lazy Components | تظهر بعد التحميل وتسبب قفزات |

### 2. Third-Party Scripts Blocking

```html
<!-- 5 سكربتات خارجية تبطئ التحميل -->
- GTM (2 tags)
- GA4 Direct
- TikTok Pixel
- Google AdSense
```

### 3. Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=Readex+Pro..." />
```
الخط يتحمل ويسبب FOUT (Flash of Unstyled Text)

---

## الحلول المقترحة

### 1. إصلاح Layout Shifts (الأولوية القصوى)

#### A. تحسين AnimatedCounter

```typescript
// من:
<span className="inline-block min-w-[3.5rem]">
  {formatNumber(isVisible ? count : end)}
</span>

// إلى:
<span 
  className="inline-block" 
  style={{ 
    minWidth: `${String(end).length + 1}ch`,
    fontVariantNumeric: 'tabular-nums'
  }}
>
  {formatNumber(end)} // عرض الرقم النهائي مباشرة
</span>
```

#### B. تحسين HeroSection - حجز مساحة ثابتة

```typescript
// إضافة ارتفاع ثابت لـ Trust Indicators
<div className="flex flex-wrap ... min-h-[48px]">
```

#### C. تحسين Header Logo

```typescript
// إضافة aspect-ratio للشعار
<img 
  src={appLogo} 
  alt="شعار Diviso" 
  className="h-8 w-auto"
  width={128} 
  height={32}
  style={{ aspectRatio: '128 / 32' }} // منع CLS
/>
```

#### D. تحسين BelowFoldSkeleton في Index.tsx

```typescript
// تحسين containIntrinsicSize لكل قسم
const BelowFoldSkeleton = () => (
  <div 
    style={{ 
      contentVisibility: 'auto', 
      containIntrinsicSize: 'auto 2000px' // بدلاً من '0 2000px'
    }}
  >
```

---

### 2. تأخير Third-Party Scripts

#### تحديث index.html

```html
<!-- GTM - تأخير إلى بعد التفاعل -->
<script>
  // تحميل GTM بعد 3 ثواني أو عند أول تفاعل
  const loadGTM = () => {
    if (window.gtmLoaded) return;
    window.gtmLoaded = true;
    // GTM code here
  };
  setTimeout(loadGTM, 3000);
  document.addEventListener('scroll', loadGTM, { once: true });
  document.addEventListener('click', loadGTM, { once: true });
</script>

<!-- TikTok Pixel - تأخير مماثل -->
<!-- AdSense - تأخير أو إزالة من الصفحة الرئيسية -->
```

---

### 3. تحسين Font Loading

#### تحديث index.html

```html
<!-- Preload الخط مع font-display: optional -->
<link 
  rel="preload" 
  href="https://fonts.gstatic.com/s/readexpro/v21/..." 
  as="font" 
  type="font/woff2" 
  crossorigin
/>

<!-- إضافة fallback font في CSS -->
```

#### تحديث index.css

```css
body {
  font-family: 'Readex Pro', system-ui, -apple-system, sans-serif;
  font-display: optional; /* يمنع FOIT/FOUT */
}
```

---

### 4. تحسين Critical CSS

#### تحديث index.html

```html
<style>
  /* Critical CSS للـ Above the Fold */
  #root { min-height: 100vh; background: #1A1C1E; }
  body { margin: 0; font-family: 'Readex Pro', system-ui, sans-serif; }
  
  /* حجز مساحة للـ Header */
  header { min-height: 56px; }
  
  /* حجز مساحة للـ Hero Section */
  .hero-placeholder { min-height: 90vh; }
</style>
```

---

### 5. تحسين Lazy Loading للصفحة الرئيسية

#### تحديث Index.tsx

```typescript
// تقليل BelowFoldSkeleton واستخدام Suspense أفضل
const BelowFoldSkeleton = () => (
  <div 
    className="space-y-16"
    style={{ 
      contentVisibility: 'auto',
      containIntrinsicBlockSize: '2000px'
    }}
  >
    {/* Placeholder shapes بأبعاد ثابتة */}
    <div className="h-[500px] bg-muted/30" />
    <div className="h-[600px] bg-muted/50" />
    <div className="h-[400px] bg-transparent" />
    <div className="h-[300px] bg-transparent" />
    <div className="h-[500px] bg-muted/50" />
  </div>
);
```

---

## الملفات المطلوب تعديلها

| الملف | التعديل | الأولوية |
|-------|---------|----------|
| `src/components/landing/AnimatedCounter.tsx` | إصلاح CLS + tabular-nums | عالية |
| `src/components/HeroSection.tsx` | حجز مساحة ثابتة | عالية |
| `src/components/Header.tsx` | aspect-ratio للشعار | عالية |
| `index.html` | تأخير third-party scripts | عالية |
| `src/pages/Index.tsx` | تحسين Skeleton | متوسطة |
| `src/index.css` | font-display: optional | متوسطة |
| `src/components/Footer.tsx` | aspect-ratio للشعار | منخفضة |
| `src/components/AppHeader.tsx` | aspect-ratio للشعار | منخفضة |

---

## التحسينات المتوقعة

| المعيار | قبل | بعد (متوقع) |
|---------|-----|-------------|
| CLS (Layout Shift) | > 0.25 | < 0.1 ✅ |
| Performance Score | 54% | 75-85% |
| FCP | - | أسرع بـ 200-400ms |
| LCP | - | أسرع بـ 300-500ms |

---

## ملخص التغييرات

| التغيير | التأثير |
|---------|---------|
| إصلاح AnimatedCounter | -50% CLS |
| حجز مساحات ثابتة | -30% CLS |
| تأخير GTM/TikTok/AdSense | +15% Performance |
| تحسين Font Loading | +5% Performance |
| تحسين Skeleton | -10% CLS |

**الوقت المتوقع للتنفيذ:** 20-30 دقيقة

