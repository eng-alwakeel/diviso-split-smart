
# Known People Selector -- إضافة أعضاء معروفين للمجموعات

## ملخص

إضافة ميزة "أشخاص تعرفهم" كتبويب جديد (ويكون الافتراضي) في حوار دعوة الأعضاء `InviteManagementDialog`. يعرض قائمة بأشخاص سبق التعامل معهم في مجموعات أو عمليات سابقة، مع إمكانية إضافتهم مباشرة للمجموعة بضغطة واحدة.

---

## 1. قاعدة البيانات (Database)

### جدول جديد: `known_contacts`

| العمود | النوع | الوصف |
|--------|------|-------|
| `id` | uuid (PK) | معرف فريد |
| `user_id` | uuid (NOT NULL) | المستخدم الحالي |
| `contact_user_id` | uuid (NOT NULL) | الشخص المعروف |
| `shared_groups_count` | integer (default 0) | عدد المجموعات المشتركة |
| `last_interaction_at` | timestamptz | آخر تفاعل |
| `created_at` | timestamptz (default now) | تاريخ الإنشاء |
| `updated_at` | timestamptz (default now) | تاريخ التحديث |

- Unique constraint: `(user_id, contact_user_id)`
- Foreign keys: `user_id` و `contact_user_id` يشيران إلى `profiles(id)`
- RLS: المستخدم يرى فقط سجلاته الخاصة (`user_id = auth.uid()`)

### Trigger لتحديث `known_contacts` تلقائياً

عند إضافة عضو جديد في `group_members`، يتم تشغيل trigger يقوم بـ:
1. جلب جميع أعضاء المجموعة الحاليين
2. لكل عضو موجود + العضو الجديد: إنشاء أو تحديث سجل في `known_contacts` (في الاتجاهين)
3. تحديث `shared_groups_count` و `last_interaction_at`

### RPC جديد: `get_known_contacts`

دالة تستقبل `p_exclude_user_ids uuid[]` وترجع:

```text
id, contact_user_id, shared_groups_count, last_interaction_at,
display_name, name, avatar_url
```

مرتبة حسب: `last_interaction_at DESC, shared_groups_count DESC`

مع join على `profiles` لجلب بيانات العرض.

### Backfill: ملء البيانات الحالية

SQL لمرة واحدة يمسح جميع العلاقات الموجودة حالياً من `group_members` ويملأ `known_contacts` بها.

---

## 2. RPC للإضافة المباشرة: `add_member_to_group`

دالة RPC جديدة تستقبل:
- `p_group_id uuid`
- `p_user_id uuid`

وتقوم بـ:
1. التحقق أن المستخدم الحالي owner أو admin
2. التحقق أن `p_user_id` ليس عضواً بالفعل
3. التحقق أن المجموعة ليست مغلقة
4. إدخال السجل في `group_members` بدور `member`
5. إرسال إشعار للمستخدم المُضاف

ترجع: نص حالة ('added' أو رسالة خطأ)

---

## 3. الملفات الجديدة

### `src/hooks/useKnownContacts.ts`

Hook يستخدم React Query لجلب الأشخاص المعروفين:
- يستدعي RPC `get_known_contacts` مع استثناء الأعضاء الحاليين
- يوفر دالة `addMemberToGroup(userId)` تستدعي RPC `add_member_to_group`
- يدير حالة التحميل والخطأ

### `src/components/group/invite-tabs/KnownPeopleTab.tsx`

مكون التبويب الجديد:

```text
+--------------------------------------------+
|  [صورة] اسم الشخص                    [+ إضافة]
|          مشتركون في 3 مجموعات
+--------------------------------------------+
|  [صورة] اسم الشخص                    [+ إضافة]
|          مشتركون في مجموعة واحدة
+--------------------------------------------+
```

- عرض قائمة الأشخاص مع: الصورة، الاسم، عدد المجموعات المشتركة
- زر "إضافة" لكل شخص
- عند الضغط: إضافة مباشرة + Toast تأكيد + إزالة الشخص من القائمة
- حالة فارغة: "لا يوجد أشخاص سابقين -- استخدم رابط الدعوة"
- Skeleton loading أثناء التحميل
- شريط بحث بسيط للتصفية حسب الاسم

---

## 4. الملفات المعدلة

### `src/components/group/InviteManagementDialog.tsx`

- إضافة التبويب الجديد "أشخاص تعرفهم" كأول تبويب
- تغيير `activeTab` الافتراضي من `"link"` إلى `"known"`
- تحديث `grid-cols-3` إلى `grid-cols-4`
- إضافة أيقونة `UserCheck` للتبويب الجديد

