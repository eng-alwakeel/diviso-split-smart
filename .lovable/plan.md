

# خطة: إضافة تغيير مبلغ المصروف (+/−) لصفحة /launch

## الهدف
إضافة تفاعل ثانٍ: أزرار (+) و (−) بجانب كل مصروف لتغيير المبلغ فوريًا مع الحدود المحددة.

---

## الوضع الحالي

| الميزة | الحالة |
|--------|--------|
| تغيير "من دفع" (Dropdown) | ✅ موجود ويعمل |
| إعادة حساب الأرصدة فوريًا | ✅ موجود |
| تسجيل `demo_interaction` | ✅ موجود |
| CTA بعد التفاعل | ✅ موجود |
| Animation للأرقام | ✅ موجود |
| **أزرار (+/−) لتغيير المبلغ** | ❌ غير موجود |

---

## الملف الوحيد المطلوب تعديله

| الملف | التعديل |
|-------|---------|
| `src/components/launch/DemoExperience.tsx` | إضافة أزرار (+/−) + دالة `handleAmountChange` + دالة `registerInteraction` مشتركة |

**ملاحظة:** `DemoBalanceView.tsx` و `LaunchPage.tsx` لا يحتاجان تعديل - كل شيء جاهز فيهما.

---

## التغييرات المطلوبة

### 1. إضافة دالة `clamp` للحد من القيم

```typescript
const clamp = (value: number, min: number, max: number) => 
  Math.max(min, Math.min(max, value));
```

### 2. إنشاء دالة `registerInteraction` مشتركة

```typescript
const registerInteraction = useCallback((
  expenseId: string, 
  type: 'change_paid_by' | 'change_amount'
) => {
  if (hasInteracted) return;
  
  setHasInteracted(true);
  
  trackEvent('demo_interaction', {
    scenario: scenario.id,
    interaction: type,
    expense_id: expenseId,
  });
  
  markCompleted('interaction');
}, [hasInteracted, scenario.id, trackEvent, markCompleted]);
```

### 3. تحديث `handlePayerChange` لاستخدام الدالة المشتركة

```typescript
const handlePayerChange = useCallback((expenseId: string, newPayerId: string) => {
  setExpenses(prev => prev.map(exp => 
    exp.id === expenseId ? { ...exp, paidById: newPayerId } : exp
  ));
  
  registerInteraction(expenseId, 'change_paid_by');
}, [registerInteraction]);
```

### 4. إضافة دالة `handleAmountChange`

```typescript
const handleAmountChange = useCallback((expenseId: string, delta: number) => {
  setExpenses(prev => prev.map(exp => 
    exp.id === expenseId 
      ? { ...exp, amount: clamp(exp.amount + delta, 10, 5000) }
      : exp
  ));
  
  registerInteraction(expenseId, 'change_amount');
}, [registerInteraction]);
```

### 5. تحديث UI المصروف

إضافة أزرار (+/−) بجانب المبلغ:

```text
┌─────────────────────────────────────────────┐
│ 🏨 حجز الفندق                               │
│                                             │
│ دفعها: [ أحمد ▼ ]                           │
│                                             │
│        [−] 2,400 ر.س [+]                    │
└─────────────────────────────────────────────┘
```

الكود:
```typescript
<div className="flex items-center gap-2">
  <button
    onClick={() => handleAmountChange(expense.id, -10)}
    disabled={expense.amount <= 10}
    className="w-8 h-8 rounded-full bg-muted/70 hover:bg-muted 
               flex items-center justify-center text-foreground
               disabled:opacity-30 disabled:cursor-not-allowed
               transition-all duration-200"
    aria-label="تقليل المبلغ"
  >
    <Minus className="h-4 w-4" />
  </button>
  
  <span className="font-bold text-foreground min-w-[80px] text-center transition-all duration-200">
    {formatAmount(expense.amount, scenario.currency)}
  </span>
  
  <button
    onClick={() => handleAmountChange(expense.id, 10)}
    disabled={expense.amount >= 5000}
    className="w-8 h-8 rounded-full bg-muted/70 hover:bg-muted 
               flex items-center justify-center text-foreground
               disabled:opacity-30 disabled:cursor-not-allowed
               transition-all duration-200"
    aria-label="زيادة المبلغ"
  >
    <Plus className="h-4 w-4" />
  </button>
</div>
```

---

## حدود المبالغ

| الحد | القيمة |
|------|--------|
| الحد الأدنى | 10 ر.س |
| الحد الأقصى | 5,000 ر.س |
| مقدار التغيير | 10 ر.س لكل نقرة |

---

## تدفق التفاعل

```text
1. المستخدم يفتح التجربة
   
2. يرى المصاريف مع:
   - Dropdown "دفعها" ✅
   - أزرار (+/−) للمبلغ ✨ جديد

3. أي تفاعل (تغيير دافع أو مبلغ):
   ↓
   → الأرصدة تتغير فوراً
   → [track: demo_interaction] (أول مرة فقط)
   → CTA يظهر
```

---

## Analytics Events

| Event | Parameters | متى |
|-------|------------|-----|
| `demo_interaction` | `scenario`, `interaction: 'change_amount'`, `expense_id` | أول تغيير مبلغ |

---

## معايير القبول

| # | المعيار |
|---|---------|
| 1 | أزرار (+/−) تظهر بجانب كل مبلغ |
| 2 | الضغط على (+) يزيد المبلغ بـ 10 ر.س |
| 3 | الضغط على (−) يقلل المبلغ بـ 10 ر.س |
| 4 | المبلغ لا يقل عن 10 ولا يزيد عن 5000 |
| 5 | الأرصدة تتغير فوراً |
| 6 | CTA يظهر بعد أول تفاعل |
| 7 | الزر يكون معطل (disabled) عند الوصول للحد |

---

## ملخص التغييرات

| الملف | الأسطر | التعقيد |
|-------|--------|---------|
| `DemoExperience.tsx` | ~35 سطر إضافة/تعديل | متوسط |

**الوقت المتوقع:** 5-10 دقائق

