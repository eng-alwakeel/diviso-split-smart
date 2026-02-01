
# خطة إصلاح خطأ TooltipProvider

## المشكلة
الخطأ `'Tooltip' must be used within 'TooltipProvider'` يحدث لأن بعض المكونات تستخدم Tooltip من `@/components/ui/tooltip` مباشرة بدون TooltipProvider.

## المكونات المتأثرة

| الملف | المشكلة |
|-------|---------|
| `src/components/ui/founding-badge.tsx` | يستورد من `tooltip` بدلاً من `safe-tooltip` |
| `src/components/recommendations/PartnerBadge.tsx` | يستورد من `tooltip` + يضيف TooltipProvider زائد |

---

## الحل

### 1. تعديل `src/components/ui/founding-badge.tsx`

**التغيير**: تحويل الاستيراد من `tooltip` إلى `safe-tooltip`

```typescript
// قبل (خطأ):
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// بعد (صحيح):
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/safe-tooltip";
```

### 2. تعديل `src/components/recommendations/PartnerBadge.tsx`

**التغييرات**:
1. تحويل الاستيراد من `tooltip` إلى `safe-tooltip`
2. إزالة `TooltipProvider` من الاستيراد والكود

```typescript
// قبل (خطأ):
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,  // ❌ لا حاجة له
  TooltipTrigger,
} from "@/components/ui/tooltip";

// في الـ JSX:
<TooltipProvider>  {/* ❌ زائد */}
  <Tooltip>...</Tooltip>
</TooltipProvider>

// بعد (صحيح):
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/safe-tooltip";

// في الـ JSX:
<Tooltip>...</Tooltip>  {/* ✅ بدون wrapper */}
```

---

## لماذا `safe-tooltip`؟

كما هو موثق في `TOOLTIP_GUIDE.md`:

- `safe-tooltip` يغلف كل Tooltip بـ TooltipProvider خاص به
- هذا يمنع أخطاء React Context
- لا حاجة لـ TooltipProvider على مستوى التطبيق

---

## النتيجة المتوقعة

- الصفحة الرئيسية ستعمل بدون أخطاء
- جميع Tooltips ستعمل بشكل صحيح
- لا حاجة لتغيير `App.tsx`

---

## ملاحظة تقنية

المشروع يستخدم نمطين للـ Tooltip:
1. **`tooltip.tsx`**: المكون الأساسي من Radix - يحتاج TooltipProvider
2. **`safe-tooltip.tsx`**: wrapper يضيف provider تلقائياً - لا يحتاج شيء

يجب استخدام `safe-tooltip` في جميع المكونات لتجنب هذه المشاكل.
