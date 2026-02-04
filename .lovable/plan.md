

# خطة تنفيذ ميزة 🎲 Dice Decision – خلّ النرد يقرر

## نظرة عامة

ميزة Dice Decision تحوّل Diviso من تطبيق تقسيم مصاريف إلى رفيق قرار جماعي يكسر الحيرة الاجتماعية بطريقة ممتعة وقابلة للمشاركة.

---

## هيكل الملفات الجديدة

```text
src/
├── components/
│   └── dice/
│       ├── DiceDecision.tsx           # الصفحة/Modal الرئيسية
│       ├── AnimatedDice.tsx           # أنيميشن النرد ثلاثي الأبعاد
│       ├── DiceResult.tsx             # عرض النتيجة + أزرار التفاعل
│       ├── DicePicker.tsx             # اختيار نوع النرد
│       ├── ShareDiceResult.tsx        # مشاركة النتيجة
│       ├── HomeDiceBanner.tsx         # بانر الصفحة الرئيسية
│       └── GroupDiceSuggestion.tsx    # اقتراح داخل المجموعات
├── hooks/
│   └── useDiceDecision.ts             # منطق النرد + حالة
├── data/
│   └── diceData.ts                    # بيانات أوجه النرد الثابتة
└── pages/
    └── DiceDecisionPage.tsx           # صفحة مستقلة /dice

supabase/
└── functions/
    └── suggest-dice/                  # Edge function للاقتراح الذكي
        └── index.ts

src/i18n/locales/
├── ar/dice.json                       # ترجمة عربية
└── en/dice.json                       # ترجمة إنجليزية
```

---

## المرحلة 1: البنية الأساسية

### 1.1 بيانات النرد الثابتة

**ملف: `src/data/diceData.ts`**

```typescript
export interface DiceFace {
  id: string;
  emoji: string;
  labelAr: string;
  labelEn: string;
}

export interface DiceType {
  id: 'activity' | 'food' | 'quick';
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  faces: DiceFace[];
  color: string;
}

export const ACTIVITY_FACES: DiceFace[] = [
  { id: 'restaurant', emoji: '🍽️', labelAr: 'مطعم', labelEn: 'Restaurant' },
  { id: 'cafe', emoji: '☕', labelAr: 'كافيه', labelEn: 'Café' },
  { id: 'home', emoji: '🏠', labelAr: 'جلسة بيت', labelEn: 'Stay Home' },
  { id: 'drive', emoji: '🚗', labelAr: 'طلعة سريعة', labelEn: 'Quick Drive' },
  { id: 'entertainment', emoji: '🎬', labelAr: 'ترفيه / سينما', labelEn: 'Entertainment' },
  { id: 'outdoor', emoji: '🏕️', labelAr: 'هواء طلق / بر', labelEn: 'Outdoors' }
];

export const FOOD_FACES: DiceFace[] = [
  { id: 'rice', emoji: '🍚', labelAr: 'أكلة رز', labelEn: 'Rice Dish' },
  { id: 'stew', emoji: '🍲', labelAr: 'مرق / يخنة', labelEn: 'Stew' },
  { id: 'chicken', emoji: '🍗', labelAr: 'دجاج', labelEn: 'Chicken' },
  { id: 'meat', emoji: '🥩', labelAr: 'لحم', labelEn: 'Meat' },
  { id: 'healthy', emoji: '🥗', labelAr: 'خفيف / صحي', labelEn: 'Light/Healthy' },
  { id: 'surprise', emoji: '🎲', labelAr: 'مفاجأة', labelEn: 'Surprise' }
];

export const DICE_TYPES: DiceType[] = [
  {
    id: 'activity',
    nameAr: 'نرد النشاط',
    nameEn: 'Activity Dice',
    descriptionAr: 'وش نسوي؟',
    descriptionEn: 'What to do?',
    color: 'from-blue-500 to-indigo-600',
    faces: ACTIVITY_FACES
  },
  {
    id: 'food',
    nameAr: 'نرد الأكل',
    nameEn: 'Food Dice',
    descriptionAr: 'وش نأكل؟',
    descriptionEn: 'What to eat?',
    color: 'from-orange-500 to-red-600',
    faces: FOOD_FACES
  },
  {
    id: 'quick',
    nameAr: 'نرد سريع',
    nameEn: 'Quick Decision',
    descriptionAr: 'نشاط + أكل بضغطة واحدة',
    descriptionEn: 'Activity + Food in one tap',
    color: 'from-purple-500 to-pink-600',
    faces: [] // يستخدم كلا النردين
  }
];
```

