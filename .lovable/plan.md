
# خطة: برنامج المستخدمين المؤسسين – أول 1000 مستخدم

## ملخص المشروع

بناء نظام متكامل لبرنامج المستخدمين المؤسسين يشمل:
- رقم تسلسلي فريد لكل مستخدم
- مزايا خاصة لأول 1000 مستخدم
- نظام نقاط شهرية مرتبط بالنشاط
- شارات وهوية بصرية مميزة

---

## الوضع الحالي

| العنصر | الحالة |
|--------|--------|
| عدد المستخدمين الحاليين | 55 |
| نقاط الترحيب الحالية | 50 نقطة |
| صلاحية النقاط | 7 أيام |
| رقم تسلسلي | غير موجود |
| شارة Founding | غير موجودة |
| تتبع النشاط | غير موجود |

---

## المرحلة 1: تغييرات قاعدة البيانات

### 1.1 إضافة أعمدة جديدة لجدول profiles

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_number INTEGER UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_founding_user BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- إنشاء sequence للأرقام التسلسلية
CREATE SEQUENCE IF NOT EXISTS user_number_seq START WITH 1;
```

### 1.2 تحديث المستخدمين الحاليين

```sql
-- منح أرقام تسلسلية للمستخدمين الحاليين بترتيب التسجيل
WITH numbered_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM profiles
  WHERE user_number IS NULL
)
UPDATE profiles SET 
  user_number = numbered_users.rn,
  is_founding_user = (numbered_users.rn <= 1000)
FROM numbered_users
WHERE profiles.id = numbered_users.id;

