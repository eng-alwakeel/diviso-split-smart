

# تحسين SEO للغة الإنجليزية — استهداف كلمات بحث عالمية

## المشاكل الحالية

1. **`index.html` بالكامل عربي** — العنوان، الوصف، OG tags، Structured Data، FAQ schema، BreadcrumbList، و noscript كلها عربي فقط
2. **SEO component defaults عربية** — `defaultSEO` في `SEO.tsx` كل النصوص عربية
3. **Structured Data بدون إنجليزي** — الـ `featureList` و `description` في JSON-LD عربية فقط
4. **FAQ Schema عربي فقط** — الأسئلة في `index.html` و `FAQSection.tsx` تُرسل عربي فقط في الـ schema حتى لو المستخدم إنجليزي
5. **English keywords ضعيفة** — المقالات الإنجليزية موجودة لكن keywords قليلة ومش مُستهدفة

## الخطة

### 1. تحديث `index.html` — إضافة English-first SEO
- تغيير `<title>` ليشمل الإنجليزي أولاً: `"Diviso | Split Expenses Smartly — Best Bill Splitting App"`
- تحديث `meta description` ليكون bilingual مع الإنجليزي أولاً
- تحديث `og:title` و `og:description` و `twitter:title/description` لتشمل إنجليزي
- إضافة English keywords مستهدفة: `"split expenses app, bill splitting app, expense tracker, splitwise alternative, group expense manager, shared expenses calculator, travel expense splitter, roommate expense tracker"`
- تحديث Structured Data (`SoftwareApplication`) — إضافة `description` إنجليزية و `featureList` إنجليزية
- تحديث FAQ Schema — إضافة الأسئلة بالإنجليزي
- تحديث BreadcrumbList — أسماء إنجليزية
- تحديث `<noscript>` — محتوى إنجليزي أولاً

### 2. تحديث `src/components/SEO.tsx`
- تحديث `defaultSEO` بعنوان ووصف و keywords إنجليزية
- الـ component يحدد اللغة ديناميكياً حسب `lang` prop

### 3. تحديث `src/components/landing/FAQSection.tsx`
- الـ JSON-LD schema يُرسل الأسئلة بالإنجليزي والعربي معاً (أو الإنجليزي فقط لأن Google يفضل لغة واحدة per page)

### 4. تحسين English keywords في المقالات الموجودة
- تحديث `keywordsEn` في المقالات الـ 5 الجديدة لتشمل long-tail keywords مستهدفة:
  - `"how to split restaurant bill with friends app"`
  - `"best expense splitting app 2026"`
  - `"travel expense tracker for groups"`
  - `"shared apartment expense calculator"`
  - `"ramadan group expense manager"`

### 5. إضافة English `og:locale:alternate`
- إضافة `<meta property="og:locale:alternate" content="en_US" />` في `index.html`

## الملفات المتأثرة
- `index.html` — تحديث العنوان والوصف و Structured Data و FAQ Schema
- `src/components/SEO.tsx` — تحديث defaults لتكون bilingual
- `src/components/landing/FAQSection.tsx` — FAQ schema bilingual
- `src/content/blog/articles.ts` — تحسين English keywords