### 1.2 Hook الرئيسي

**ملف: `src/hooks/useDiceDecision.ts`**

```typescript
interface DiceResult {
  diceType: DiceType;
  face: DiceFace;
  timestamp: Date;
}

interface UseDiceDecisionReturn {
  // الحالة
  selectedDice: DiceType | null;
  isRolling: boolean;
  result: DiceResult | null;
  dualResult: { activity: DiceResult; food: DiceResult } | null;
  hasRerolled: boolean;
  
  // الإجراءات
  selectDice: (type: DiceType) => void;
  rollDice: () => Promise<void>;
  rollQuickDice: () => Promise<void>;
  acceptDecision: () => void;
  rerollDice: () => void;
  shareResult: (platform: string) => Promise<void>;
  reset: () => void;
  
  // الاقتراح الذكي
  suggestedDice: DiceType | null;
  loadSuggestion: (context: DiceContext) => Promise<void>;
}
```

**المنطق:**
- استخدام `Math.random()` لاختيار الوجه عشوائياً
- حفظ حالة `hasRerolled` للسماح بإعادة واحدة فقط
- استخدام `hapticImpact` من `src/lib/native.ts` للاهتزاز
- تتبع الأحداث عبر `useAnalyticsEvents`

### 1.3 أنيميشن النرد

**ملف: `src/components/dice/AnimatedDice.tsx`**

```typescript
// CSS 3D transforms للأنيميشن
// مدة الأنيميشن: 1-2 ثانية
// يدعم نرد واحد أو نردين (Quick mode)

interface AnimatedDiceProps {
  faces: DiceFace[];
  isRolling: boolean;
  resultFace?: DiceFace;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**CSS Keyframes:**
```css
@keyframes dice-roll {
  0% { transform: rotateX(0) rotateY(0) rotateZ(0); }
  25% { transform: rotateX(180deg) rotateY(90deg) rotateZ(45deg); }
  50% { transform: rotateX(360deg) rotateY(180deg) rotateZ(90deg); }
  75% { transform: rotateX(540deg) rotateY(270deg) rotateZ(135deg); }
  100% { transform: rotateX(720deg) rotateY(360deg) rotateZ(180deg); }
}
```

---

## المرحلة 2: المكونات UI

### 2.1 بانر الصفحة الرئيسية

**ملف: `src/components/dice/HomeDiceBanner.tsx`**

```text
┌─────────────────────────────────────────────────────────┐
│  🎲 محتار؟ خلّ النرد يقرر                              │
│                                                         │
│  قرار سريع بدون نقاش! 😅                               │
│                                                         │
│         [ ارمِ النرد الآن 🎲 ]                         │
└─────────────────────────────────────────────────────────┘
```

**التصميم:**
- خلفية متدرجة خفيفة (primary/10)
- أيقونة نرد متحركة
- زر CTA واضح
- يفتح Dialog/Sheet بدلاً من التنقل لصفحة جديدة

### 2.2 اختيار النرد

**ملف: `src/components/dice/DicePicker.tsx`**

```text
┌─────────────────────────────────────────────────────────┐
│  اختر نوع النرد                                        │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   🎯        │  │   🍽️        │  │   ⚡        │    │
│  │ نرد النشاط │  │ نرد الأكل  │  │ قرار سريع  │    │
│  │ وش نسوي؟  │  │ وش نأكل؟  │  │ نشاط + أكل │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 2.3 عرض النتيجة

**ملف: `src/components/dice/DiceResult.tsx`**

