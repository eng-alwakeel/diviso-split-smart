

# ترقية القائمة المنسدلة إلى لوحة مستخدم متقدمة

## التغييرات

### 1. `src/components/AppHeader.tsx` — إعادة هيكلة القائمة المنسدلة

**Header Section (محسّن):**
- خلفية مميزة `bg-muted/50` مع padding أكبر
- Avatar أكبر (h-10 w-10) بجانب الاسم والإيميل
- شارة المؤسس الذهبية `FoundingBadge` (إذا `isFoundingUser`)
- رصيد النقاط: عرض `balance.totalAvailable` مع أيقونة `Coins`

**Imports الجديدة:**
- `useFoundingUser` — لعرض شارة المؤسس
- `useUsageCredits` — لعرض الرصيد
- `FoundingBadge` — المكون الجاهز
- `Receipt`, `Gift` — أيقونات للعناصر الجديدة

**تعديل query الملف الشخصي** — إضافة `user.id` للـ return لتمريره لـ `useFoundingUser`

**هيكلة القائمة الجديدة:**

```text
┌──────────────────────────┐
│ 👤 أحمد محمد              │
│    ahmed@email.com        │
│    👑 #42  ·  🪙 118 نقطة  │
├──────────────────────────┤
│ 📋 مصاريفي                │
│ 🎁 الإحالة                │
├──────────────────────────┤
│ ⚙️ الإعدادات              │
│ 👑 لوحة المالك (ذهبي)     │
│ 🛡️ لوحة الإدارة (أخضر)   │
│ 🌐 اللغة                  │
├──────────────────────────┤
│ 🚪 تسجيل الخروج (أحمر)    │
└──────────────────────────┘
```

**Section 1 - أدوات أساسية** (بعد الـ header):
- مصاريفي → `/my-expenses` (أيقونة `Receipt`)
- الإحالة → `/referral` (أيقونة `Gift`)

**Section 2 - النظام** (بعد separator):
- الإعدادات (كما هو)
- لوحات المالك/الإدارة (حسب الصلاحيات)
- اللغة

**Section 3 - خطر** (بعد separator):
- تسجيل الخروج بلون أحمر (كما هو)

### 2. ترجمات جديدة

**`ar/common.json` + `en/common.json`:**
```json
"menu": {
  "my_expenses": "مصاريفي" / "My Expenses",
  "referral": "الإحالة" / "Referral",
  "credits_balance": "رصيدك: {{count}} نقطة" / "Balance: {{count}} credits"
}
```

### الملفات المتأثرة

| الملف | التغيير |
|---|---|
| `src/components/AppHeader.tsx` | إعادة هيكلة القائمة + عرض الشارة والرصيد |
| `src/i18n/locales/ar/common.json` | مفاتيح `menu.*` |
| `src/i18n/locales/en/common.json` | مفاتيح `menu.*` |

