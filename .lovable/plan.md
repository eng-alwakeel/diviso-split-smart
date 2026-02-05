

# خطة: إضافة استهلاك نقطة عند استخدام النرد

## ملخص
سيتم تعديل ميزة "خلّ النرد يقرر" بحيث تستهلك نقطة واحدة عند كل عملية رمي للنرد، مثل باقي العمليات في التطبيق.

---

## التغييرات المطلوبة

### 1. إضافة نوع العملية في قائمة التكاليف

**الملف:** `src/hooks/useUsageCredits.ts`

إضافة سطر جديد في `CREDIT_COSTS`:

```typescript
roll_dice: { type: 'roll_dice', cost: 1, nameAr: 'رمي النرد', nameEn: 'Roll Dice', gated: true },
```

---

### 2. تعديل hook النرد لاستهلاك النقاط

**الملف:** `src/hooks/useDiceDecision.ts`

- استيراد `useUsageCredits`
- التحقق من الرصيد قبل الرمي باستخدام `checkCredits('roll_dice')`
- إذا لم تتوفر نقاط كافية: إظهار حوار `ZeroCreditsPaywall`
- عند نجاح الرمي: استهلاك النقطة عبر `consumeCredits('roll_dice')`

---

### 3. تعديل واجهة DiceDecision

**الملف:** `src/components/dice/DiceDecision.tsx`

- إضافة حالة `showPaywall` للتحكم في ظهور حوار النقاط
- عرض `ZeroCreditsPaywall` عند عدم توفر نقاط
- تمرير callback لإعادة المحاولة بعد إغلاق الحوار

---

### 4. تعديل مكون النرد في الشات

**الملف:** `src/components/chat/DiceChatSheet.tsx`

- إضافة نفس منطق التحقق قبل رمي النرد في الشات
- عرض `ZeroCreditsPaywall` إذا لا توجد نقاط

---

### 5. تعديل صفحة النرد المستقلة

**الملف:** `src/pages/DiceDecisionPage.tsx`

- إضافة التحقق من النقاط قبل السماح بالرمي
- عرض الحوار المناسب عند انعدام الرصيد

---

## التفاصيل التقنية

### منطق الاستهلاك:

```typescript
// قبل الرمي
const creditCheck = await checkCredits('roll_dice');
if (!creditCheck.canPerform) {
  setShowPaywall(true);
  return;
}

// بعد نجاح الرمي
await consumeCredits('roll_dice');
```

### التوافق مع Ad Tokens و Paymentwall:
النظام الحالي يدعم تلقائياً استخدام التوكنات المجانية (من الإعلانات أو Paymentwall) قبل خصم النقاط العادية.

---

## الملفات المتأثرة

| الملف | نوع التغيير |
|-------|-------------|
| `src/hooks/useUsageCredits.ts` | إضافة `roll_dice` |
| `src/hooks/useDiceDecision.ts` | إضافة منطق التحقق والاستهلاك |
| `src/components/dice/DiceDecision.tsx` | إضافة Paywall |
| `src/components/chat/DiceChatSheet.tsx` | إضافة Paywall |
| `src/pages/DiceDecisionPage.tsx` | إضافة Paywall |

