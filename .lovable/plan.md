
# Plans Feature -- خطط شخصية قابلة للربط بمجموعة

## ملخص

بناء ميزة "الخطط" (Plans) كاملة: خطة شخصية يمكن تحويلها لمجموعة أو ربطها بمجموعة موجودة. تشمل: إنشاء/تعديل خطط، أعضاء، اقتراحات AI، تصويت، ومصاريف مربوطة.

---

## نطاق التنفيذ الكامل

هذا المشروع كبير جداً ويتطلب تقسيمه إلى **3 مراحل** لتنفيذ آمن ومنظم. سأنفذ **المرحلة الأولى (الأساس)** في هذه الدفعة، مع تحضير البنية لباقي المراحل.

### المرحلة 1 (هذه الدفعة): قاعدة البيانات + UI أساسي
- جميع جداول DB + RLS + RPCs
- إنشاء/تعديل خطة (wizard)
- صفحة تفاصيل الخطة (ملخص + أعضاء + حالة)
- تحويل خطة لمجموعة + ربط بمجموعة موجودة
- قائمة الخطط

### المرحلة 2 (دفعة لاحقة): اقتراحات AI + تصويت
- Edge function للاقتراحات
- واجهة الاقتراحات + "حوّل لتصويت"
- نظام التصويت الكامل

### المرحلة 3 (دفعة لاحقة): مصاريف مربوطة
- ربط expenses بـ plan_id
- تبويب المصاريف في تفاصيل الخطة
- نقل مصروف لخطة

---

## 1. قاعدة البيانات (Migration)

### A) جدول `plans`

| العمود | النوع | الوصف |
|--------|------|-------|
| id | uuid PK | معرف فريد |
| owner_user_id | uuid NOT NULL | مالك الخطة (FK profiles) |
| group_id | uuid NULL | ربط بمجموعة (FK groups) |
| title | text NOT NULL | عنوان الخطة |
| plan_type | text NOT NULL | نوع: trip/outing/shared_housing/activity |
| destination | text NULL | الوجهة |
| start_date | date NULL | تاريخ البدء |
| end_date | date NULL | تاريخ الانتهاء |
| budget_value | numeric NULL | الميزانية |
| budget_currency | text default 'SAR' | العملة |
| status | text NOT NULL default 'draft' | الحالة: draft/planning/locked/done/canceled |
| created_at | timestamptz default now() | تاريخ الإنشاء |
| updated_at | timestamptz default now() | تاريخ التحديث |

Indexes: owner_user_id, group_id, status

### B) جدول `plan_members`

| العمود | النوع |
|--------|------|
| plan_id | uuid FK plans (cascade) |
| user_id | uuid FK profiles |
| role | text default 'member' (owner/admin/member) |
| joined_at | timestamptz default now() |

PK: (plan_id, user_id)

### C) جدول `plan_ai_summary`

| العمود | النوع |
|--------|------|
| plan_id | uuid PK FK plans (cascade) |
| intent_summary_text | text NOT NULL |
| updated_at | timestamptz default now() |

### D) جدول `plan_suggestions`

| العمود | النوع |
|--------|------|
| id | uuid PK |
| plan_id | uuid FK plans (cascade) |
| category | text NOT NULL (stay/transport/activities/food/other) |
| title | text NOT NULL |
| details | text NULL |
| created_by | text default 'ai' (ai/user) |
| created_at | timestamptz default now() |

### E) جدول `plan_votes`

| العمود | النوع |
|--------|------|
| id | uuid PK |
| plan_id | uuid FK plans (cascade) |
| title | text NOT NULL |
| status | text default 'open' (open/closed) |
| created_by | uuid FK profiles |
| created_at | timestamptz default now() |
| closes_at | timestamptz NULL |

### F) جدول `plan_vote_options`

| العمود | النوع |
|--------|------|
| id | uuid PK |
| vote_id | uuid FK plan_votes (cascade) |
| option_text | text NOT NULL |

### G) جدول `plan_vote_responses`

| العمود | النوع |
|--------|------|
| vote_id | uuid FK plan_votes (cascade) |
| option_id | uuid FK plan_vote_options (cascade) |
| user_id | uuid FK profiles |
| created_at | timestamptz default now() |

PK: (vote_id, user_id) -- صوت واحد لكل مستخدم

### H) تعديل جدول `expenses`

```text
ALTER TABLE expenses ADD COLUMN plan_id uuid NULL REFERENCES plans(id);
CREATE INDEX expenses_plan_idx ON expenses(plan_id);
```

### Security Definer Function

```text
create or replace function public.can_access_plan(p_user_id uuid, p_plan_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from plan_members where plan_id = p_plan_id and user_id = p_user_id
  )
  or exists (
    select 1 from plans p
    join group_members gm on gm.group_id = p.group_id
    where p.id = p_plan_id and gm.user_id = p_user_id
  )
$$;
```

