

# تحسين الصفحة الرئيسية — 8 تعديلات

## الملفات المتأثرة

| الملف | التغيير |
|---|---|
| `src/pages/Dashboard.tsx` | إعادة ترتيب الملخص، تحسين CTAs، empty state، تحسين activity label |
| `src/components/AppHeader.tsx` | تبسيط الهيدر، إزالة ألوان لوحات الإدارة |
| `src/components/BottomNav.tsx` | تقليل spacing وحجم النص |
| `src/i18n/locales/ar/dashboard.json` | تحديث نص الإحالة + إضافة مفاتيح empty state |
| `src/i18n/locales/en/dashboard.json` | نفس التحديثات بالإنجليزي |

---

## التفاصيل

### 1. إعادة ترتيب Summary Grid (`Dashboard.tsx`)

**الصف الأول** (من اليمين لليسار في RTL):
1. الرصيد الصافي (Wallet)
2. عليك ↓ (ArrowDown — أحمر — خط أكبر `text-xl`)
3. لك ↑ (ArrowUp — أخضر — خط أكبر `text-xl`)

**الصف الثاني**:
4. عدد المجموعات (Users)
5. المصاريف الشهرية (Receipt)
6. النشاط (Activity)

تعديل `SummaryCell`: إضافة prop `emphasized` يجعل القيمة `text-xl font-black` بدلاً من `text-lg font-bold` للخلايا المميزة (عليك/لك).

### 2. تحسين أزرار الإجراءات (`Dashboard.tsx`)

تغيير الزرين ليكونا بنفس الأهمية:
- "إنشاء مجموعة" → `variant="default"` (primary)
- "إضافة مصروف" → `variant="outline"`
- كلاهما `flex-1 h-12` متساويان

### 3. تبسيط شريط الإحالة (`Dashboard.tsx` + ترجمات)

تغيير النص من:
`"🎁 دعوت {{count}} أصدقاء – لديك {{points}} نقطة"`
إلى:
`"{{count}} دعوات • {{points}} نقطة"`

### 4. إضافة label "نشاط حديث" فوق RecentGroupActivityCard (`Dashboard.tsx`)

إضافة `<p className="text-xs text-muted-foreground mb-1">نشاط حديث</p>` فوق الكارد. مفتاح ترجمة: `recent_activity.label`.

### 5. تحسين القائمة المنسدلة (`AppHeader.tsx`)

- إزالة `${config.color}` من عناصر لوحات الإدارة/المالك — جعلها بنفس لون النص العادي
- تبسيط الهيدر: إزالة `FoundingBadge` المنفصل ودمج الرصيد في سطر واحد:
  ```
  الاسم
  الإيميل
  رصيدك: 466 نقطة
  ```

### 6. تحسين Bottom Bar (`BottomNav.tsx`)

- تقليل padding الداخلي: `pe-8`/`ps-8` → `pe-6`/`ps-6`
- تصغير النص: إضافة `text-[10px]` بدل `text-xs`
- تصغير الأيقونات: `h-4 w-4` بدل `h-5 w-5`

### 7. Empty State (`Dashboard.tsx`)

عند `groupsCount === 0`:
- إخفاء قسم النشاط وشريط الإحالة
- عرض كارد بسيط:
  ```
  "ابدأ بإنشاء أول مجموعة"
  [زر: إنشاء مجموعة]
  ```
- مفاتيح ترجمة: `empty_state.title` + `empty_state.cta`

### 8. ترجمات جديدة

```json
// ar
"referral_strip.summary": "{{count}} دعوات • {{points}} نقطة",
"recent_activity.label": "نشاط حديث",
"empty_state.title": "ابدأ بإنشاء أول مجموعة",
"empty_state.cta": "إنشاء مجموعة"

// en
"referral_strip.summary": "{{count}} invites • {{points}} points",
"recent_activity.label": "Recent Activity",
"empty_state.title": "Start by creating your first group",
"empty_state.cta": "Create Group"
```