```text
النتيجة الفردية:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                     🏕️                                 │
│                                                         │
│                هواء طلق / بر                           │
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ 👍 اعتماد   │ │ 🔄 إعادة    │ │ 📤 مشاركة   │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘

النتيجة المزدوجة (Quick):
┌─────────────────────────────────────────────────────────┐
│   🎯 النشاط           🍽️ الأكل                        │
│      🍽️                  🍚                            │
│      مطعم               أكلة رز                        │
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ 👍 اعتماد   │ │ 🔄 إعادة    │ │ 📤 مشاركة   │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

**قواعد الأزرار:**
- زر "إعادة" يعمل مرة واحدة فقط
- بعد الضغط على "إعادة" يختفي أو يصبح معطلاً

### 2.4 اقتراح داخل المجموعات

**ملف: `src/components/dice/GroupDiceSuggestion.tsx`**

```text
┌─────────────────────────────────────────────────────────┐
│  🎲 اقتراح سريع للمجموعة                               │
│  [ نرد النشاط 🎯 ]  [ نرد الأكل 🍽️ ]                  │
└─────────────────────────────────────────────────────────┘
```

**الظهور حسب نوع المجموعة:**
- `friends` → Activity + Food
- `trip` → Activity فقط
- `home` → Activity فقط
- `work` → Activity فقط

---

## المرحلة 3: Edge Function للاقتراح الذكي

**ملف: `supabase/functions/suggest-dice/index.ts`**

```typescript
interface SuggestDiceRequest {
  group_type?: string;
  member_count?: number;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  last_activity?: string;
  available_dice: string[];
}

interface SuggestDiceResponse {
  suggested_dice: string[];  // ['activity'] أو ['food'] أو ['activity', 'food']
  priority: number;
  allow_dual_roll?: boolean;
}
```

**استخدام DeepSeek:**
- `DEEPSEEK_API_KEY` موجود مسبقاً ✅
- Prompt بسيط لاقتراح النرد الأنسب
- لا يغير النتيجة، فقط يقترح
- Fallback: `activity` في حال الفشل

**مثال Prompt:**
```text
أنت مساعد ذكي لتطبيق Diviso. بناءً على السياق التالي، اقترح أي نرد يُعرض للمستخدم:

- نوع المجموعة: {group_type}
- عدد الأعضاء: {member_count}
- الوقت: {time_of_day}
- النرد المتاح: ['activity', 'food']

أرجع JSON:
{
  "suggested_dice": ["activity"],
  "priority": 1
}
```

---

## المرحلة 4: التكامل مع الصفحات

### 4.1 Dashboard.tsx

```typescript
// إضافة import
import { HomeDiceBanner } from "@/components/dice/HomeDiceBanner";

// إضافة بعد OnboardingProgress
<OnboardingProgress />
<HomeDiceBanner /> {/* جديد */}
<SimpleStatsGrid ... />
```

### 4.2 GroupDetails.tsx

```typescript
// إضافة import
import { GroupDiceSuggestion } from "@/components/dice/GroupDiceSuggestion";

// إضافة بعد RecommendationNotification
{recommendationsEnabled && showRecommendation && (
  <RecommendationNotification ... />
)}
<GroupDiceSuggestion groupType={group?.group_type} /> {/* جديد */}
```

### 4.3 App.tsx - Route جديد

```typescript
const LazyDiceDecisionPage = withLazyLoading(lazy(() => import("./pages/DiceDecisionPage")));

// داخل Routes
<Route path="/dice" element={<LazyDiceDecisionPage />} />
```

---

## المرحلة 5: المشاركة

**ملف: `src/components/dice/ShareDiceResult.tsx`**

```typescript
// نفس نمط ShareableAchievementCard

