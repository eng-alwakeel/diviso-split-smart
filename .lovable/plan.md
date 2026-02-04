
# المرحلة 2: مكونات UI والتكامل مع Dashboard & Groups

## نظرة عامة
هذه المرحلة تنشئ جميع مكونات الـ UI وتدمجها مع الصفحة الرئيسية والمجموعات.

---

## الملفات المطلوب إنشاؤها

### 1. `src/components/dice/DicePicker.tsx`
اختيار نوع النرد (Activity / Food / Quick)

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

**Props:**
- `onSelect: (dice: DiceType) => void`
- `suggestedDice?: DiceType` - للاقتراح الذكي
- `availableDice?: DiceType[]` - تحديد النرد المتاح

---

### 2. `src/components/dice/DiceResult.tsx`
عرض النتيجة مع أزرار التفاعل

```text
النتيجة الفردية:
┌─────────────────────────────────────────────────────────┐
│              🏕️                                        │
│           هواء طلق / بر                                │
│                                                         │
│  [ 👍 اعتماد ]  [ 🔄 إعادة ]  [ 📤 مشاركة ]           │
│                                                         │
│  💡 نكمل ونختار نوع الأكل؟ 🎲   (إذا مطعم)            │
└─────────────────────────────────────────────────────────┘
```

**Props:**
- `result: DiceResult | null`
- `dualResult: DualDiceResult | null`
- `hasRerolled: boolean`
- `showFoodPrompt: boolean`
- `onAccept: () => void`
- `onReroll: () => void`
- `onShare: () => void`
- `onContinueFood: () => void`

---

### 3. `src/components/dice/ShareDiceResult.tsx`
مشاركة النتيجة (WhatsApp, Twitter, نسخ)

**منطق المشاركة:**
```typescript
const getShareText = (result, dualResult, isRTL) => {
  if (dualResult) {
    return `🎲 النرد قرر:\n🎯 ${dualResult.activity.face.emoji} ${label}\n🍽️ ${dualResult.food.face.emoji} ${label}`;
  }
  return `🎲 النرد قرر: ${result.face.emoji} ${result.face.labelAr}!`;
};
```

---

### 4. `src/components/dice/HomeDiceBanner.tsx`
بانر جذاب على الصفحة الرئيسية

```text
┌─────────────────────────────────────────────────────────┐
│  🎲 محتار؟ خلّ النرد يقرر                              │
│  قرار سريع بدون نقاش! 😅                               │
│                                                         │
│         [ ارمِ النرد الآن 🎲 ]                         │
└─────────────────────────────────────────────────────────┘
```

**السلوك:**
- يفتح Dialog عند الضغط (ليس تنقل لصفحة جديدة)
- يستخدم نفس نمط `SmartPromotionBanner`

---

### 5. `src/components/dice/GroupDiceSuggestion.tsx`
اقتراح داخل المجموعات

```text
┌─────────────────────────────────────────────────────────┐
│  🎲 اقتراح سريع للمجموعة                               │
│  [ نرد النشاط 🎯 ]  [ نرد الأكل 🍽️ ]                  │
└─────────────────────────────────────────────────────────┘
```

**الظهور حسب نوع المجموعة:**
- `friends` → Activity + Food
- `trip/home/work` → Activity فقط

---

### 6. `src/components/dice/DiceDecision.tsx`
المكون الرئيسي (Dialog) الذي يجمع كل شيء

```typescript
interface DiceDecisionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;          // إذا من مجموعة
  groupType?: string;        // لتحديد النرد المتاح
  initialDice?: DiceType;    // نرد مبدئي
}
```

**الحالات:**
1. **Picker** - اختيار النرد
2. **Rolling** - أنيميشن الرمي
3. **Result** - عرض النتيجة
4. **Share** - مشاركة (اختياري)

---

### 7. `src/pages/DiceDecisionPage.tsx`
صفحة مستقلة `/dice` قابلة للمشاركة

---

## الملفات المطلوب تعديلها

### 1. `src/pages/OptimizedDashboard.tsx`
إضافة `HomeDiceBanner` بعد `SmartPromotionBanner`:

```typescript
import { HomeDiceBanner } from "@/components/dice/HomeDiceBanner";

// داخل JSX:
<SmartPromotionBanner />
<HomeDiceBanner />  {/* جديد */}
<div className="flex items-center justify-between">
```

---

### 2. `src/pages/GroupDetails.tsx`
إضافة `GroupDiceSuggestion` بعد `RecommendationNotification`:

```typescript
import { GroupDiceSuggestion } from "@/components/dice/GroupDiceSuggestion";

// بعد RecommendationNotification:
{recommendationsEnabled && showRecommendation && (
  <RecommendationNotification ... />
)}
<GroupDiceSuggestion 
  groupId={id}
  groupType={group?.group_type}
/>
```

---

### 3. `src/App.tsx`
إضافة route جديد:

