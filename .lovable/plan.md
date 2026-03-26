

# Premium Dark Glass Bottom Navigation

## التغيير
ملف واحد: `src/components/BottomNav.tsx` — تعديل CSS فقط

### التعديلات على الأنماط

**الحاوية الخارجية (`nav`):**
- إضافة `mb-2` لرفع الشريط عن الحافة السفلية (floating feel)

**الحاوية الداخلية (`div.mx-auto`):**
- إضافة هوامش أفقية أكبر `px-6`

**شريط الزجاج المعتم (الـ `div` الداخلي):**
- استبدال الأنماط الحالية بـ inline style للتحكم الدقيق:
  - `background: rgba(15, 18, 24, 0.72)`
  - `backdrop-filter: blur(14px)`
  - `border: 1px solid rgba(255,255,255,0.08)`
  - `box-shadow: 0 10px 30px rgba(0,0,0,0.20)`
- تغيير `rounded-t-2xl` → `rounded-[28px]` (مستدير بالكامل)
- إزالة `border-t border-x border-border/60 bg-background/95 shadow-elevated`

**زر FAB:**
- إضافة `ring-2 ring-background/80` لحلقة داكنة تفصله عن الزجاج
- إبقاء `bg-primary` و `shadow-lg` كما هي

**النصوص والأيقونات:**
- بدون تغيير — تبقى واضحة على الخلفية المعتمة

### الملفات

| الملف | التغيير |
|---|---|
| `src/components/BottomNav.tsx` | CSS فقط — dark glass style |