const getShareText = (result: DiceResult, isRTL: boolean) => {
  const emoji = result.face.emoji;
  const label = isRTL ? result.face.labelAr : result.face.labelEn;
  
  return isRTL
    ? `🎲 النرد قرر: ${emoji} ${label}!\n\nخلّ النرد يقرر عنكم في Diviso\nhttps://diviso.app`
    : `🎲 The dice decided: ${emoji} ${label}!\n\nLet the dice decide in Diviso\nhttps://diviso.app`;
};
```

**المنصات:**
- WhatsApp
- Twitter
- نسخ الرابط

---

## المرحلة 6: التحليلات

### تحديث `useAnalyticsEvents.ts`

```typescript
const EVENT_CATEGORIES: Record<string, EventCategory> = {
  // ... الموجود
  
  // Dice Decision events
  dice_opened: 'engagement',
  dice_rolled: 'engagement',
  dice_dual_rolled: 'engagement',
  dice_rerolled: 'engagement',
  decision_accepted: 'engagement',
  dice_shared: 'growth',
  split_started_after_dice: 'engagement',
};
```

### أهم KPI

```typescript
// تتبع عندما يبدأ المستخدم تقسيم بعد استخدام النرد
trackEvent('split_started_after_dice', {
  dice_type: result.diceType.id,
  result_face: result.face.id,
  group_id: groupId
});
```

---

## المرحلة 7: الترجمات

**ملف: `src/i18n/locales/ar/dice.json`**

```json
{
  "banner": {
    "title": "محتار؟ خلّ النرد يقرر",
    "description": "قرار سريع بدون نقاش! 😅",
    "cta": "ارمِ النرد الآن 🎲"
  },
  "picker": {
    "title": "اختر نوع النرد",
    "activity": {
      "name": "نرد النشاط",
      "description": "وش نسوي؟"
    },
    "food": {
      "name": "نرد الأكل",
      "description": "وش نأكل؟"
    },
    "quick": {
      "name": "قرار سريع",
      "description": "نشاط + أكل بضغطة واحدة"
    }
  },
  "result": {
    "activity_label": "النشاط",
    "food_label": "الأكل",
    "accept": "اعتماد",
    "reroll": "إعادة",
    "share": "مشاركة",
    "continue_food": "نكمل ونختار نوع الأكل؟ 🎲",
    "split_now": "قسّم التكلفة الآن"
  },
  "group": {
    "suggestion_title": "اقتراح سريع للمجموعة"
  },
  "share": {
    "text": "🎲 النرد قرر: {{emoji}} {{label}}!\n\nخلّ النرد يقرر عنكم في Diviso",
    "copied": "تم نسخ النص!"
  }
}
```

---

## ملخص الملفات

| المرحلة | الملفات | النوع |
|---------|---------|-------|
| 1 | `src/data/diceData.ts` | جديد |
| 1 | `src/hooks/useDiceDecision.ts` | جديد |
| 1 | `src/components/dice/AnimatedDice.tsx` | جديد |
| 2 | `src/components/dice/DicePicker.tsx` | جديد |
| 2 | `src/components/dice/DiceResult.tsx` | جديد |
| 2 | `src/components/dice/HomeDiceBanner.tsx` | جديد |
| 2 | `src/components/dice/GroupDiceSuggestion.tsx` | جديد |
| 2 | `src/components/dice/DiceDecision.tsx` | جديد |
| 3 | `supabase/functions/suggest-dice/index.ts` | جديد |
| 4 | `src/pages/DiceDecisionPage.tsx` | جديد |
| 4 | `src/pages/Dashboard.tsx` | تعديل |
| 4 | `src/pages/GroupDetails.tsx` | تعديل |
| 4 | `src/App.tsx` | تعديل |
| 5 | `src/components/dice/ShareDiceResult.tsx` | جديد |
| 6 | `src/hooks/useAnalyticsEvents.ts` | تعديل |
| 7 | `src/i18n/locales/ar/dice.json` | جديد |
| 7 | `src/i18n/locales/en/dice.json` | جديد |

---

## الموارد المتاحة

| المورد | الحالة |
|--------|--------|
| `DEEPSEEK_API_KEY` | ✅ موجود |
| `@capacitor/haptics` | ✅ مثبت |
| `src/lib/native.ts` (hapticImpact) | ✅ موجود |
| نمط المشاركة (ShareableAchievementCard) | ✅ موجود |
| نظام Analytics | ✅ موجود |
| نظام i18n | ✅ موجود |

---

## Fallback Strategy

| الحالة | الـ Fallback |
|--------|--------------|
| فشل DeepSeek | عرض Activity Dice |
| فشل الاهتزاز | يكمل بدون اهتزاز |
| فشل المشاركة | نسخ النص فقط |
| لا توجد مجموعة | يعمل فردياً |

---

## قواعد UX مهمة

- ❌ لا ذكر "ذكاء اصطناعي"
- ✅ استخدام "اقتراح ذكي"
- ✅ نبرة خفيفة وممتعة
- ✅ إعادة واحدة فقط
- ✅ القرار غير إلزامي
- ✅ يعمل بدون مجموعة

---

## خطة التنفيذ

| الجلسة | المحتوى |
|--------|---------|
| 1 | البيانات + Hook + أنيميشن النرد |
| 2 | مكونات UI + التكامل مع Dashboard & Groups |
| 3 | Edge Function + المشاركة |
| 4 | Analytics + الترجمات + SEO (مقال + FAQ) |