```typescript
const LazyDiceDecisionPage = withLazyLoading(
  lazy(() => import("./pages/DiceDecisionPage"))
);

// داخل Routes:
<Route path="/dice" element={<LazyDiceDecisionPage />} />
```

---

## تفاصيل المكونات

### DiceDecision.tsx (المكون الرئيسي)

```typescript
export function DiceDecision({
  open,
  onOpenChange,
  groupId,
  groupType,
  initialDice
}: DiceDecisionProps) {
  const { t } = useTranslation('dice');
  const {
    selectedDice,
    isRolling,
    result,
    dualResult,
    hasRerolled,
    showFoodPrompt,
    selectDice,
    rollDice,
    rollQuickDice,
    rollFoodAfterActivity,
    acceptDecision,
    rerollDice,
    reset
  } = useDiceDecision();
  
  const [showShare, setShowShare] = useState(false);
  
  // تحديد الحالة الحالية
  const currentState = useMemo(() => {
    if (showShare) return 'share';
    if (result || dualResult) return 'result';
    if (isRolling) return 'rolling';
    if (selectedDice) return 'ready'; // جاهز للرمي
    return 'picker';
  }, [showShare, result, dualResult, isRolling, selectedDice]);

  // Handle close
  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {/* Content based on currentState */}
      </DialogContent>
    </Dialog>
  );
}
```

---

### HomeDiceBanner.tsx

```typescript
export function HomeDiceBanner() {
  const { t } = useTranslation('dice');
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <span className="text-2xl">🎲</span>
              </div>
              <div>
                <h3 className="font-semibold">{t('banner.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('banner.description')}
                </p>
              </div>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              {t('banner.cta')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DiceDecision
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
```

---

### GroupDiceSuggestion.tsx

```typescript
interface GroupDiceSuggestionProps {
  groupId?: string;
  groupType?: string;
  className?: string;
}

export function GroupDiceSuggestion({
  groupId,
  groupType,
  className
}: GroupDiceSuggestionProps) {
  const { t } = useTranslation('dice');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInitialDice, setSelectedInitialDice] = useState<DiceType>();

  // تحديد النرد المتاح حسب نوع المجموعة
  const availableDice = getDiceForGroupType(groupType);

  const handleDiceClick = (dice: DiceType) => {
    setSelectedInitialDice(dice);
    setDialogOpen(true);
  };

  return (
    <>
      <Card className={cn("border-primary/10", className)}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {t('group.suggestion_title')}
            </span>
            <div className="flex gap-2 flex-1 justify-end">
              {availableDice.map(dice => (
                <Button
                  key={dice.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDiceClick(dice)}
                >
                  {dice.icon} {dice.nameAr}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <DiceDecision
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        groupId={groupId}
        groupType={groupType}
        initialDice={selectedInitialDice}
      />
    </>
  );
}
```

---

## ملخص الملفات

| الملف | النوع | الوصف |
|-------|-------|-------|
| `src/components/dice/DicePicker.tsx` | جديد | اختيار نوع النرد |
| `src/components/dice/DiceResult.tsx` | جديد | عرض النتيجة + أزرار |
| `src/components/dice/ShareDiceResult.tsx` | جديد | مشاركة النتيجة |
| `src/components/dice/HomeDiceBanner.tsx` | جديد | بانر الصفحة الرئيسية |
| `src/components/dice/GroupDiceSuggestion.tsx` | جديد | اقتراح داخل المجموعات |
| `src/components/dice/DiceDecision.tsx` | جديد | المكون الرئيسي (Dialog) |
| `src/pages/DiceDecisionPage.tsx` | جديد | صفحة مستقلة /dice |
| `src/pages/OptimizedDashboard.tsx` | تعديل | إضافة HomeDiceBanner |
| `src/pages/GroupDetails.tsx` | تعديل | إضافة GroupDiceSuggestion |
| `src/App.tsx` | تعديل | إضافة route /dice |

---

## التفاعلات والحالات

```text
User Flow - الصفحة الرئيسية:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Banner     │ --> │  Picker     │ --> │  Rolling    │
│  (Home)     │     │  (Dialog)   │     │  (1.5s)     │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────┐     ┌─────┴─────────┐
                    │   Share     │ <-- │   Result      │
                    │  (Optional) │     │  (Actions)    │
                    └─────────────┘     └───────────────┘

User Flow - المجموعات:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Suggestion │ --> │  Rolling    │ --> │  Result     │
│  (Activity) │     │  (1.5s)     │     │  (مطعم)     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐     ┌──────┴──────┐
                    │  Dual       │ <-- │  Continue?  │
                    │  Result     │     │  (Food)     │
                    └─────────────┘     └─────────────┘
```

---

## UX Guidelines

- Dialog بدلاً من صفحة جديدة للتجربة السريعة
- أنيميشن 1.5 ثانية (موجود في `useDiceDecision`)
- Haptics عند الرمي والنتيجة (موجود)
- إعادة واحدة فقط (زر يصبح disabled بعدها)
- نبرة خفيفة وممتعة في جميع النصوص
