

# خطة: إضافة بانر برنامج المستخدمين المؤسسين في الصفحة الرئيسية

## الموقع الحالي

الصفحة الرئيسية `/` تحتوي على `HeroSection.tsx` مع الترتيب التالي:
1. العنوان الرئيسي
2. حالات الاستخدام (سفر، سكن مشترك...)
3. الوصف
4. **زر "ابدأ مجاناً"** ← نضيف البانر هنا
5. شارة الأمان (آمن 100%)

---

## التغيير المطلوب

إضافة بانر مصغّر لبرنامج المستخدمين المؤسسين **قبل** زر "ابدأ مجاناً" مباشرة.

```text
┌─────────────────────────────────────────────┐
│ Diviso ينظّم أي مشاركة بين أكثر من شخص     │
│ سفر • سكن مشترك • طلعة أصدقاء • نشاط...   │
│                                             │
│ أي تجربة تشاركية...                        │
├─────────────────────────────────────────────┤
│ ⭐ برنامج المستخدمين المؤسسين              │  ← جديد
│ متبقي X من 1000 مقعد                       │  ← جديد
├─────────────────────────────────────────────┤
│ [ابدأ مجاناً]                               │
│ ✅ آمن 100%                                 │
└─────────────────────────────────────────────┘
```

---

## الملف المعدّل

**`src/components/HeroSection.tsx`**

### التغييرات:

1. **إضافة استيراد:**
```typescript
import { useFoundingProgram } from "@/hooks/useFoundingProgram";
```

2. **استخدام الـ hook:**
```typescript
const { remaining, isClosed } = useFoundingProgram();
```

3. **إضافة البانر قبل زر CTA (قبل السطر 73):**
```typescript
{/* Founding Program Banner - before CTA */}
{!isClosed && (
  <div className="mb-4 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-3 backdrop-blur-sm max-w-sm mx-auto lg:mx-0">
    <p className="text-sm font-medium text-amber-300 flex items-center justify-center lg:justify-start gap-2">
      <span>⭐</span>
      <span>{isRTL ? 'برنامج المستخدمين المؤسسين' : 'Founding Users Program'}</span>
    </p>
    <p className="text-xs text-amber-200/80 mt-1 text-center lg:text-start">
      {isRTL 
        ? `متبقي ${remaining} من 1000 مقعد`
        : `${remaining} of 1000 spots remaining`
      }
    </p>
  </div>
)}
```

---

## التصميم

- **الخلفية:** تدرج ذهبي شفاف `from-amber-500/20`
- **الحدود:** ذهبي `border-amber-400/30`
- **النص:** أبيض/ذهبي ليتناسب مع خلفية Hero الداكنة
- **العرض:** محدود `max-w-sm` ليبقى مضغوطاً
- **الاختفاء:** عند اكتمال 1000 مستخدم (`isClosed`)

---

## ملخص التغييرات

| الملف | التعديل |
|-------|---------|
| `src/components/HeroSection.tsx` | إضافة بانر Founding Program قبل CTA |

---

## معايير القبول

| # | المعيار |
|---|---------|
| 1 | البانر يظهر قبل زر "ابدأ مجاناً" |
| 2 | يعرض "برنامج المستخدمين المؤسسين" مع العداد |
| 3 | يختفي تلقائياً عند اكتمال 1000 مستخدم |
| 4 | يدعم RTL/LTR |
| 5 | التصميم متناسق مع خلفية Hero الداكنة |

