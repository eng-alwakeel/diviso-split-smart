/**
 * Safe Tooltip Component
 * 
 * هذا الملف يمنع الاستخدام الخاطئ لـ TooltipProvider
 * 
 * ⚠️ استخدم هذا الملف بدلاً من "@/components/ui/tooltip"
 * 
 * الاستخدام الصحيح:
 * import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/safe-tooltip";
 * 
 * ❌ لا تستورد TooltipProvider من هنا - موجود فقط في App.tsx
 */

import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

// تصدير المكونات المطلوبة فقط
export { Tooltip, TooltipContent, TooltipTrigger };

// ❌ عدم تصدير TooltipProvider نهائياً
// TooltipProvider موجود فقط في App.tsx

/**
 * إذا كنت بحاجة لـ TooltipProvider:
 * - لا تضيفه هنا!
 * - هو موجود بالفعل في App.tsx
 * - استخدم Tooltip مباشرة بدون provider
 * 
 * للمزيد: راجع TOOLTIP_GUIDE.md
 */
