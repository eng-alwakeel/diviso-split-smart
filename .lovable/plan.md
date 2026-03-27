

# تحويل صفحة المجموعة إلى Flow ذكي

## الوضع الحالي
صفحة المجموعة (`GroupDetails.tsx`) فيها بالفعل بنية Single Flow بدون تبويبات. المطلوب هو:
1. إضافة Smart Suggestions كقسم ديناميكي
2. تحسين عرض الأقسام بناءً على حالة المستخدم (لا تعرض كل شيء دفعة واحدة)
3. دمج الميزانية داخل Summary Grid

## التغييرات

### 1. `src/pages/GroupDetails.tsx` — عرض الأقسام حسب الحالة

**Summary Grid**: إضافة خلية الميزانية إذا كان فيه `sourcePlan?.budgetValue`:
- تحويل الـ grid من `grid-cols-3` إلى `grid-cols-4` عند وجود ميزانية
- أو عرض شريط الميزانية (Progress) مضغوط تحت الـ Summary مباشرة بدل Card منفصل

**ترتيب الأقسام الديناميكي**:
```text
1. Header (دائماً)
2. Summary Grid (دائماً) + Budget bar إذا موجود
3. Smart Action Bar (دائماً)
4. Smart Suggestion (إذا فيه اقتراح)
5. Smart Group Suggestions (جديد — إذا فيه خطة مرتبطة أو وجهة)
6. Schedule / Plan Section (إذا فيه خطة مرتبطة فقط)
7. Secondary Actions (إذا المجموعة نشطة)
8. Chat Timeline (دائماً)
9. Expenses Preview (إذا فيه مصاريف)
10. Settlement Card (إذا فيه أرصدة غير صفرية)
11. Members Preview (دائماً)
```

**شروط الإخفاء**:
- Settlement Card: يُخفى إذا كل الأرصدة = 0 وما فيه تسويات
- Expenses Preview: يُخفى إذا المجموعة `closed`
- Smart Suggestions: تُعرض فقط إذا فيه `sourcePlan` أو `group.destination`
- Schedule: يُعرض فقط إذا `sourcePlan?.days.length > 0`

### 2. `src/components/group/GroupPlanSection.tsx` — نقل الميزانية للخارج

- حذف قسم الميزانية (Budget Card) من داخل `GroupPlanSection` لأنه سينتقل للـ Summary
- إبقاء: بانر الخطة + الجدول الزمني فقط

### 3. إضافة Smart Suggestions Section

استيراد `SmartGroupSuggestions` من `src/components/recommendations/SmartGroupSuggestions.tsx` داخل `GroupDetails.tsx` وعرضه بشرط:
```
{sourcePlan && id && (
  <SmartGroupSuggestions
    groupId={id}
    city={group?.destination}
    destination={group?.destination}
  />
)}
```

### 4. دمج الميزانية في Summary

إضافة شريط Progress صغير تحت الـ Summary Grid مباشرة:
```tsx
{sourcePlan?.budgetValue && (
  <div className="px-1 space-y-1">
    <div className="flex justify-between text-[10px] text-muted-foreground">
      <span>الميزانية</span>
      <span>{totalExpenses} / {budgetValue} {currency}</span>
    </div>
    <Progress value={budgetUsed} className="h-1.5" />
  </div>
)}
```

## الملفات المتأثرة
| ملف | تغيير |
|---|---|
| `src/pages/GroupDetails.tsx` | شروط عرض ديناميكية + إضافة SmartGroupSuggestions + Budget bar في Summary |
| `src/components/group/GroupPlanSection.tsx` | حذف قسم الميزانية (ينتقل للـ Summary) |

## ترتيب التنفيذ
1. تعديل `GroupPlanSection` — إزالة Budget Card
2. تعديل `GroupDetails` — إضافة Budget bar + Smart Suggestions + شروط الإخفاء

