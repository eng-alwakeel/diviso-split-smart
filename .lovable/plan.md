

# خطة: توسيع تجارب صفحة /launch

## الهدف
إضافة 6 تجارب ثانوية قابلة للإظهار عبر زر "عرض المزيد" مع الحفاظ على التركيز والتحويل.

---

## الوضع الحالي

| العنصر | الحالة |
|--------|--------|
| 3 تجارب أساسية (travel, friends, housing) | ✅ موجود |
| DemoExperience تفاعلي | ✅ موجود |
| تغيير الدافع + المبلغ | ✅ موجود |
| CTA + Analytics | ✅ موجود |
| **زر "عرض المزيد"** | ❌ غير موجود |
| **6 تجارب إضافية** | ❌ غير موجود |

---

## الملفات المطلوب تعديلها

| الملف | التعديل |
|-------|---------|
| `src/data/demoScenarios.ts` | إضافة 6 سيناريوهات + `tier` property + تحديث Types |
| `src/pages/LaunchPage.tsx` | إضافة زر "عرض المزيد" + حالة إظهار + تمرير tier للـ Analytics |
| `src/components/launch/ExperienceCard.tsx` | دعم حجم ثانوي (`variant: 'primary' | 'secondary'`) |

---

## 1. تعديل `demoScenarios.ts`

### A) تحديث Type لدعم التجارب الجديدة

```typescript
export interface DemoScenario {
  id: ScenarioType;
  icon: string;
  title: string;
  subtitle: string;
  groupName: string;
  currency: string;
  members: DemoMember[];
  expenses: DemoExpense[];
  tier: 'primary' | 'secondary';
}

export type ScenarioType = 
  | 'travel' | 'friends' | 'housing'  // Primary
  | 'activities' | 'desert' | 'groups' | 'family' | 'carpool' | 'events';  // Secondary
```

### B) إضافة `tier: 'primary'` للتجارب الحالية

```typescript
{
  id: 'travel',
  tier: 'primary',
  // ... باقي البيانات
}
```

### C) إضافة 6 تجارب جديدة

| id | icon | title | subtitle | groupName |
|----|------|-------|----------|-----------|
| `activities` | 🎯 | نشاط | بولينج – سينما – ألعاب | شلة النشاط |
| `desert` | 🏕️ | رحلة بر | مخيم – أكل – معدات | رحلة البر |
| `groups` | 👥 | مجموعة | فعاليات أو اشتراك جماعي | المجموعة |
| `family` | 👨‍👩‍👧 | عائلة | رحلة أو مصاريف عائلية | العائلة |
| `carpool` | 🚗 | مشوار مشترك | بنزين – مواقف | المشوار |
| `events` | 🎉 | مناسبة | هدية – حجز – تجهيز | المناسبة |

### D) إضافة Helper Functions

```typescript
export const PRIMARY_SCENARIOS = DEMO_SCENARIOS.filter(s => s.tier === 'primary');
export const SECONDARY_SCENARIOS = DEMO_SCENARIOS.filter(s => s.tier === 'secondary');
```

---

## 2. تعديل `LaunchPage.tsx`

### A) إضافة State جديد

```typescript
const [showSecondary, setShowSecondary] = useState(false);
```

### B) استيراد التجارب المفلترة

```typescript
import { 
  PRIMARY_SCENARIOS,
  SECONDARY_SCENARIOS,
  getScenarioById,
  type ScenarioType 
} from '@/data/demoScenarios';
```

### C) تحديث دعم Query Params

```typescript
// دعم جميع أنواع السيناريوهات في ?demo=
const validScenarios = ['travel', 'friends', 'housing', 'activities', 'desert', 'groups', 'family', 'carpool', 'events'];

if (demoParam && validScenarios.includes(demoParam)) {
  // ...
}
```

### D) تحديث Analytics لتشمل tier