-- تحديث الـ sequence للبدء من الرقم التالي
SELECT setval('user_number_seq', COALESCE((SELECT MAX(user_number) FROM profiles), 0) + 1);
```

### 1.3 تحديث trigger إنشاء المستخدم

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_user_number INTEGER;
  v_is_founding BOOLEAN;
BEGIN
  -- الحصول على الرقم التسلسلي التالي
  SELECT nextval('user_number_seq') INTO v_user_number;
  
  -- تحديد إذا كان مؤسس (≤ 1000)
  v_is_founding := (v_user_number <= 1000);
  
  INSERT INTO public.profiles (
    id, display_name, name, phone, user_number, is_founding_user
  ) VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name'),
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'display_name'),
    NEW.phone,
    v_user_number,
    v_is_founding
  ) ON CONFLICT (id) DO UPDATE SET
    user_number = COALESCE(profiles.user_number, v_user_number),
    is_founding_user = COALESCE(profiles.is_founding_user, v_is_founding);
  
  -- منح النقاط الترحيبية (100 للمؤسسين، 50 للعاديين)
  PERFORM public.grant_welcome_credits(NEW.id, v_is_founding);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 1.4 تحديث دالة منح النقاط الترحيبية

```sql
CREATE OR REPLACE FUNCTION public.grant_welcome_credits(
  p_user_id UUID,
  p_is_founding BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_welcome_credits INTEGER;
  v_validity_days INTEGER;
  v_existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_existing_count
  FROM usage_credits
  WHERE user_id = p_user_id AND source = 'welcome';
  
  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_received');
  END IF;
  
  -- 100 نقطة للمؤسسين، 50 للعاديين
  IF p_is_founding THEN
    v_welcome_credits := 100;
    v_validity_days := 30; -- صلاحية أطول للمؤسسين
  ELSE
    SELECT (flag_value::text)::integer INTO v_welcome_credits
    FROM admin_feature_flags WHERE flag_name = 'welcome_credits';
    v_welcome_credits := COALESCE(v_welcome_credits, 50);
    
    SELECT (flag_value::text)::integer INTO v_validity_days
    FROM admin_feature_flags WHERE flag_name = 'welcome_credits_validity_days';
    v_validity_days := COALESCE(v_validity_days, 7);
  END IF;
  
  INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
  VALUES (
    p_user_id, 
    v_welcome_credits, 
    CASE WHEN p_is_founding THEN 'founding_welcome' ELSE 'welcome' END,
    CASE WHEN p_is_founding THEN 'نقاط ترحيبية - مستخدم مؤسس' ELSE 'نقاط ترحيبية' END,
    now() + (v_validity_days || ' days')::interval
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'credits', v_welcome_credits,
    'validity_days', v_validity_days,
    'is_founding', p_is_founding
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### 1.5 دالة تتبع النشاط

```sql
CREATE OR REPLACE FUNCTION public.update_user_activity(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET last_active_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.update_user_activity TO authenticated;
```

### 1.6 إضافة feature flags

```sql
INSERT INTO admin_feature_flags (flag_name, flag_value, description, description_ar)
VALUES 
  ('founding_users_limit', '1000', 'Maximum founding users', 'الحد الأقصى للمستخدمين المؤسسين'),
  ('founding_welcome_credits', '100', 'Welcome credits for founding users', 'نقاط الترحيب للمستخدمين المؤسسين'),
  ('founding_monthly_credits', '50', 'Monthly credits for active founding users', 'النقاط الشهرية للمستخدمين المؤسسين النشطين')
ON CONFLICT (flag_name) DO NOTHING;
```

---

## المرحلة 2: Edge Function للنقاط الشهرية

### 2.1 إنشاء/تحديث grant-monthly-credits

```typescript
// supabase/functions/grant-monthly-credits/index.ts

// إضافة منطق للمستخدمين المؤسسين
const { data: foundingUsers, error: foundingError } = await supabase
  .from('profiles')
  .select('id, user_number, last_active_at')
  .eq('is_founding_user', true)
  .gte('last_active_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

for (const user of foundingUsers || []) {
  // التحقق من عدم منح نقاط هذا الشهر
  const { data: existingGrant } = await supabase
    .from('usage_credits')
    .select('id')
    .eq('user_id', user.id)
    .eq('source', 'founding_monthly')
    .gte('created_at', startOfMonth)
    .single();

  if (!existingGrant) {
    // منح 50 نقطة شهرية
    await supabase.from('usage_credits').insert({
      user_id: user.id,
      amount: 50,
      source: 'founding_monthly',
      description_ar: 'نقاط شهرية - مستخدم مؤسس',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
}
```

---

## المرحلة 3: مكونات Frontend

### 3.1 إنشاء شارة Founding User

```typescript
// src/components/ui/founding-badge.tsx
export function FoundingBadge({ userNumber, size = "md" }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(
          "inline-flex items-center gap-1 rounded-full font-medium",
          "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600",
          "text-white border border-amber-300",
          sizeClasses[size]
        )}>
          <Star className="h-3 w-3" />
          <span>#{userNumber}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>مستخدم مؤسس #{userNumber}</p>
      </TooltipContent>
    </Tooltip>
  );
}
```

### 3.2 إنشاء hook للمستخدم المؤسس

```typescript
// src/hooks/useFoundingUser.ts
export function useFoundingUser(userId?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['founding-user', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_number, is_founding_user')
        .eq('id', userId)
        .single();
      return data;
    },
    enabled: !!userId
  });

  return {
    userNumber: data?.user_number,
    isFoundingUser: data?.is_founding_user || false,
    isLoading
  };
}
```

### 3.3 عداد المتبقي من البرنامج

```typescript
// src/hooks/useFoundingProgram.ts
export function useFoundingProgram() {
  const { data } = useQuery({
    queryKey: ['founding-program-stats'],
    queryFn: async () => {
      const { data, count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });
      
      const limit = 1000;
      const remaining = Math.max(0, limit - (count || 0));
      const isClosed = remaining === 0;
      
      return { total: count, remaining, limit, isClosed };
    }
  });

  return data || { total: 0, remaining: 1000, limit: 1000, isClosed: false };
}
```

---

## المرحلة 4: تحديث واجهات المستخدم

### 4.1 صفحة التسجيل (Auth.tsx)

```text
┌─────────────────────────────────────────────┐
│ SignupValueBanner (الحالي)                  │
│ + إضافة قسم جديد:                          │
│                                             │
│ ⭐ برنامج المستخدمين المؤسسين              │
│ • 100 نقطة ترحيبية (بدل 50)                │
│ • 50 نقطة شهريًا مع تسجيل دخول واحد        │
│ • شارة Founding User دائمة                 │
│ • رقم مستخدم تسلسلي #XXX                   │
│                                             │
│ 🔥 متبقي 945 من 1000                       │
│ *تسري الشروط والأحكام*                     │
└─────────────────────────────────────────────┘
```

**الملفات المطلوب تعديلها:**
- `src/components/auth/SignupValueBanner.tsx` - إضافة قسم البرنامج

### 4.2 صفحة الترحيب (Welcome.tsx)

```text
┌─────────────────────────────────────────────┐
│ 🎉 مبروك!                                   │
│                                             │
│ أنت المستخدم رقم #XXX                       │  ← جديد
│ [شارة: ⭐ مستخدم مؤسس]                      │  ← جديد (إن كان مؤسس)
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ رصيدك الحالي                            │ │
│ │ 100 نقطة                               │ │  ← 100 بدل 50 للمؤسسين
│ │ صالحة لمدة 30 يوم                      │ │  ← 30 بدل 7 للمؤسسين
│ └─────────────────────────────────────────┘ │
│                                             │
│ 💡 كمستخدم مؤسس، ستحصل على:               │  ← جديد
│ • 50 نقطة شهريًا عند تسجيل دخول واحد       │
│ • شارتك الدائمة #XXX                        │
└─────────────────────────────────────────────┘
```

**الملفات المطلوب تعديلها:**
- `src/pages/Welcome.tsx`

### 4.3 صفحة الإعدادات (ProfileTab)

```text
┌─────────────────────────────────────────────┐
│ [Avatar]                                    │
│ اسم المستخدم                               │
│ [⭐ #XXX مستخدم مؤسس] [💎 Pro]              │  ← شارة جديدة
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 💰 النقاط الشهرية (للمؤسسين)            │ │  ← قسم جديد
│ │ تحصل على 50 نقطة شهريًا                 │ │
│ │ شرط: تسجيل دخول واحد على الأقل          │ │
│ │ آخر نشاط: 2026-01-15                    │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**الملفات المطلوب تعديلها:**
- `src/components/settings/ProfileTab.tsx`
- `src/components/ui/user-display-with-badges.tsx`

---

## المرحلة 5: تتبع النشاط

### 5.1 Hook لتحديث النشاط

```typescript
// src/hooks/useActivityTracker.ts
export function useActivityTracker() {
  const { data: { user } } = await supabase.auth.getUser();
  
  useEffect(() => {
    if (user?.id) {
      // تحديث النشاط عند تحميل التطبيق
      supabase.rpc('update_user_activity', { p_user_id: user.id });
    }
  }, [user?.id]);
}
```

### 5.2 دمج في App.tsx أو Layout

```typescript
// في المكون الرئيسي
useActivityTracker();
```

---

## المرحلة 6: الترجمات

### 6.1 ملفات الترجمة العربية

```json
// src/i18n/locales/ar/auth.json - إضافات
{
  "founding_program": {
    "title": "برنامج المستخدمين المؤسسين",
    "welcome_points": "100 نقطة ترحيبية",
    "monthly_points": "50 نقطة شهريًا مع تسجيل دخول واحد",
    "badge": "شارة Founding User دائمة",
    "user_number": "رقم مستخدم تسلسلي دائم",
    "remaining": "متبقي {{remaining}} من {{limit}}",
    "closed": "البرنامج مكتمل",
    "terms_apply": "تسري الشروط والأحكام"
  },
  "welcome": {
    "user_number": "أنت المستخدم رقم",
    "founding_badge": "مستخدم مؤسس",
    "founding_benefits_title": "كمستخدم مؤسس، ستحصل على:",
    "founding_monthly": "50 نقطة شهريًا عند تسجيل دخول واحد",
    "founding_badge_permanent": "شارتك الدائمة"
  }
}
```

### 6.2 ملفات الترجمة الإنجليزية

```json
// src/i18n/locales/en/auth.json - إضافات
{
  "founding_program": {
    "title": "Founding Users Program",
    "welcome_points": "100 welcome points",
    "monthly_points": "50 monthly points with one login",
    "badge": "Permanent Founding User badge",
    "user_number": "Permanent sequential user number",
    "remaining": "{{remaining}} of {{limit}} remaining",
    "closed": "Program closed",
    "terms_apply": "Terms & conditions apply"
  }
}
```

---

## المرحلة 7: Analytics Events

| Event | Trigger | البيانات |
|-------|---------|----------|
| `user_signed_up` | عند إنشاء حساب | `user_number`, `is_founding` |
| `founding_user_granted` | عند تسجيل مستخدم مؤسس | `user_number` |
| `founding_monthly_credits_granted` | منح النقاط الشهرية | `user_id`, `amount` |
| `founding_limit_reached` | اكتمال 1000 مستخدم | `timestamp` |

---

## المرحلة 8: تحديث الشروط والأحكام

### 8.1 إضافة قسم جديد للبرنامج

```json
// إضافة لـ terms.json
{
  "sections": {
    "founding_program": {
      "title": "9. برنامج المستخدمين المؤسسين",
      "content": "...",
      "items": {
        "eligibility": "يستفيد أول 1000 مستخدم من البرنامج",
        "benefits": "100 نقطة ترحيبية + 50 نقطة شهرية",
        "activity_requirement": "يشترط تسجيل دخول واحد شهرياً للاستحقاق",
        "non_transferable": "المزايا غير قابلة للنقل أو البيع",
        "lifetime_definition": "مدى الحياة تعني مدة بقاء الحساب نشطاً",
        "termination": "يحق للنظام إيقاف المزايا عند إساءة الاستخدام"
      }
    }
  }
}
```

---

## ملخص الملفات المطلوب إنشاءها/تعديلها

### ملفات جديدة:
| الملف | الوصف |
|-------|-------|
| `src/components/ui/founding-badge.tsx` | شارة المستخدم المؤسس |
| `src/hooks/useFoundingUser.ts` | hook لبيانات المؤسس |
| `src/hooks/useFoundingProgram.ts` | hook لإحصائيات البرنامج |
| `src/hooks/useActivityTracker.ts` | hook لتتبع النشاط |
| `src/components/auth/FoundingProgramBanner.tsx` | بانر البرنامج في صفحة التسجيل |

### ملفات معدلة:
| الملف | التعديل |
|-------|---------|
| `src/pages/Auth.tsx` | إضافة بانر البرنامج |
| `src/pages/Welcome.tsx` | عرض رقم المستخدم ومزايا المؤسس |
| `src/components/settings/ProfileTab.tsx` | عرض شارة وقسم النقاط الشهرية |
| `src/components/ui/user-display-with-badges.tsx` | دعم شارة المؤسس |
| `src/i18n/locales/ar/auth.json` | ترجمات البرنامج |
| `src/i18n/locales/en/auth.json` | ترجمات البرنامج |
| `src/i18n/locales/ar/terms.json` | قسم شروط البرنامج |
| `src/i18n/locales/en/terms.json` | قسم شروط البرنامج |
| `supabase/functions/grant-monthly-credits/index.ts` | منطق المؤسسين |

### Database Migrations:
1. إضافة أعمدة `user_number`, `is_founding_user`, `last_active_at`
2. تحديث `handle_new_user` trigger
3. تحديث `grant_welcome_credits` function
4. إضافة `update_user_activity` function
5. إضافة feature flags جديدة

---

## ترتيب التنفيذ

| المرحلة | الوقت المتوقع | الأولوية |
|---------|---------------|----------|
| 1. Database Migrations | 20 دقيقة | عالية |
| 2. Edge Function | 15 دقيقة | عالية |
| 3. Hooks & Components | 30 دقيقة | عالية |
| 4. UI Updates | 25 دقيقة | عالية |
| 5. Activity Tracker | 10 دقيقة | متوسطة |
| 6. Translations | 15 دقيقة | متوسطة |
| 7. Analytics | 10 دقيقة | متوسطة |
| 8. Terms Update | 10 دقيقة | منخفضة |

**الوقت الإجمالي المتوقع:** ~2-2.5 ساعة

---

## معايير القبول

| # | المعيار |
|---|---------|
| 1 | كل مستخدم جديد يحصل على رقم تسلسلي فريد |
| 2 | المستخدمون 1-1000 يحصلون على `is_founding_user = true` |
| 3 | المؤسسون يحصلون على 100 نقطة ترحيبية (بدل 50) |
| 4 | شارة المؤسس تظهر في Profile و Groups |
| 5 | عداد "متبقي X من 1000" يظهر في صفحة التسجيل |
| 6 | النقاط الشهرية (50) تُمنح للمؤسسين النشطين |
| 7 | `last_active_at` يتحدث عند كل زيارة |
| 8 | Analytics events تُسجل بشكل صحيح |
| 9 | الترجمات كاملة للعربية والإنجليزية |
| 10 | الشروط والأحكام محدثة |
