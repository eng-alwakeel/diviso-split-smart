# ⚠️ دليل استخدام Tooltips - مهم جداً!

## القاعدة الأساسية
- **TooltipProvider موجود مرة واحدة فقط** في `App.tsx`
- **لا تضيف TooltipProvider أبداً** في أي مكون آخر!

## ✅ الاستخدام الصحيح

```typescript
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/safe-tooltip";

// بدون TooltipProvider!
<Tooltip>
  <TooltipTrigger>زر أو عنصر</TooltipTrigger>
  <TooltipContent>النص الظاهر</TooltipContent>
</Tooltip>
```

## ❌ الاستخدام الخاطئ

```typescript
// ❌ لا تستورد TooltipProvider
import { TooltipProvider, Tooltip } from "@/components/ui/tooltip";

// ❌ لا تستخدم TooltipProvider في المكونات
<TooltipProvider>
  <Tooltip>...</Tooltip>
</TooltipProvider>
```

## 🔧 كيف تصلح الخطأ

إذا حصلت على خطأ `Cannot read properties of null (reading 'useState')`:

1. تأكد أنك تستخدم `safe-tooltip` وليس `tooltip`
2. تأكد أنك لم تضف `TooltipProvider` في المكون
3. تأكد أن `App.tsx` يحتوي على `TooltipProvider` واحد فقط

## 📚 ملفات الاستخدام

استخدم دائماً:
```typescript
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/safe-tooltip";
```

بدلاً من:
```typescript
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
```

## 🚨 ملاحظة مهمة

`TooltipProvider` يستخدم React Context ويجب أن يكون موجوداً مرة واحدة فقط في الـ component tree. وجود أكثر من واحد يسبب مشاكل في الأداء وأخطاء في التطبيق.

## 📖 المزيد من المعلومات

- راجع `src/components/ui/safe-tooltip.tsx` لفهم كيفية العمل
- راجع `App.tsx` لرؤية الاستخدام الصحيح لـ `TooltipProvider`
- راجع `BEFORE_COMMIT_CHECKLIST.md` قبل أي commit
