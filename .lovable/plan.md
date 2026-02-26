

# ترقية نظام النرد الذكي V2 — خطة تنفيذ مرحلية

هذا تحديث شامل يتطلب تقسيمه لمراحل. كل مرحلة قابلة للتسليم بشكل مستقل.

---

## المرحلة 1: البيانات الأساسية + الأنواع الجديدة

### 1A. تحديث بيانات النرد (`src/data/diceData.ts`)

- توسيع نوع `DiceType.id` ليشمل: `'activity' | 'cuisine' | 'budget' | 'whopays' | 'task' | 'quick'`
- إضافة حقل `weight` اختياري لـ `DiceFace`
- تعريف الوجوه الجديدة:

**نرد المطابخ (cuisine)** - بديل نرد الأكل القديم:
سعودي، أمريكي، مكسيكي، إيطالي، آسيوي، مفاجأة

**نرد الميزانية (budget):**
اقتصادي جداً، 20-40، 40-70، 70-120، 150+، بدون ميزانية

**نرد مين يدفع (whopays):**
يعمل بشكل مختلف -- يختار عشوائياً من أعضاء المجموعة (بدون وجوه ثابتة)

**نرد مهمة اليوم (task):**
أضف مصروف، سوِّ تسوية، ذكّر بالدفع، راجع تقرير الأسبوع، عدّل اسم المجموعة، ادعُ عضو

- حذف نرد الأكل القديم (food) واستبداله بـ cuisine
- تحديث `shouldPromptFoodDice` ليصبح `shouldPromptCuisineDice` (عند نتيجة "مطعم")
- تحديث `getDiceForGroupType` للأنواع الجديدة

### 1B. جداول قاعدة البيانات (Migration)

```text
CREATE TABLE dice_types (
  id text PRIMARY KEY,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  enabled boolean DEFAULT true,
  rules_json jsonb DEFAULT '{}'::jsonb,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE dice_faces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dice_type_id text REFERENCES dice_types(id),
  value text NOT NULL,
  emoji text NOT NULL,
  label_ar text NOT NULL,
  label_en text NOT NULL,
  weight int DEFAULT 1,
  sort_order int DEFAULT 0
);
```

مع إدراج بيانات الأنواع الـ 5 ووجوهها.
ملاحظة: الجداول للمرجعية والتوسع المستقبلي. الكود الحالي سيظل يقرأ من الملف المحلي `diceData.ts` للسرعة.

### 1C. تحديث `dice_decisions.dice_type`

```text
-- توسيع القيم المقبولة
-- الجدول الحالي يقبل أي string، لا يحتاج تعديل schema
```

---

## المرحلة 2: كرت "اقتراح اليوم" الموحد + إزالة التكرار

### 2A. إزالة التكرار
- حذف `HomeDiceBanner` من `OptimizedDashboard.tsx`
- تعديل `DailyDiceCard` ليصبح الكرت الموحد الوحيد
- حذف أي ظهور مكرر للنرد في نفس الشاشة

### 2B. كرت "اقتراح اليوم" الجديد (`DailyDiceCard.tsx` -- إعادة بناء)
- عنوان ديناميكي: "جاهزين لقرار اليوم؟"
- إظهار نوع النرد المقترح تلقائياً (بناءً على السياق)
- زر رئيسي: "ارم النرد" -- يفتح dialog النرد مباشرة بالنوع المقترح
- خيار ثانوي صغير: "تغيير النوع" -- يفتح picker
- استخدام المنطق الذكي الموجود في `suggest-dice` edge function

### 2C. تحديث الاقتراح الذكي (`suggest-dice` + `useDiceDecision`)
- إضافة الأنواع الجديدة للمنطق:
  - فيه مديونية مفتوحة --> يقترح "مين يدفع"
  - ويكند مساء --> يقترح "نرد الطلعة"
  - نشاط قليل --> يقترح "مهمة اليوم"
  - وقت غداء/عشاء + نتيجة مطعم --> "نرد المطابخ"
- تمرير بيانات إضافية: `outstanding_balance`, `avg_spending`

---

## المرحلة 3: ربط النتائج بإجراءات مباشرة

### 3A. نظام الإجراءات (`src/data/diceActions.ts` -- ملف جديد)

جدول ربط كل نتيجة بإجراء:

