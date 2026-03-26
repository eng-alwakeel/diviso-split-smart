

# تقليل التبويبات السفلية إلى 3 فقط

## التغيير
ملف واحد فقط: `src/components/BottomNav.tsx`

### التعديلات:
1. تغيير `baseItems` من 4 عناصر إلى 3:
   - **الرئيسية** → `/dashboard` (Home icon)
   - **مجموعاتي** → `/my-groups` (Users icon)
   - **ملفي** → `/settings` (User icon)

2. إزالة "مصاريفي" (`/my-expenses`) و "الإحالة" (`/referral`) من الشريط فقط — الصفحات تبقى كما هي

3. للمشرفين: إضافة زر الإدارة كرابع (بدل خامس)

4. تحديث i18n: إضافة مفتاح `nav.profile` في `ar/common.json` و `en/common.json`

### الملفات المتأثرة

| الملف | التغيير |
|---|---|
| `src/components/BottomNav.tsx` | تقليل التبويبات لـ 3 + تغيير أيقونة الملف الشخصي |
| `src/i18n/locales/ar/common.json` | إضافة `nav.profile` |
| `src/i18n/locales/en/common.json` | إضافة `nav.profile` |

