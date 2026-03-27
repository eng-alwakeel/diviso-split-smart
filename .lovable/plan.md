

# تصحيح قيم الصفحة الرئيسية — احتساب التسويات + فصل المجموعات النشطة

## المشكلة
1. **التسويات مفقودة**: `useDashboardData` يحسب `myPaid` و `myOwed` من جداول `expenses` و `expense_splits` مباشرة **بدون احتساب التسويات**. لذلك حتى لو سويت تسوية، الرصيد يظل يعرض المبلغ القديم
2. **عدد المجموعات**: يعرض كل المجموعات (5) بدون تمييز بين نشطة ومؤرشفة

## الحل

### 1. `src/hooks/useDashboardData.ts` — احتساب التسويات في الأرصدة

**إضافة استعلام التسويات** بجانب المصاريف:
```ts
// جلب التسويات المؤكدة (المدفوعة من المستخدم والمستلمة)
settlementsOutResult = supabase
  .from('settlements')
  .select('amount')
  .eq('from_user_id', uid)
  .in('status', ['confirmed', 'pending'])

settlementsInResult = supabase
  .from('settlements')
  .select('amount')
  .eq('to_user_id', uid)
  .in('status', ['confirmed', 'pending'])
```

**تعديل حساب الرصيد**:
```
netBalance = (totalPaid + settlementsOut) - (totalOwed + settlementsIn)
// أو بشكل أوضح:
// myPaid = totalPaid + settlementsOut (ما دفعته فعلاً)
// myOwed = totalOwed - settlementsOut (ما عليك بعد التسويات)
```

**فصل عدد المجموعات**: جلب المجموعات مع معلومة `archived_at` لحساب:
- `groupsCount`: إجمالي المجموعات
- `activeGroupsCount`: المجموعات النشطة فقط

### 2. `src/components/dashboard/SimpleStatsGrid.tsx` — عرض المعلومات الصحيحة

**تحديث كارت المجموعات** لعرض عدد النشط من الإجمالي:
```
المجموعات: 5
subtitle: "0 نشطة"
```

**تحديث props** لاستقبال `activeGroupsCount`

### 3. `src/components/performance/OptimizedDashboard.tsx` — تمرير القيمة الجديدة

تمرير `activeGroupsCount` للـ `SimpleStatsGrid`

## الملفات المتأثرة
| ملف | تغيير |
|---|---|
| `src/hooks/useDashboardData.ts` | إضافة استعلام التسويات + فصل المجموعات النشطة/المؤرشفة |
| `src/components/dashboard/SimpleStatsGrid.tsx` | عرض "X نشطة" كـ subtitle + props جديد |
| `src/components/performance/OptimizedDashboard.tsx` | تمرير activeGroupsCount |

