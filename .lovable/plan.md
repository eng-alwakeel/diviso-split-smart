
# إضافة زر "مشاركة رابط التثبيت" في صفحة /install + تحسين OG

## نظرة عامة
إضافة زر مشاركة ثانوي (outline) تحت زر التثبيت في صفحة `/install`، مع تحسين معاينة واتساب عبر تحديث OG metadata.

---

## الملفات المطلوبة

### 1. ملف جديد: `src/components/pwa/ShareInstallButton.tsx`

مكون زر مشاركة قابل لإعادة الاستخدام:
- يستخدم `navigator.share` على الجوال (Share Sheet)
- Fallback: ينسخ الرابط + يعرض toast "تم نسخ رابط التثبيت" (باستخدام `sonner` الموجود بالفعل)
- لا يظهر إذا التطبيق مثبت (standalone mode) -- يستخدم `usePwaInstall` hook الموجود
- يستخدم `Button` من shadcn بنمط `outline` (ثانوي)
- أيقونة `Share2` من lucide-react

### 2. تعديل: `src/pages/Install.tsx`

- استيراد `ShareInstallButton`
- إضافته تحت `InstallWidget` مباشرة داخل الـ `max-w-md` div
- إضافة نص توضيحي صغير تحته

### 3. تعديل: `supabase/functions/og-handler/index.ts`

- إضافة مسار `/install` في `pageMetadata` مع:
  - title: "ثبّت Diviso على جوالك"
  - description: "قسّم المصاريف مع أصحابك بسهولة، وافتح التطبيق مباشرة من شاشة الجوال."
  - image: `/og/install-1200x630.png`

### 4. تعديل: `src/pages/Install.tsx` (SEO)

- تحديث مكون `SEO` الموجود بالفعل بإضافة `ogImage` لصورة التثبيت

### 5. ملف جديد: `public/og/install-1200x630.png`

- صورة OG بمقاس 1200x630 (نسخة مؤقتة من صورة OG الموجودة حتى يتم تصميم واحدة مخصصة)

---

## التفاصيل التقنية

### ShareInstallButton.tsx - المنطق

```text
عند الضغط على الزر:
1. إذا navigator.share متوفر --> يفتح Share Sheet بالرسالة:
   - title: "ثبّت Diviso على جوالك"
   - text: "قسّم المصاريف مع أصحابك بسهولة..."
   - url: https://diviso.app/install
2. إذا غير متوفر --> ينسخ الرابط + toast نجاح
3. إذا النسخ فشل --> window.prompt كحل أخير
```

### التصميم في صفحة /install

```text
[أيقونة التنزيل]
ثبّت Diviso على جهازك
وصف الصفحة...

+---------------------------------+
| [InstallWidget - زر التثبيت]    |
+---------------------------------+
|                                 |
| [زر مشاركة - outline/ثانوي]    |
| أرسل الرابط لشخص ثاني أو       |
| افتحه على جهازك الثاني          |
+---------------------------------+

[بطاقات المميزات]
```

### OG Handler - المسار الجديد

```text
pageMetadata['/install'] = {
  title: 'ثبّت Diviso على جوالك',
  description: 'قسّم المصاريف مع أصحابك بسهولة...',
  image: '/og/install-1200x630.png'
}
```

هذا يضمن أن مشاركة الرابط عبر واتساب/تويتر تعرض preview جميل بعنوان ووصف وصورة مخصصة.

---

## ملخص الملفات

| الملف | النوع |
|-------|-------|
| `src/components/pwa/ShareInstallButton.tsx` | جديد |
| `src/pages/Install.tsx` | تعديل |
| `supabase/functions/og-handler/index.ts` | تعديل |
| `public/og/install-1200x630.png` | جديد (مؤقت) |

