
# خطة: إضافة تفاعل "تغيير الدافع" لصفحة /launch

## الهدف
تحويل التجربة من عرض ثابت إلى تجربة تفاعلية حيث يمكن للمستخدم تغيير "من دفع" لكل مصروف ورؤية الأرصدة تتغير فوراً.

---

## الوضع الحالي

الصفحة `/launch` موجودة وتعمل بالفعل:
- 3 بطاقات سيناريوهات (سفر، طلعة، سكن) ✅
- فتح تلقائي عبر `?demo=travel` ✅
- عرض المصاريف والأرصدة ✅
- CTA بعد completion (Intersection Observer أو 8 ثواني) ✅
- زر المشاركة ✅

**المفقود:** تفاعل "تغيير الدافع" لكل مصروف

---

## الملفات المطلوب تعديلها

| الملف | نوع التغيير | الوصف |
|-------|-------------|-------|
| `src/components/launch/DemoExperience.tsx` | تعديل رئيسي | إضافة State للمصاريف + Dropdown تغيير الدافع + تحديث completion mode |
| `src/components/launch/DemoBalanceView.tsx` | تعديل بسيط | إضافة animation `transition-all duration-300` للأرقام |
| `src/pages/LaunchPage.tsx` | تعديل بسيط | تحديث نوع `completion_mode` ليشمل `'interaction'` |
| `src/data/demoScenarios.ts` | بدون تغيير | الهيكل الحالي يدعم التعديل |

---

## 1. تعديل `DemoExperience.tsx`

### أ) إضافة State جديد

```typescript
// State للمصاريف القابلة للتعديل
const [expenses, setExpenses] = useState<DemoExpense[]>(scenario.expenses);
const [hasInteracted, setHasInteracted] = useState(false);
```

### ب) تحديث Props

```typescript
// تحديث signature لـ onCompleted لتشمل 'interaction'
onCompleted: (durationSeconds: number, completionMode: 'balances_view' | 'timer' | 'interaction') => void;
```

### ج) إضافة دالة `handlePayerChange`

```typescript
const handlePayerChange = useCallback((expenseId: string, newPayerId: string) => {
  // 1. تحديث المصاريف في State
  setExpenses(prev => prev.map(exp => 
    exp.id === expenseId ? { ...exp, paidById: newPayerId } : exp
  ));
  
  // 2. تسجيل أول تفاعل فقط + إظهار CTA
  if (!hasInteracted) {
    setHasInteracted(true);
    
    // Event: demo_interaction
    trackEvent('demo_interaction', {
      type: scenario.id,
      interaction: 'change_paid_by',
      expense_id: expenseId
    });
    
    // اعتبار التجربة مكتملة
    markCompleted('interaction');
  }
}, [hasInteracted, scenario.id, markCompleted]);
```

### د) تعديل حساب الأرصدة

```typescript
// إعادة حساب balances عند تغيير expenses
const balances = useMemo(() => {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = totalExpenses / scenario.members.length;

  const calculated = scenario.members.map((member) => {
    const paid = expenses
      .filter((e) => e.paidById === member.id)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      member,
      paid,
      owed: perPerson,
      net: paid - perPerson,
    };
  });

  return calculated.sort((a, b) => b.net - a.net);
}, [expenses, scenario.members]);

// حساب المجموع ونصيب كل شخص
const totalExpensesAmount = useMemo(() => 
  expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

const perPerson = useMemo(() => 
  totalExpensesAmount / scenario.members.length, [totalExpensesAmount, scenario.members.length]);
```

### ه) تعديل عرض المصاريف (Dropdown)

استخدام `<select>` HTML بسيط للتوافق:

```typescript
{expenses.map((expense) => (
  <div key={expense.id} className="bg-card border border-border rounded-lg p-4">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{expense.icon}</span>
        <div>
          <p className="font-medium text-foreground">{expense.description}</p>
          
          {/* Dropdown تغيير الدافع */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">دفعها:</span>
            <select
              value={expense.paidById}
              onChange={(e) => handlePayerChange(expense.id, e.target.value)}
              className="text-sm bg-muted/50 border border-border rounded-md px-2 py-1 
                         text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50
                         cursor-pointer"
              dir="rtl"
            >
              {scenario.members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          
        </div>
      </div>
      <span className="font-bold text-foreground">
        {formatAmount(expense.amount, scenario.currency)}
      </span>
    </div>
  </div>
))}
```