```typescript
const handleSelectScenario = useCallback((type: ScenarioType) => {
  const scenario = getScenarioById(type);
  const tier = scenario?.tier || 'primary';
  
  trackEvent('experience_selected', { 
    type, 
    tier,
    auto_opened: false 
  });
  // ...
}, [trackEvent]);
```

### E) إضافة زر "عرض المزيد"

```typescript
{/* زر عرض المزيد */}
{!showSecondary && (
  <Button
    variant="ghost"
    onClick={() => {
      setShowSecondary(true);
      trackEvent('show_more_clicked');
    }}
    className="mt-6 text-muted-foreground hover:text-primary"
  >
    <ChevronDown className="h-4 w-4 ml-2" />
    عرض المزيد من التجارب
  </Button>
)}
```

### F) عرض التجارب الإضافية (Collapsible)

```typescript
{/* Secondary Experiences - Expandable */}
{showSecondary && (
  <div className="w-full max-w-3xl mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
    <h2 className="text-sm font-medium text-muted-foreground mb-4 text-center">
      تجارب إضافية
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {SECONDARY_SCENARIOS.map((scenario) => (
        <ExperienceCard
          key={scenario.id}
          scenario={scenario}
          variant="secondary"
          onSelect={() => handleSelectScenario(scenario.id)}
        />
      ))}
    </div>
  </div>
)}
```

---

## 3. تعديل `ExperienceCard.tsx`

### A) إضافة Prop للحجم

```typescript
interface ExperienceCardProps {
  scenario: DemoScenario;
  onSelect: () => void;
  variant?: 'primary' | 'secondary';
}
```

### B) تعديل الـ UI حسب الـ variant

```typescript
export const ExperienceCard: React.FC<ExperienceCardProps> = ({ 
  scenario, 
  onSelect,
  variant = 'primary'
}) => {
  const isPrimary = variant === 'primary';
  
  return (
    <Card 
      className={cn(
        "bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer group",
        !isPrimary && "hover:shadow-md"
      )}
      onClick={onSelect}
    >
      <CardContent className={cn(
        "flex flex-col items-center text-center gap-3",
        isPrimary ? "p-6 gap-4" : "p-4 gap-2"
      )}>
        {/* Icon */}
        <span 
          className={cn("", isPrimary ? "text-5xl" : "text-3xl")} 
          role="img" 
          aria-label={scenario.title}
        >
          {scenario.icon}
        </span>
        
        {/* Title */}
        <h3 className={cn(
          "font-bold text-foreground",
          isPrimary ? "text-xl" : "text-base"
        )}>
          {scenario.title}
        </h3>
        
        {/* Subtitle */}
        <p className={cn(
          "text-muted-foreground leading-relaxed",
          isPrimary ? "text-sm" : "text-xs"
        )}>
          {scenario.subtitle}
        </p>
        
        {/* CTA Button - Primary only */}
        {isPrimary && (
          <Button 
            variant="outline"
            className="mt-2 w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            جرّب المثال
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
```

---

## 4. بيانات التجارب الإضافية

### activities (نشاط)

```typescript
{
  id: 'activities',
  tier: 'secondary',
  icon: '🎯',
  title: 'نشاط',
  subtitle: 'بولينج – سينما – ألعاب',
  groupName: 'شلة النشاط',
  currency: 'ر.س',
  members: [
    { id: 'm1', name: 'راكان', avatar: 'ر' },
    { id: 'm2', name: 'تركي', avatar: 'ت' },
    { id: 'm3', name: 'بدر', avatar: 'ب' },
    { id: 'm4', name: 'فهد', avatar: 'ف' },
  ],
  expenses: [
    { id: 'e1', description: 'بولينج', amount: 200, paidById: 'm1', icon: '🎳' },
    { id: 'e2', description: 'سينما', amount: 160, paidById: 'm2', icon: '🎬' },
    { id: 'e3', description: 'عشاء', amount: 280, paidById: 'm3', icon: '🍕' },
  ],
}
```

