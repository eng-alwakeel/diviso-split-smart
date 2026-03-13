

# استراتيجية تحسين SEO لجلب زيارات عضوية عالية

## تحليل الوضع الحالي

**نقاط القوة الموجودة:**
- 8 مقالات مدونة + 6 صفحات use cases + 9 landing pages
- Structured data (JSON-LD) في معظم الصفحات
- Sitemap و robots.txt محدّثين
- دعم ثنائي اللغة (عربي/إنجليزي)

**المشاكل الرئيسية:**
1. **SPA بدون Pre-rendering** — Google يقدر يقرأ JS لكن بطيء + بعض المحركات لا تنفذ JS أصلاً
2. **محتوى المدونة محدود** — 8 مقالات فقط، تحتاج مقالات تستهدف كلمات بحث عالية الطلب
3. **صفحات Landing Pages (`/lp/*`) غير مفهرسة** — مش موجودة في sitemap و مش مذكورة في robots.txt
4. **لا يوجد Internal Linking منظم** — المقالات والـ use cases لا تربط ببعض بشكل كافي

## الخطة المقترحة

### 1. إضافة صفحات مدونة جديدة تستهدف كلمات بحث عالية الطلب
إضافة 4-5 مقالات جديدة في `src/content/blog/articles.ts` تستهدف:
- **"تقسيم حساب المطعم"** — كلمة بحث شائعة جداً
- **"تطبيق مصاريف الرحلة"** — بحث مباشر عن حل
- **"كيف احسب مصاريفي الشهرية"** — كلمة بحث عامة عالية الحجم
- **"أفضل تطبيق تقسيم فلوس"** — مقارنة تجذب زوار intent عالي
- **"مصاريف رمضان مع الأصدقاء"** — موسمية لكن عالية الطلب

كل مقالة تشمل: عنوان SEO محسّن، keywords، محتوى 800+ كلمة، FAQ schema

### 2. تحديث Sitemap بالصفحات الناقصة
إضافة صفحات `/lp/*` و `/launch` و `/changelog` و `/founding` للـ sitemap

### 3. إضافة Internal Linking Component
مكوّن `RelatedArticles` يظهر في نهاية كل مقالة مدونة يربط بمقالات ذات صلة + use cases

### 4. تحسين meta descriptions لتكون أكثر جذباً للنقر (CTR)
تحديث descriptions في الصفحات الرئيسية لتشمل أرقام وعبارات action-oriented مثل "أكثر من 10,000 مستخدم"

### 5. إضافة FAQ Schema للصفحة الرئيسية
إضافة أسئلة شائعة مع FAQ structured data في الصفحة الرئيسية — يظهر كـ rich snippets في Google

## الملفات المتأثرة
- `src/content/blog/articles.ts` — إضافة 4-5 مقالات جديدة
- `public/sitemap.xml` — إضافة URLs ناقصة
- `src/components/blog/RelatedArticles.tsx` — مكوّن جديد
- `src/pages/BlogPost.tsx` — إضافة RelatedArticles
- `index.html` — إضافة FAQ schema
- `src/pages/Index.tsx` — إضافة FAQ section مع structured data