### RLS Policies (ملخص)

- **plans**: SELECT if `can_access_plan`; INSERT if `owner_user_id = auth.uid()`; UPDATE/DELETE if owner/admin in plan_members
- **plan_members**: SELECT if can access plan; INSERT/DELETE by owner/admin only
- **plan_ai_summary / plan_suggestions**: SELECT if can access; INSERT/UPDATE/DELETE by owner/admin
- **plan_votes / plan_vote_options**: SELECT if can access; INSERT by owner/admin; UPDATE (close) by owner/admin
- **plan_vote_responses**: SELECT if can access; INSERT by members only if vote is open; one vote per user enforced by PK

### RPCs

#### `create_plan`
- Creates plan + inserts owner as plan_member with role='owner'
- Returns plan id

#### `convert_plan_to_group`
- Owner only
- Creates new group (name = plan.title, currency = plan.budget_currency)
- Adds all plan_members to group_members
- Updates plan.group_id
- Returns group id

#### `link_plan_to_group`
- Owner/admin only
- Validates user is member of that group
- Updates plan.group_id

#### `update_plan_status`
- Owner/admin only
- Updates plan status (draft -> planning -> locked -> done)

---

## 2. ملفات جديدة (المرحلة 1)

### الصفحات

#### `src/pages/Plans.tsx`
قائمة الخطط مع تبويبين:
- "خططي" -- خطط شخصية (لا group_id أو أنا عضو)
- "خطط المجموعات" -- خطط مربوطة بمجموعات أنا فيها

كل بطاقة تعرض: العنوان، النوع، الوجهة، التواريخ، الحالة، عدد الأعضاء
CTA: "خطة جديدة"

#### `src/pages/CreatePlan.tsx`
Wizard من 3 خطوات:
1. اختيار النوع (trip/outing/shared_housing/activity) مع أيقونات
2. العنوان + الوجهة (اختياري) + التواريخ (اختياري)
3. الميزانية (اختياري) + العملة

بعد الإنشاء: توجيه لتفاصيل الخطة

#### `src/pages/PlanDetails.tsx`
صفحة تفاصيل مع:
- Header: العنوان + النوع + الحالة + الوجهة + التواريخ
- شريط حالة (Draft / Planning / Locked / Done) مع زر تغيير الحالة
- قائمة الأعضاء
- أزرار إجراءات (تحويل لمجموعة / ربط بمجموعة / دعوة أعضاء)
- تبويبات: ملخص | اقتراحات | تصويت | مصاريف (المرحلة 2+3 ستضيف المحتوى)

### المكونات

#### `src/components/plans/PlanCard.tsx`
بطاقة خطة للقائمة

#### `src/components/plans/PlanStatusBar.tsx`
شريط الحالة مع خطوات (Draft -> Planning -> Locked -> Done) + زر "اقفل الخطة"

#### `src/components/plans/ConvertToGroupDialog.tsx`
حوار تأكيد تحويل الخطة لمجموعة جديدة

#### `src/components/plans/LinkToGroupDialog.tsx`
حوار اختيار مجموعة موجودة للربط

#### `src/components/plans/PlanMembersList.tsx`
قائمة أعضاء الخطة مع أدوار

### الـ Hooks

#### `src/hooks/usePlans.ts`
- `fetchPlans()` -- جلب جميع خطط المستخدم
- `createPlan()` -- إنشاء خطة عبر RPC
- `updatePlan()` -- تحديث بيانات الخطة
- `updatePlanStatus()` -- تغيير حالة الخطة

#### `src/hooks/usePlanDetails.ts`
- `fetchPlanDetails(planId)` -- جلب تفاصيل الخطة مع الأعضاء
- `convertToGroup(planId)` -- تحويل لمجموعة
- `linkToGroup(planId, groupId)` -- ربط بمجموعة
- `addPlanMember(planId, userId)` -- إضافة عضو

#### `src/hooks/usePlanVotes.ts` (هيكل فقط -- محتوى المرحلة 2)
#### `src/hooks/usePlanSuggestions.ts` (هيكل فقط -- محتوى المرحلة 2)

---

## 3. الملفات المعدلة

### `src/App.tsx`
إضافة routes:
```text
/plans -- قائمة الخطط
/create-plan -- إنشاء خطة
/plan/:id -- تفاصيل الخطة
```

### `src/components/BottomNav.tsx`
لن نعدل الـ BottomNav (مساحة محدودة). بدلاً من ذلك:
- إضافة زر "الخطط" في Dashboard كـ Quick Action

### `src/components/dashboard/SimpleQuickActions.tsx`
إضافة زر "الخطط" بجانب الأزرار الحالية

