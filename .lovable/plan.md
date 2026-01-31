

# خطة تفعيل Guest Mode الكامل لـ Diviso

## الهدف الاستراتيجي

تحويل Diviso من "تطبيق يحتاج التزام" إلى "أداة ذكية يجربها المستخدم → يفهم قيمتها → يقرر التسجيل"

---

## نظرة عامة على الحل

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Guest Mode Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│  /launch                                                        │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ جرّب بدون تسجيل  │  │ سجّل واحفظ      │                    │
│  │   (Primary)      │  │   (Secondary)    │                    │
│  └────────┬─────────┘  └──────────────────┘                    │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────┤
│  │              GuestSessionContext                            │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  │ session_id  │  │   groups    │  │  expenses   │         │
│  │  │   (UUID)    │  │  (2-5 ppl)  │  │  (1-5 each) │         │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │
│  │                                                             │
│  │  Storage: localStorage + sessionStorage (hybrid)           │
│  │  Persistence: Until session closes OR user clears          │
│  └─────────────────────────────────────────────────────────────┤
│                                                                 │
│  Conversion Triggers:                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ● Save group permanently                                  │  │
│  │ ● Share external link                                     │  │
│  │ ● Invite real friend                                      │  │
│  │ ● 2+ scenarios completed                                  │  │
│  │ ● 3+ expenses added                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## الملفات الجديدة والمعدّلة

### 1. ملفات جديدة

| الملف | الغرض |
|-------|-------|
| `src/contexts/GuestSessionContext.tsx` | إدارة حالة الضيف (UUID, groups, expenses) |
| `src/hooks/useGuestSession.ts` | Hook للوصول السهل للـ Context |
| `src/hooks/useGuestAnalytics.ts` | تتبع إحصائيات التجربة (سيناريوهات، مصاريف) |
| `src/components/guest/GuestModeBanner.tsx` | شريط "أنت في وضع التجربة" |
| `src/components/guest/GuestConversionPrompt.tsx` | رسالة التحويل الذكية |
| `src/pages/GuestGroupPage.tsx` | صفحة المجموعة للضيف |
| `src/pages/GuestExpensePage.tsx` | صفحة إضافة المصروف للضيف |
| `supabase/migrations/xxx_create_demo_sessions_table.sql` | جدول لتتبع التجارب |

### 2. ملفات معدّلة

| الملف | التعديل |
|-------|---------|
| `src/pages/LaunchPage.tsx` | إضافة زر "جرّب بدون تسجيل" كـ Primary CTA |
| `src/components/launch/FullDemoView.tsx` | ربط مع GuestSession لحفظ البيانات |
| `src/components/launch/DemoExperience.tsx` | إضافة GuestModeBanner وزر "جرّب سيناريو آخر" |
| `src/App.tsx` | إضافة GuestSessionProvider وroutes جديدة |
| `src/pages/Auth.tsx` | منطق ترحيل بيانات الضيف عند التسجيل |
| `src/components/HeroSection.tsx` | استبدال الأرقام الثابتة بإحصائيات حقيقية |

---

## التفاصيل التقنية

### 1. GuestSessionContext

```typescript
// src/contexts/GuestSessionContext.tsx
interface GuestMember {
  id: string;
  name: string;
  avatar: string;
}

interface GuestExpense {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  splitType: 'equal' | 'percentage' | 'custom';
  splits?: { memberId: string; value: number }[];
  createdAt: number;
}

interface GuestGroup {
  id: string;
  name: string;
  currency: string;
  members: GuestMember[];
  expenses: GuestExpense[];
  createdAt: number;
  scenarioId?: string; // ربط بالسيناريو الأصلي
}

interface GuestSessionState {
  sessionId: string;           // UUID فريد للجلسة
  groups: GuestGroup[];        // المجموعات المؤقتة
  completedScenarios: string[];// السيناريوهات المكتملة
  totalExpensesAdded: number;  // إجمالي المصاريف المضافة
  sessionStartTime: number;    // وقت بدء الجلسة
  hasSeenConversionPrompt: boolean;
}
```

### 2. التخزين (Hybrid Storage)

```typescript
// استراتيجية التخزين
const STORAGE_KEY = 'diviso_guest_session';

// sessionStorage: يمسح عند إغلاق المتصفح
// localStorage: يبقى لفترة أطول (24 ساعة كحد أقصى)

const saveSession = (state: GuestSessionState) => {
  // حفظ في كلاهما للمرونة
  const data = JSON.stringify({ ...state, savedAt: Date.now() });
  sessionStorage.setItem(STORAGE_KEY, data);
  localStorage.setItem(STORAGE_KEY, data);
};

const loadSession = (): GuestSessionState | null => {
  // أولوية sessionStorage، ثم localStorage
  const session = sessionStorage.getItem(STORAGE_KEY);
  const local = localStorage.getItem(STORAGE_KEY);
  
  const data = session || local;
  if (!data) return null;
  
  const parsed = JSON.parse(data);
  // تحقق من انتهاء الصلاحية (24 ساعة)
  if (Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) {
    clearSession();
    return null;
  }
  
  return parsed;
};
```