| النتيجة | الإجراء |
|---------|---------|
| مطعم | فتح إضافة مصروف بتصنيف "مطعم" + اقتراح رمي نرد المطابخ |
| مكسيكي/إيطالي/... | فتح بحث خريطة مطاعم |
| 70-120 (ميزانية) | حفظ ميزانية اليوم للمجموعة |
| عضو عشوائي | إنشاء فاتورة باسمه |
| مهمة (أضف مصروف) | توجيه لصفحة إضافة المصروف |

### 3B. تحديث `DiceResultDisplay`
- إضافة زر "تنفيذ" ديناميكي بجانب "اعتماد"
- الزر يعتمد على نوع النتيجة (من جدول الإجراءات)
- بعد التنفيذ يتم تسجيل الحدث في analytics

### 3C. نرد "مين يدفع" -- منطق خاص
- يستدعي قائمة أعضاء المجموعة
- يختار عشوائياً
- يعرض اسم وصورة العضو
- زر "إنشاء فاتورة باسمه"

### 3D. نرد الميزانية -- منطق خاص
- بعد النتيجة يظهر زر "تثبيت ميزانية اليوم"
- يحفظ في جدول المجموعة أو metadata

---

## المرحلة 4: وضع القرار السريع المحدّث

- تحويل "quick" من نوع مستقل إلى **وضع** يدمج نردين
- خيارات الدمج:
  - طلعة + مطابخ
  - نشاط + ميزانية
- تحديث `rollQuickDice` في `useDiceDecision`
- تحديث `DualAnimatedDice` لدعم أي تركيبة نردين

---

## المرحلة 5: Streak النرد + Gamification

### 5A. تسجيل رمية النرد في Real Streak
- تحديث `rollDice` في `useDiceDecision` ليستدعي `logAction('dice_roll')`
- أول رمية يومياً = نقاط (يعتمد على النظام الموجود `useRealStreak`)

### 5B. عرض streak النرد
- إضافة عداد صغير في كرت "اقتراح اليوم": "3 أيام متتالية"
- عرض غير مزعج (أيقونة نار + رقم فقط)

---

## المرحلة 6: تحديث الترجمة + Edge Functions

### 6A. تحديث ملفات الترجمة
- `src/i18n/locales/ar/dice.json` و `en/dice.json`
- إضافة مفاتيح الأنواع الجديدة (cuisine, budget, whopays, task)
- إضافة نصوص الإجراءات

### 6B. تحديث `generate-dice-comment`
- إضافة الأنواع الجديدة في prompt
- تقليل timeout إلى 2 ثانية
- إضافة fallback للأنواع الجديدة

### 6C. تحديث `suggest-dice`
- إضافة `available_dice` الجديدة
- إضافة منطق المديونية والميزانية
- إضافة fallback محلي

---

## ملخص الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `src/data/diceData.ts` | إعادة بناء كامل -- أنواع جديدة |
| `src/data/diceActions.ts` | ملف جديد -- ربط نتائج بإجراءات |
| `src/hooks/useDiceDecision.ts` | دعم الأنواع الجديدة + streak |
| `src/components/daily-hub/DailyDiceCard.tsx` | إعادة بناء -- كرت موحد |
| `src/components/dice/DicePicker.tsx` | عرض الأنواع الجديدة |
| `src/components/dice/DiceResult.tsx` | زر تنفيذ ديناميكي |
| `src/components/dice/DiceDecision.tsx` | دعم الأنواع الجديدة |
| `src/components/dice/HomeDiceBanner.tsx` | حذف |
| `src/pages/OptimizedDashboard.tsx` | إزالة HomeDiceBanner |
| `src/pages/DiceDecisionPage.tsx` | دعم الأنواع الجديدة |
| `src/services/diceChatService.ts` | دعم الأنواع الجديدة |
| `src/i18n/locales/ar/dice.json` | مفاتيح جديدة |
| `src/i18n/locales/en/dice.json` | مفاتيح جديدة |
| `supabase/functions/generate-dice-comment/index.ts` | أنواع جديدة + timeout 2s |
| `supabase/functions/suggest-dice/index.ts` | منطق اقتراح محدّث |
| Migration SQL | جداول `dice_types` + `dice_faces` |

---

## ترتيب التنفيذ المقترح

نظراً لحجم التحديث، أقترح البدء بالمرحلة **1 + 2** أولاً (البيانات + الكرت الموحد) ثم نكمل باقي المراحل تباعاً. كل مرحلة تعمل بشكل مستقل.

هل توافق على البدء بالمرحلة 1 و 2؟