### `src/i18n/locales/ar/plans.json` (جديد)
جميع النصوص العربية للميزة

### `src/i18n/locales/en/plans.json` (جديد)
جميع النصوص الإنجليزية

### `src/hooks/useUsageCredits.ts`
إضافة `create_plan` كعملية (تكلفة: 3 نقاط)

---

## 4. التفاصيل التقنية

### سلوك تحويل الخطة لمجموعة

```text
User clicks "تحويل إلى مجموعة"
  --> ConvertToGroupDialog (تأكيد)
  --> RPC: convert_plan_to_group(p_plan_id)
    --> Validates: current user is owner
    --> INSERT INTO groups (name=plan.title, currency=plan.budget_currency, owner_id=plan.owner_user_id)
    --> For each plan_member: INSERT INTO group_members
    --> UPDATE plans SET group_id = new_group.id, status = 'planning'
    --> RETURN group_id
  --> Navigate to /group/:groupId
  --> Toast: "تم إنشاء المجموعة وربط الخطة بها"
```

### سلوك ربط الخطة بمجموعة

```text
User clicks "ربط بمجموعة موجودة"
  --> LinkToGroupDialog (اختيار مجموعة)
  --> RPC: link_plan_to_group(p_plan_id, p_group_id)
    --> Validates: current user is owner/admin in plan AND member in group
    --> UPDATE plans SET group_id = p_group_id
  --> Refresh plan details
  --> Toast: "تم ربط الخطة بالمجموعة"
```

### شريط الحالة (Status Bar)

```text
[Draft] ---> [Planning] ---> [Locked] ---> [Done]
   |              |              |            |
  مسودة      جاري التخطيط    مقفلة       مكتملة

+ زر "اقفل الخطة" (يظهر فقط لـ owner/admin في حالة planning)
+ زر "إلغاء الخطة" (يظهر في أي حالة ما عدا done)
```

### أنواع الخطط مع أيقونات

```text
trip          --> Plane icon        --> رحلة
outing        --> Coffee icon       --> طلعة
shared_housing --> Home icon        --> سكن مشترك
activity      --> Zap/Activity icon --> نشاط
```

---

## 5. Credits Integration

| العملية | التكلفة |
|---------|--------|
| create_plan | 3 نقاط |
| ai_suggest_plan | 3 نقاط (المرحلة 2) |

---

## 6. ملخص جميع الملفات

### ملفات جديدة

| الملف | الوصف | الأولوية |
|-------|------|---------|
| Migration SQL | 8 جداول + RLS + RPCs + indexes | حرجة |
| `src/pages/Plans.tsx` | قائمة الخطط | حرجة |
| `src/pages/CreatePlan.tsx` | إنشاء خطة (wizard) | حرجة |
| `src/pages/PlanDetails.tsx` | تفاصيل الخطة | حرجة |
| `src/hooks/usePlans.ts` | hook الخطط | حرجة |
| `src/hooks/usePlanDetails.ts` | hook تفاصيل الخطة | حرجة |
| `src/components/plans/PlanCard.tsx` | بطاقة خطة | حرجة |
| `src/components/plans/PlanStatusBar.tsx` | شريط الحالة | حرجة |
| `src/components/plans/ConvertToGroupDialog.tsx` | حوار تحويل لمجموعة | مهمة |
| `src/components/plans/LinkToGroupDialog.tsx` | حوار ربط بمجموعة | مهمة |
| `src/components/plans/PlanMembersList.tsx` | قائمة الأعضاء | مهمة |
| `src/i18n/locales/ar/plans.json` | ترجمة عربية | حرجة |
| `src/i18n/locales/en/plans.json` | ترجمة إنجليزية | حرجة |

### ملفات معدلة

| الملف | التعديل | الأولوية |
|-------|--------|---------|
| `src/App.tsx` | إضافة 3 routes جديدة | حرجة |
| `src/components/dashboard/SimpleQuickActions.tsx` | إضافة زر "الخطط" | مهمة |
| `src/hooks/useUsageCredits.ts` | إضافة create_plan | مهمة |

---

## 7. ما لا يشمله هذه المرحلة (المراحل 2 و 3)

- Edge function للاقتراحات AI (المرحلة 2)
- واجهة الاقتراحات مع "حوّل لتصويت" (المرحلة 2)
- نظام التصويت الكامل (المرحلة 2)
- ربط المصاريف بالخطة (المرحلة 3)
- تبويب المصاريف في تفاصيل الخطة (المرحلة 3)
- زر "انقل هذا المصروف للخطة" (المرحلة 3)

الجداول لكل هذه المراحل ستُنشأ الآن في الـ migration لتجنب migrations إضافية لاحقاً.
