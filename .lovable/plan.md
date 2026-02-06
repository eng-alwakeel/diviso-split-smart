

# خطة: تصحيح إحصائيات الإحالات

## المشكلة
الإحصائيات تحسب دعوات المجموعات (`group_invite`) كإحالات ناجحة، بينما يجب أن تُحسب فقط الإحالات المباشرة (`manual` / `direct`).

## الإحصائيات الحالية:
| النوع | العدد |
|-------|-------|
| `group_invite` - joined | 28 ❌ لا يجب احتسابها |
| `manual` - joined | 1 ✅ إحالة حقيقية |
| `manual` - expired | 5 |

## الحل

### تعديل ملف واحد فقط: `src/hooks/useReferralStats.ts`

**التغيير:**
استبعاد الإحالات من نوع `group_invite` من الإحصائيات.

```typescript
// قبل (يجلب كل الإحالات)
const { data: referrals } = await supabase
  .from('referrals')
  .select('...')
  .eq('inviter_id', user.id)

// بعد (يستبعد دعوات المجموعات)
const { data: referrals } = await supabase
  .from('referrals')
  .select('...')
  .eq('inviter_id', user.id)
  .neq('referral_source', 'group_invite')  // ✅ إضافة هذا السطر
```

## النتيجة المتوقعة

**قبل:**
- إحالات ناجحة: 28 (خاطئ)

**بعد:**
- إحالات ناجحة: 1 (صحيح)
- إجمالي الإحالات: 6 (manual فقط)

## ملاحظات
- ❌ **لا نعدل** منطق دعوة المجموعات
- ❌ **لا نحذف** أي بيانات
- ✅ **فقط** نغير طريقة عرض الإحصائيات
- ✅ النقاط المكتسبة سابقاً تبقى كما هي

