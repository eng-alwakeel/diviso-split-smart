
# المرحلة 3: Edge Function للاقتراح الذكي + تحسينات المشاركة

## نظرة عامة
هذه المرحلة تُنشئ Edge Function لاقتراح النرد الأنسب باستخدام DeepSeek، مع تحسينات لخاصية المشاركة.

---

## 1. Edge Function: `suggest-dice`

### الملف: `supabase/functions/suggest-dice/index.ts`

**الوظيفة:**
يقترح أي نرد يُعرض للمستخدم بناءً على:
- نوع المجموعة (أصدقاء / رحلة / عمل)
- عدد الأعضاء
- الوقت (صباح / ظهر / مساء / ليل)
- آخر نشاط

**Request Interface:**
```typescript
interface SuggestDiceRequest {
  group_type?: string;      // friends, trip, work, home
  member_count?: number;    // عدد الأعضاء
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  last_activity?: string;   // آخر نشاط (restaurant, cafe, etc)
  available_dice: string[]; // ['activity', 'food']
}
```

**Response Interface:**
```typescript
interface SuggestDiceResponse {
  suggested_dice: string[];  // ['activity'] أو ['food'] أو ['quick']
  priority: number;          // 1-10 مدى ملاءمة الاقتراح
  allow_dual_roll: boolean;  // هل يسمح بالنرد المزدوج
  reason?: string;           // سبب الاقتراح (للتصحيح)
}
```

**منطق DeepSeek:**
```typescript
const prompt = `أنت مساعد ذكي لتطبيق Diviso. بناءً على السياق التالي، اقترح أي نرد يُعرض للمستخدم.

السياق:
- نوع المجموعة: ${group_type || 'عام'}
- عدد الأعضاء: ${member_count || 'غير محدد'}
- الوقت: ${time_of_day}
- آخر نشاط: ${last_activity || 'لا يوجد'}
- النرد المتاح: ${available_dice.join(', ')}

القواعد:
1. في وقت الغداء أو العشاء (afternoon/evening) → أولوية لنرد الأكل
2. مجموعات الأصدقاء → كلا النردين متاحين
3. مجموعات العمل → نرد النشاط فقط
4. إذا آخر نشاط كان "restaurant" → اقترح نرد النشاط
5. في الصباح → نرد النشاط

أرجع JSON فقط:
{
  "suggested_dice": ["activity"],
  "priority": 8,
  "allow_dual_roll": true,
  "reason": "وقت الظهر مناسب للغداء"
}`;
```

**Fallback Logic:**
إذا فشل DeepSeek، يستخدم منطق بسيط:
```typescript
function getFallbackSuggestion(timeOfDay: string, groupType?: string): SuggestDiceResponse {
  // وقت الغداء أو العشاء → نرد الأكل
  if (timeOfDay === 'afternoon' || timeOfDay === 'evening') {
    return {
      suggested_dice: ['food'],
      priority: 7,
      allow_dual_roll: true
    };
  }
  
  // الافتراضي → نرد النشاط
  return {
    suggested_dice: ['activity'],
    priority: 5,
    allow_dual_roll: groupType === 'friends'
  };
}
```

---

## 2. تحسينات المشاركة

### تحديث: `src/components/dice/ShareDiceResult.tsx`

**التحسينات:**
1. إضافة زر Native Share (للموبايل)
2. إضافة إمكانية مشاركة الصورة
3. تتبع Analytics عند المشاركة

**الإضافات:**
```typescript
import { nativeShare, canNativeShare } from '@/lib/native';

// زر Native Share
const handleNativeShare = async () => {
  if (await canNativeShare()) {
    await nativeShare({
      title: t('share.native_title'),
      text: shareText,
      url: 'https://diviso.app'
    });
    trackEvent('dice_shared', { platform: 'native' });
  }
};
```

---

## 3. تحديث الترجمات

### `src/i18n/locales/ar/dice.json`

**الإضافات:**
```json
{
  "share": {
    "native_title": "نتيجة النرد",
    "share_image": "مشاركة كصورة",
    "copy": "نسخ",
    "copied_btn": "تم النسخ!"
  },
  "suggestion": {
    "smart_title": "اقتراح ذكي",
    "based_on_time": "بناءً على الوقت",
    "based_on_group": "بناءً على نوع المجموعة"
  }
}
```

---

## 4. تحديث `useDiceDecision.ts`

**التحسينات:**
- تتبع event المشاركة
- تحسين Fallback عند فشل Edge Function

---

## ملخص الملفات

| الملف | النوع | الوصف |
|-------|-------|-------|
| `supabase/functions/suggest-dice/index.ts` | جديد | Edge Function للاقتراح الذكي |
| `src/components/dice/ShareDiceResult.tsx` | تعديل | إضافة Native Share + Analytics |
| `src/i18n/locales/ar/dice.json` | تعديل | إضافة ترجمات المشاركة |
| `src/i18n/locales/en/dice.json` | تعديل | إضافة ترجمات المشاركة |

---

## Edge Function Structure

```text
supabase/functions/suggest-dice/
└── index.ts

Flow:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Request    │ --> │  DeepSeek   │ --> │  Response   │
│  (Context)  │     │  API Call   │     │  (JSON)     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                           │                    │
                    ┌──────┴──────┐      ┌──────┴──────┐
                    │   Error?    │ ---> │  Fallback   │
                    │   Timeout?  │      │  Logic      │
                    └─────────────┘      └─────────────┘
```

---

## Security & CORS

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// No auth required for suggestions (public endpoint)
// But we can optionally use auth for personalization
```

---

## الموارد المستخدمة

| المورد | الحالة |
|--------|--------|
| `DEEPSEEK_API_KEY` | ✅ موجود |
| DeepSeek API Endpoint | `https://api.deepseek.com/v1/chat/completions` |
| Model | `deepseek-chat` |

---

## Timeout & Performance

- Timeout: 5 ثواني للـ DeepSeek API
- Cache: لا حاجة (الاقتراح يعتمد على الوقت)
- Fallback: فوري في حال الفشل

---

## Testing Plan

1. اختبار بدون سياق → Activity Dice
2. اختبار وقت الغداء → Food Dice
3. اختبار مجموعة أصدقاء → Dual Roll متاح
4. اختبار فشل DeepSeek → Fallback يعمل

---

## قواعد مهمة

- ❌ لا ذكر "ذكاء اصطناعي" للمستخدم
- ✅ "اقتراح ذكي" فقط
- ✅ Fallback دائماً جاهز
- ✅ الاقتراح غير إلزامي