### 3. منطق التحويل الذكي

```typescript
// src/hooks/useGuestConversion.ts
const CONVERSION_TRIGGERS = {
  scenarios_completed: 2,  // بعد تجربة 2 سيناريوهات
  expenses_added: 3,       // بعد إضافة 3 مصاريف
  time_spent_seconds: 120, // بعد دقيقتين في التجربة
};

function shouldShowConversionPrompt(state: GuestSessionState): boolean {
  const { completedScenarios, totalExpensesAdded, sessionStartTime } = state;
  
  const timeSpent = (Date.now() - sessionStartTime) / 1000;
  
  return (
    completedScenarios.length >= CONVERSION_TRIGGERS.scenarios_completed ||
    totalExpensesAdded >= CONVERSION_TRIGGERS.expenses_added ||
    timeSpent >= CONVERSION_TRIGGERS.time_spent_seconds
  );
}

function getConversionMessage(state: GuestSessionState): string {
  if (state.totalExpensesAdded >= 3) {
    return "واضح إنك فهمت الفكرة 👌\nسجّل الآن وخليها حقيقية";
  }
  if (state.completedScenarios.length >= 2) {
    return "جربت أكثر من سيناريو!\nجاهز تبدأ مجموعتك الحقيقية؟";
  }
  return "عجبتك التجربة؟\nسجّل مجانًا واحصل على 50 نقطة 🎁";
}
```

### 4. جدول تتبع التجارب (Database)

```sql
-- supabase/migrations/xxx_create_demo_sessions_table.sql
CREATE TABLE demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, -- من localStorage
  scenarios_tried TEXT[] DEFAULT '{}',
  expenses_count INTEGER DEFAULT 0,
  groups_created INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  converted_to_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: يمكن الإدراج من الجميع (anonymous)، لا يمكن القراءة
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert demo sessions" ON demo_sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "System can read demo sessions" ON demo_sessions
  FOR SELECT TO service_role USING (true);

-- Index للتحليلات
CREATE INDEX idx_demo_sessions_created ON demo_sessions(created_at);
```

### 5. Social Proof الحقيقي

```sql
-- دالة للحصول على إحصائيات التجارب الحقيقية
CREATE OR REPLACE FUNCTION public.get_demo_stats()
RETURNS JSON AS $$
DECLARE
  v_today_count INTEGER;
  v_24h_count INTEGER;
  v_most_tried TEXT;
BEGIN
  -- تجارب اليوم
  SELECT COUNT(*) INTO v_today_count
  FROM demo_sessions
  WHERE created_at >= CURRENT_DATE;
  
  -- تجارب آخر 24 ساعة
  SELECT COUNT(*) INTO v_24h_count
  FROM demo_sessions
  WHERE created_at >= NOW() - INTERVAL '24 hours';
  
  -- أكثر سيناريو مجرّب
  SELECT unnest(scenarios_tried) as scenario
  INTO v_most_tried
  FROM demo_sessions
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY scenario
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  RETURN json_build_object(
    'today_count', v_today_count,
    'last_24h_count', v_24h_count,
    'most_tried_scenario', COALESCE(v_most_tried, 'travel')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_demo_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_demo_stats() TO authenticated;
```

---

## تحديثات الواجهة (UI)

### 1. صفحة /launch الجديدة

```text
┌─────────────────────────────────────────┐
│              [Logo]                      │
│                                          │
│      👋 أهلًا بك في Diviso              │
│                                          │
│   قسّم مصاريفك مع الناس اللي معك        │
│   بدون لخبطة ولا إحراج                  │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │     🎮 جرّب بدون تسجيل             │ │  ← Primary CTA (أخضر، كبير)
│  │     (مباشر، بدون بريد أو رقم)       │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │     ✨ سجّل واحفظ تجربتك           │ │  ← Secondary (outline)
│  └─────────────────────────────────────┘ │
│                                          │
│  ─────────── أو اختر تجربة ───────────  │
│                                          │
│  [✈️ سفر]  [🧑‍🤝‍🧑 أصدقاء]  [🏠 سكن]      │
│                                          │
└─────────────────────────────────────────┘
```

