
# خطة تنفيذ صفحة الإطلاق (/launch)

## نظرة عامة
إنشاء صفحة إطلاق مخصصة للحملات والإنفلونسر بتصميم بسيط وسريع يركز على تحويل الزائر إلى مسجّل ثم منشئ مجموعة.

---

## الملفات المطلوب إنشاؤها / تعديلها

| الملف | العملية |
|-------|---------|
| `src/pages/LaunchPage.tsx` | إنشاء جديد |
| `src/App.tsx` | إضافة Route |
| `public/og-launch.png` | إنشاء صورة OG |

---

## المرحلة 1: إنشاء صفحة الإطلاق

### الهيكل العام (LaunchPage.tsx)

```text
┌─────────────────────────────────────┐
│           شعار Diviso               │
├─────────────────────────────────────┤
│                                     │
│    القسمة دايمًا تلخبط؟             │ ← H1
│    خلّها واضحة وبلا إحراج           │
│                                     │
├─────────────────────────────────────┤
│  في السفر، الطلعات، أو السكن        │
│  دائمًا فيه واحد يدفع أكثر          │ ← Paragraph
│  هذا التطبيق يخلي القسمة عادلة     │
│  وواضحة بينكم                       │
├─────────────────────────────────────┤
│                                     │
│       [  ابدأ الحين  ]              │ ← Primary CTA
│                                     │
├─────────────────────────────────────┤
│  بدقيقة تنشئ مجموعتك                │ ← Helper Text
│  وتبدأ تحسب بدون نقاش               │
├─────────────────────────────────────┤
│                                     │
│     🔗 شارك الرابط مع شلتك          │ ← Share Element
│                                     │
└─────────────────────────────────────┘
```

### الميزات الرئيسية

**1. التصميم**
- Mobile First (تحسين للجوال أولاً)
- صفحة قصيرة بدون scroll طويل
- لون الزر: Primary Brand Color (`#C8F169`)
- خلفية: `background` مع gradient خفيف
- زر واحد فقط في الصفحة

**2. سلوك الزر**
```javascript
const handleCTA = async () => {
  // Track CTA click with UTM
  trackWithUTM('launch_cta_click');
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    // مسجّل → إنشاء مجموعة مباشرة
    navigate('/create-group');
  } else {
    // غير مسجّل → صفحة تسجيل مع redirect
    navigate('/auth?mode=signup&redirect=/create-group');
  }
};
```

**3. عنصر المشاركة**
- يظهر أسفل الصفحة
- أيقونة Link + نص "🔗 شارك الرابط مع شلتك"
- عند الضغط: نسخ الرابط + رسالة الشير الافتراضية

---

## المرحلة 2: التتبع (Tracking)

### الأحداث المطلوبة
جميع الأحداث تُرسل عبر GTM dataLayer (بدون كود تتبع مباشر):

```javascript
// عند تحميل الصفحة
useEffect(() => {
  trackWithUTM('launch_page_view', {
    page_path: '/launch'
  });
}, []);

// عند الضغط على CTA
trackWithUTM('launch_cta_click');

// التسجيل والمجموعة يُتتبعان من Auth و CreateGroup
```

### دعم UTM
يتم التقاط UTM تلقائياً من `useGoogleAnalytics`:
- `utm_source`
- `utm_medium`
- `utm_campaign`

مثال: `/launch?utm_source=instagram&utm_medium=share&utm_campaign=sha3bana`

---

## المرحلة 3: Open Graph (Share Preview)

### Meta Tags ديناميكية
استخدام `react-helmet-async` أو `SEO` component الموجود:

```html
<meta property="og:title" content="القسمة دايمًا تلخبط؟ خلّها واضحة" />
<meta property="og:description" content="تطبيق بسيط يخلي القسمة بين الأصدقاء عادلة بدون إحراج ولا نقاش" />
<meta property="og:image" content="https://diviso.app/og-launch.png" />
<meta property="og:url" content="https://diviso.app/launch" />
```