التبويبات الجديدة:
1. **أشخاص** (افتراضي) -- `KnownPeopleTab`
2. **رابط** -- `InviteLinkTab`
3. **جهات** -- `InviteContactsTab`
4. **متابعة** -- `InviteTrackingTab`

### `src/i18n/locales/ar/groups.json`

إضافة مفاتيح جديدة تحت `known_people`:

```text
"known_people": {
  "title": "أشخاص تعرفهم",
  "tab_label": "أشخاص",
  "subtitle": "أضف أشخاصاً سبق أن كانوا معك في مجموعات سابقة",
  "shared_groups_one": "مشتركون في مجموعة واحدة",
  "shared_groups_other": "مشتركون في {{count}} مجموعات",
  "add": "إضافة",
  "adding": "جاري الإضافة...",
  "added": "تمت الإضافة!",
  "added_desc": "تمت إضافة {{name}} للمجموعة",
  "add_failed": "تعذرت الإضافة",
  "empty_title": "لا يوجد أشخاص سابقين",
  "empty_desc": "استخدم رابط الدعوة أو جهات الاتصال لدعوة أعضاء جدد",
  "search_placeholder": "ابحث بالاسم...",
  "already_member": "عضو بالفعل"
}
```

### `src/i18n/locales/en/groups.json`

نفس المفاتيح بالإنجليزية:

```text
"known_people": {
  "title": "People You Know",
  "tab_label": "People",
  "subtitle": "Add people you've been in groups with before",
  "shared_groups_one": "Shared 1 group",
  "shared_groups_other": "Shared {{count}} groups",
  "add": "Add",
  "adding": "Adding...",
  "added": "Added!",
  "added_desc": "{{name}} has been added to the group",
  "add_failed": "Failed to add",
  "empty_title": "No previous contacts",
  "empty_desc": "Use invite link or contacts to invite new members",
  "search_placeholder": "Search by name...",
  "already_member": "Already a member"
}
```

---

## 5. التفاصيل التقنية

### بنية Trigger

```text
group_members INSERT
  --> trigger: update_known_contacts_on_member_join()
    --> للعضو الجديد + كل عضو حالي في المجموعة:
        INSERT INTO known_contacts (user_id, contact_user_id, shared_groups_count, last_interaction_at)
        VALUES (new_member, existing_member, 1, now())
        ON CONFLICT (user_id, contact_user_id)
        DO UPDATE SET
          shared_groups_count = (SELECT count(DISTINCT gm1.group_id) FROM group_members gm1 JOIN group_members gm2 ...),
          last_interaction_at = now(),
          updated_at = now()
```

### سلوك الإضافة المباشرة

```text
User clicks "إضافة"
  --> useKnownContacts.addMemberToGroup(userId)
    --> RPC: add_member_to_group(p_group_id, p_user_id)
      --> Validates: is owner/admin, not already member, group not closed
      --> INSERT INTO group_members
      --> INSERT INTO notifications (إشعار للمستخدم المُضاف)
    --> On success: Toast + Remove from list + refetchInvites
    --> On error: Toast with error message
```

### RLS Policies لـ `known_contacts`

```text
- SELECT: user_id = auth.uid()
- INSERT: user_id = auth.uid() (للـ trigger يستخدم SECURITY DEFINER)
- UPDATE: user_id = auth.uid()
- DELETE: user_id = auth.uid()
```

---

## 6. ملخص الملفات

| الملف | العملية | الأولوية |
|-------|---------|---------|
| Migration: جدول `known_contacts` + trigger + RPC | إنشاء جديد | حرجة |
| Migration: backfill بيانات حالية | إنشاء جديد | حرجة |
| `src/hooks/useKnownContacts.ts` | إنشاء جديد | حرجة |
| `src/components/group/invite-tabs/KnownPeopleTab.tsx` | إنشاء جديد | حرجة |
| `src/components/group/InviteManagementDialog.tsx` | تعديل (تبويب جديد) | حرجة |
| `src/i18n/locales/ar/groups.json` | إضافة مفاتيح | مهمة |
| `src/i18n/locales/en/groups.json` | إضافة مفاتيح | مهمة |

## 7. قيود مطبقة

- لا يوجد Follow / Friends / Public profiles
- لا يمكن البحث عن مستخدمين خارج العلاقات السابقة
- البيانات المعروضة: الاسم والصورة فقط (لا بيانات حساسة)
- RLS يمنع أي مستخدم من رؤية علاقات غيره