### desert (رحلة بر)

```typescript
{
  id: 'desert',
  tier: 'secondary',
  icon: '🏕️',
  title: 'رحلة بر',
  subtitle: 'مخيم – أكل – معدات',
  groupName: 'رحلة البر',
  currency: 'ر.س',
  members: [
    { id: 'm1', name: 'سلمان', avatar: 'س' },
    { id: 'm2', name: 'عبدالرحمن', avatar: 'ع' },
    { id: 'm3', name: 'نواف', avatar: 'ن' },
    { id: 'm4', name: 'مشاري', avatar: 'م' },
  ],
  expenses: [
    { id: 'e1', description: 'خيمة ومعدات', amount: 350, paidById: 'm1', icon: '⛺' },
    { id: 'e2', description: 'لحم وأكل', amount: 400, paidById: 'm2', icon: '🥩' },
    { id: 'e3', description: 'فحم وحطب', amount: 100, paidById: 'm3', icon: '🔥' },
  ],
}
```

### groups (مجموعة)

```typescript
{
  id: 'groups',
  tier: 'secondary',
  icon: '👥',
  title: 'مجموعة',
  subtitle: 'فعاليات أو اشتراك جماعي',
  groupName: 'المجموعة',
  currency: 'ر.س',
  members: [
    { id: 'm1', name: 'حسن', avatar: 'ح' },
    { id: 'm2', name: 'علي', avatar: 'ع' },
    { id: 'm3', name: 'حمد', avatar: 'ح' },
    { id: 'm4', name: 'زياد', avatar: 'ز' },
  ],
  expenses: [
    { id: 'e1', description: 'اشتراك Netflix', amount: 60, paidById: 'm1', icon: '📺' },
    { id: 'e2', description: 'حجز ملعب', amount: 200, paidById: 'm2', icon: '⚽' },
    { id: 'e3', description: 'مشروبات', amount: 80, paidById: 'm3', icon: '🥤' },
  ],
}
```

### family (عائلة)

```typescript
{
  id: 'family',
  tier: 'secondary',
  icon: '👨‍👩‍👧',
  title: 'عائلة',
  subtitle: 'رحلة أو مصاريف عائلية',
  groupName: 'العائلة',
  currency: 'ر.س',
  members: [
    { id: 'm1', name: 'أبو محمد', avatar: 'أ' },
    { id: 'm2', name: 'أبو خالد', avatar: 'أ' },
    { id: 'm3', name: 'أبو سعود', avatar: 'أ' },
    { id: 'm4', name: 'أبو عبدالله', avatar: 'أ' },
  ],
  expenses: [
    { id: 'e1', description: 'حجز شاليه', amount: 800, paidById: 'm1', icon: '🏖️' },
    { id: 'e2', description: 'غداء', amount: 350, paidById: 'm2', icon: '🍖' },
    { id: 'e3', description: 'ألعاب الأطفال', amount: 150, paidById: 'm3', icon: '🎢' },
  ],
}
```

### carpool (مشوار مشترك)

```typescript
{
  id: 'carpool',
  tier: 'secondary',
  icon: '🚗',
  title: 'مشوار مشترك',
  subtitle: 'بنزين – مواقف',
  groupName: 'المشوار',
  currency: 'ر.س',
  members: [
    { id: 'm1', name: 'وليد', avatar: 'و' },
    { id: 'm2', name: 'طلال', avatar: 'ط' },
    { id: 'm3', name: 'ياسر', avatar: 'ي' },
    { id: 'm4', name: 'رائد', avatar: 'ر' },
  ],
  expenses: [
    { id: 'e1', description: 'بنزين', amount: 150, paidById: 'm1', icon: '⛽' },
    { id: 'e2', description: 'موقف', amount: 30, paidById: 'm2', icon: '🅿️' },
    { id: 'e3', description: 'غسيل سيارة', amount: 50, paidById: 'm1', icon: '🚿' },
  ],
}
```

