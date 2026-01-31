

# خطة: إزالة أرقام الإحصائيات مؤقتاً

## المطلوب

إزالة الأرقام الثابتة (المستخدمين، المصاريف، المجموعات) من قسم Trust Indicators في الصفحة الرئيسية مؤقتاً.

---

## التغيير المطلوب

### ملف `HeroSection.tsx`

**حذف الأسطر 202-226** - قسم Trust indicators الكامل الذي يحتوي على:
- `+10,247 مستخدم`
- `+45,000 مصروف`
- `+8,500 قروب`
- `آمن ومشفر`

---

## قبل التعديل (سطر 202-226)

```tsx
{/* Trust indicators with animated counters - min-height to prevent CLS */}
<div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-white/90 min-h-[48px]">
  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-default h-10">
    <Users className="w-5 h-5 text-primary flex-shrink-0" />
    <span className="text-sm font-medium whitespace-nowrap">
      +<AnimatedCounter end={10247} duration={2000} /> {t('hero.usersLabel')}
    </span>
  </div>
  ...
</div>
```

---

## بعد التعديل

```tsx
{/* Trust indicators - temporarily hidden */}
```

حذف القسم بالكامل مع ترك تعليق للتذكير.

---

## الملفات المتأثرة

| الملف | التعديل |
|-------|---------|
| `src/components/HeroSection.tsx` | حذف قسم Trust indicators (أسطر 202-226) |

---

## ملاحظة

يمكن إزالة import غير المستخدم `AnimatedCounter` أيضاً لتنظيف الكود، لكن يمكن تركه إذا كنت تنوي إعادة الأرقام لاحقاً.

