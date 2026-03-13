

# تبسيط HeroSection — الإبقاء على النص + CTA فقط

## التغيير
إزالة قسمي **Abstract Brand Art** (السطور 125-187) و**الخطوات الثلاث** (السطور 190-208) من `HeroSection.tsx`.

## التفاصيل

### `src/components/HeroSection.tsx`
- **حذف**: الـ grid ذو العمودين — يصبح المحتوى centered بالكامل
- **حذف**: كامل Abstract Brand Art (gradient orbs, geometric shapes, SVG, icon cluster)
- **حذف**: كامل 3 Steps section + متغير `steps`
- **حذف**: imports غير مستخدمة (`Users`, `Receipt`, `CheckCircle`)
- **تعديل**: `min-h-[90vh]` → `min-h-[70vh]` (أقصر بدون العناصر المحذوفة)
- **تعديل**: إزالة الـ `grid grid-cols-1 lg:grid-cols-2` wrapper — المحتوى النصي يصبح centered مباشرة
- **الإبقاء على**: Ramadan tagline, العنوان, حالات الاستخدام, الوصف, Founding Program banner, CTA button, Security badge, Scroll arrow

### النتيجة
Hero نظيف ومركّز — نص + CTA فقط، ثم DemoSandbox مباشرة بعده.