### events (مناسبة)

```typescript
{
  id: 'events',
  tier: 'secondary',
  icon: '🎉',
  title: 'مناسبة',
  subtitle: 'هدية – حجز – تجهيز',
  groupName: 'المناسبة',
  currency: 'ر.س',
  members: [
    { id: 'm1', name: 'باسل', avatar: 'ب' },
    { id: 'm2', name: 'أنس', avatar: 'أ' },
    { id: 'm3', name: 'عمار', avatar: 'ع' },
    { id: 'm4', name: 'سامي', avatar: 'س' },
  ],
  expenses: [
    { id: 'e1', description: 'هدية', amount: 500, paidById: 'm1', icon: '🎁' },
    { id: 'e2', description: 'كيك', amount: 200, paidById: 'm2', icon: '🎂' },
    { id: 'e3', description: 'زينة', amount: 100, paidById: 'm3', icon: '🎈' },
  ],
}
```

---

## 5. شكل الـ UI النهائي

```text
┌─────────────────────────────────────────────────┐
│                    [Logo]                       │
│                                                 │
│           دايم واحد يدفع أكثر؟                  │
│                                                 │
│          اختر سيناريو وجرب بنفسك               │
│       وشوف كيف تنحسب القسمة بدون إحراج          │
│                                                 │
├─────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │   ✈️    │  │  🧑‍🤝‍🧑  │  │   🏠    │         │
│  │  سفر   │  │  طلعة  │  │  سكن   │         │
│  │ رحلة.. │  │ مطعم.. │  │ إيجار..│         │
│  │[جرّب]  │  │[جرّب]  │  │[جرّب]  │         │
│  └─────────┘  └─────────┘  └─────────┘         │
│                                                 │
│         [ عرض المزيد من التجارب ↓ ]            │
│                                                 │
├─────────────────────────────────────────────────┤
│              تجارب إضافية                       │
│  ┌───────┐  ┌───────┐  ┌───────┐               │
│  │  🎯   │  │  🏕️   │  │  👥   │               │
│  │ نشاط │  │رحلة بر│  │مجموعة│               │
│  └───────┘  └───────┘  └───────┘               │
│  ┌───────┐  ┌───────┐  ┌───────┐               │
│  │ 👨‍👩‍👧  │  │  🚗   │  │  🎉   │               │
│  │ عائلة│  │مشوار │  │مناسبة│               │
│  └───────┘  └───────┘  └───────┘               │
└─────────────────────────────────────────────────┘
```

---

## 6. Analytics Events

| Event | Parameters | متى |
|-------|------------|-----|
| `show_more_clicked` | - | عند الضغط على "عرض المزيد" |
| `experience_selected` | `type`, `tier`, `auto_opened` | عند اختيار أي تجربة |

---

## 7. معايير القبول

| # | المعيار |
|---|---------|
| 1 | الصفحة تفتح بنفس السرعة ✔ |
| 2 | أول ما يفتح المستخدم يشوف 3 تجارب فقط ✔ |
| 3 | زر "عرض المزيد" يعمل بدون Reload ✔ |
| 4 | أي تجربة إضافية تفتح DemoExperience ✔ |
| 5 | CTA يظهر فقط بعد التفاعل ✔ |
| 6 | البطاقات الثانوية أصغر بصريًا ✔ |
| 7 | لا يوجد تشتيت أو كسر للتحويل ✔ |

---

## ملخص التغييرات

| الملف | الأسطر | التعقيد |
|-------|--------|---------|
| `demoScenarios.ts` | ~120 سطر إضافة | متوسط |
| `LaunchPage.tsx` | ~30 سطر تعديل | بسيط |
| `ExperienceCard.tsx` | ~20 سطر تعديل | بسيط |

**الوقت المتوقع للتنفيذ:** 15-20 دقيقة