### و) تعديل `markCompleted`

```typescript
const markCompleted = useCallback((mode: 'balances_view' | 'timer' | 'interaction') => {
  if (completedRef.current) return;
  completedRef.current = true;
  setIsCompleted(true);
  
  const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
  onCompleted(duration, mode);
}, [onCompleted]);
```

---

## 2. تعديل `DemoBalanceView.tsx`

### إضافة Animation للأرقام عند التغيير

```typescript
<div 
  key={balance.member.id}
  className={cn(
    "flex items-center justify-between p-3 rounded-lg transition-all duration-300",
    bgClass
  )}
>
  {/* ... */}
  <span className={cn("font-bold transition-all duration-300", textClass)}>
    {isPositive && '+'}
    {formatAmount(balance.net, currency)}
  </span>
</div>
```

---

## 3. تعديل `LaunchPage.tsx`

### تحديث نوع `handleExperienceCompleted`

```typescript
const handleExperienceCompleted = useCallback((
  durationSeconds: number, 
  completionMode: 'balances_view' | 'timer' | 'interaction'  // ← إضافة 'interaction'
) => {
  // ... نفس المنطق الحالي
}, [selectedScenario, completedScenarios, trackEvent]);
```

---

## 4. هيكل المصروف الجديد (UI)

```text
┌─────────────────────────────────────┐
│ 🏨 حجز الفندق             2,400 ر.س │
│                                     │
│ دفعها: [ أحمد ▼ ]                   │
│                                     │
└─────────────────────────────────────┘
```

عند الضغط على Dropdown:
```text
┌─────────────────────────────────────┐
│   أحمد   ✓                          │
│   سعود                              │
│   فيصل                              │
│   خالد                              │
└─────────────────────────────────────┘
```

---

## 5. تدفق التفاعل

```text
1. المستخدم يفتح التجربة
   ↓ [track: experience_opened]
   
2. يرى المصاريف مع "دفعها: [أحمد ▼]"
   
3. يضغط على Dropdown ويختار شخص آخر
   ↓
   → الأرصدة تتغير فوراً ✨
   → [track: demo_interaction] (أول مرة فقط)
   → [markCompleted('interaction')]
   
4. CTA يظهر + زر المشاركة ✅
```

---

## 6. Analytics Events

| Event | Parameters | متى يُسجل |
|-------|------------|----------|
| `demo_interaction` | `type`, `interaction: 'change_paid_by'`, `expense_id` | أول تفاعل فقط |
| `experience_completed` | `type`, `duration_seconds`, `completion_mode: 'interaction'` | عند أول تفاعل |

---

## 7. معايير القبول

| # | المعيار | كيفية التحقق |
|---|---------|-------------|
| 1 | المستخدم يقدر يغيّر "مين دفع" | Dropdown `<select>` لكل مصروف |
| 2 | الأرقام تتغير فورًا | `useState` + `useMemo` لإعادة الحساب |
| 3 | "له / عليه" تتبدل بصريًا | ألوان + نص + `transition-all duration-300` |
| 4 | CTA يظهر بعد التفاعل | `hasInteracted` → `isCompleted` |
| 5 | Event `demo_interaction` يُسجّل | أول تفاعل فقط عبر `hasInteracted` flag |

---

## ملخص التغييرات

| الملف | عدد الأسطر المتوقعة | التعقيد |
|-------|---------------------|---------|
| `DemoExperience.tsx` | ~40 سطر تعديل | متوسط |
| `DemoBalanceView.tsx` | ~5 أسطر تعديل | بسيط |
| `LaunchPage.tsx` | ~2 سطر تعديل | بسيط |

**الوقت المتوقع للتنفيذ:** 10-15 دقيقة