### 2. شريط Guest Mode

```text
┌─────────────────────────────────────────┐
│ 👋 أنت الآن في وضع التجربة              │
│    البيانات مؤقتة • [سجّل للحفظ]        │
└─────────────────────────────────────────┘
```

### 3. رسالة التحويل الذكية

```text
┌─────────────────────────────────────────┐
│                                          │
│   واضح إنك فهمت الفكرة 👌               │
│   سجّل الآن وخليها حقيقية              │
│                                          │
│   ┌───────────────────────────────────┐  │
│   │  سجّل مجانًا واحصل على 50 نقطة 🎁  │  │
│   └───────────────────────────────────┘  │
│                                          │
│   [جرّب سيناريو آخر]                    │
│                                          │
└─────────────────────────────────────────┘
```

---

## منطق ترحيل البيانات

```typescript
// src/utils/migrateGuestData.ts
async function migrateGuestDataToUser(userId: string) {
  const guestSession = loadGuestSession();
  if (!guestSession || guestSession.groups.length === 0) return;
  
  // عرض dialog للمستخدم
  const shouldMigrate = await showMigrationDialog({
    groupsCount: guestSession.groups.length,
    expensesCount: guestSession.totalExpensesAdded,
  });
  
  if (shouldMigrate) {
    for (const group of guestSession.groups) {
      // إنشاء المجموعة الحقيقية
      const { data: newGroup } = await supabase
        .from('groups')
        .insert({
          name: group.name,
          currency: group.currency,
          owner_id: userId,
        })
        .select('id')
        .single();
      
      // إضافة الأعضاء والمصاريف...
    }
  }
  
  // تسجيل التحويل في demo_sessions
  await supabase.from('demo_sessions').update({
    converted_to_user_id: userId,
  }).eq('session_id', guestSession.sessionId);
  
  // مسح بيانات الضيف
  clearGuestSession();
}
```

---

## التتبع والتحليلات (Analytics)

| الحدث | الوصف | المعلومات |
|-------|-------|-----------|
| `guest_session_started` | بدء جلسة ضيف | session_id |
| `guest_scenario_completed` | إكمال سيناريو | scenario_id, duration |
| `guest_expense_added` | إضافة مصروف | expense_count |
| `guest_group_created` | إنشاء مجموعة وهمية | members_count |
| `guest_conversion_prompt_shown` | ظهور رسالة التحويل | trigger_reason |
| `guest_conversion_clicked` | نقر على زر التسجيل | from_prompt |
| `guest_data_migrated` | ترحيل بيانات | groups_count, expenses_count |

---

## خطوات التنفيذ (مرتبة)

| # | الخطوة | التعقيد |
|---|--------|---------|
| 1 | إنشاء `GuestSessionContext` | متوسط |
| 2 | إنشاء جدول `demo_sessions` | سهل |
| 3 | تعديل `/launch` لإضافة CTA الجديد | سهل |
| 4 | إنشاء `GuestModeBanner` | سهل |
| 5 | تعديل `FullDemoView` لحفظ في GuestSession | متوسط |
| 6 | إنشاء صفحات Guest (Group, Expense) | متوسط |
| 7 | منطق التحويل الذكي | متوسط |
| 8 | ترحيل البيانات عند التسجيل | عالي |
| 9 | دالة `get_demo_stats` للـ Social Proof | متوسط |
| 10 | تحديث HeroSection بالإحصائيات الحقيقية | سهل |

---

## معايير النجاح (KPIs)

خلال 72 ساعة من التفعيل:

| المعيار | الهدف |
|---------|-------|
| متوسط الجلسة | ⬆️ 50%+ |
| سيناريوهات/مستخدم | ⬆️ 2+ |
| معدل التحويل للتسجيل | ⬆️ 10%+ |
| Bounce Rate | ⬇️ 20%+ |

---

## ملاحظات أمنية

| البند | الحل |
|-------|------|
| لا بيانات حقيقية في localStorage | فقط بيانات تجريبية |
| لا يمكن للضيف الوصول لبيانات حقيقية | Routes محمية |
| demo_sessions: INSERT فقط من anon | RLS مُفعّل |
| Session تنتهي بعد 24 ساعة | تلقائي |

---

## التوافق مع الميزات الحالية

| الميزة | التوافق |
|--------|---------|
| برنامج المؤسسين | لا يتعارض - Guest لا يأخذ رقم تسلسلي |
| النقاط والكريدت | لا يحصل عليها إلا بعد التسجيل |
| الإعلانات | تظهر للضيف (بدون تتبع شخصي) |
| Multi-language | يعمل مع i18n الحالي |

