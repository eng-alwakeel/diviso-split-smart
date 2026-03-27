

# تحسين وضوح النص في أزرار CTA

## التحليل
- `--primary-foreground` حالياً `218 11% 10%` (رمادي غامق جداً) — جيد لكن ليس أسود تماماً
- الأزرار تستخدم `font-medium` (500) — خفيف للقراءة السريعة
- `disabled:opacity-50` — غير واضح بما يكفي كحالة معطلة
- زر "إنشاء مجموعة" في الـ Drawer يستخدم classes مخصصة وليس component الـ Button

## التغييرات

### 1. `src/index.css` — تغميق primary-foreground
```css
--primary-foreground: 0 0% 8%;  /* شبه أسود بدل رمادي غامق */
```

### 2. `src/components/ui/button.tsx` — تحسين الوزن والوضوح
- تغيير `font-medium` → `font-semibold` في الـ base classes
- تغيير `disabled:opacity-50` → `disabled:opacity-40` لتمييز أوضح
- إضافة `drop-shadow-sm` خفيف للنص في variant `default` و `hero` و `financial`

### 3. `src/components/BottomNav.tsx` — تحسين زر الـ Drawer
- الزر الكبير "إنشاء مجموعة" في الـ Drawer ليس Button component — يحتاج تحسين الـ font-weight

## الملفات المتأثرة
| ملف | تغيير |
|---|---|
| `src/index.css` | `--primary-foreground` أغمق |
| `src/components/ui/button.tsx` | `font-semibold` + `disabled:opacity-40` |
| `src/components/BottomNav.tsx` | تحسين وزن الخط في أزرار الـ Drawer |