### صورة OG المطلوبة
**المواصفات:**
- الحجم: 1200x630 px
- الخلفية: Primary gradient (#C8F169 → أغمق)
- النص: "القسمة… بدون إحراج"
- بسيطة بدون تفاصيل كثيرة

---

## المرحلة 4: رسالة الشير الافتراضية

عند نسخ الرابط:
```text
القسمة دايم تسبب لخبطة
هذا تطبيق يخليها واضحة بينكم
جرّبه 👇
https://diviso.app/launch
```

---

## المرحلة 5: تحديث Routing

### في App.tsx:
```javascript
const LazyLaunchPage = withLazyLoading(lazy(() => import("./pages/LaunchPage")));

// إضافة Route (بدون حماية - صفحة عامة)
<Route path="/launch" element={<LazyLaunchPage />} />
```

---

## التفاصيل التقنية

### هيكل الكود

```tsx
// src/pages/LaunchPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link2, Check } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useToast } from '@/hooks/use-toast';

const LaunchPage: React.FC = () => {
  const navigate = useNavigate();
  const { trackWithUTM } = useGoogleAnalytics();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Track page view on mount
  useEffect(() => {
    trackWithUTM('launch_page_view', {
      page_path: '/launch'
    });
  }, [trackWithUTM]);

  // CTA Handler
  const handleCTA = async () => {
    trackWithUTM('launch_cta_click');
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      navigate('/create-group');
    } else {
      navigate('/auth?mode=signup&redirect=/create-group');
    }
  };

  // Share Handler
  const handleShare = async () => {
    const shareText = `القسمة دايم تسبب لخبطة
هذا تطبيق يخليها واضحة بينكم
جرّبه 👇
${window.location.origin}/launch`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({ title: 'تم النسخ!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background"
      dir="rtl"
    >
      <SEO 
        title="القسمة دايمًا تلخبط؟ خلّها واضحة"
        description="تطبيق بسيط يخلي القسمة بين الأصدقاء عادلة بدون إحراج ولا نقاش"
        ogImage="https://diviso.app/og-launch.png"
        noIndex={false}
      />

      {/* Logo */}
      <img 
        src={BRAND_CONFIG.logo} 
        alt="Diviso" 
        className="h-12 w-auto mb-8" 
      />

      {/* H1 Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-6 leading-tight">
        القسمة دايمًا تلخبط؟<br />
        خلّها واضحة وبلا إحراج
      </h1>

      {/* Description */}
      <p className="text-lg text-muted-foreground text-center max-w-md mb-8 leading-relaxed">
        في السفر، الطلعات، أو السكن<br />
        دائمًا فيه واحد يدفع أكثر<br />
        هذا التطبيق يخلي القسمة عادلة وواضحة بينكم
      </p>

      {/* Primary CTA */}
      <Button 
        onClick={handleCTA}
        size="lg"
        className="text-xl px-12 py-7 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
      >
        ابدأ الحين
      </Button>

      {/* Helper Text */}
      <p className="text-sm text-muted-foreground text-center mt-4">
        بدقيقة تنشئ مجموعتك<br />
        وتبدأ تحسب بدون نقاش
      </p>

      {/* Share Element */}
      <button 
        onClick={handleShare}
        className="mt-12 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
      >
        {copied ? <Check className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
        <span>شارك الرابط مع شلتك</span>
      </button>
    </div>
  );
};

export default LaunchPage;
```

---

## ممنوعات (تأكيد)

- لا ذكر "إعلان"
- لا أسعار أو اشتراكات
- لا خصومات أو أكواد
- لا Features List
- لا Screenshots كثيرة
- لا Testimonials
- لا Header/Footer
- لا أزرار متعددة

---

## معايير القبول

| المعيار | الحالة |
|---------|--------|
| المستخدم يفهم الفكرة خلال 5 ثواني | ✓ |
| زر واحد فقط | ✓ |
| رسالة الشير واضحة وجذابة | ✓ |
| الرابط يفتح بشكل نظيف على الجوال | ✓ |
| التسجيل → إنشاء مجموعة سلس | ✓ |
| التتبع عبر GTM فقط | ✓ |
| دعم UTM كامل | ✓ |

---

## ملخص الملفات

1. **إنشاء** `src/pages/LaunchPage.tsx` - الصفحة الرئيسية
2. **تعديل** `src/App.tsx` - إضافة Route جديد
3. **إنشاء** `public/og-launch.png` - صورة المشاركة (يُطلب من المستخدم توفيرها أو نستخدم og-image.png مؤقتاً)
