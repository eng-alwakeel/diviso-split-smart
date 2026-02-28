
# UI V2 لصفحة "مصاريفي" (My Expenses)

## ملخص التغييرات
إعادة تصميم صفحة "مصاريفي" لتكون أخف وأوضح مع الحفاظ على نفس البيانات والمنطق.

---

## A) ExpenseStats.tsx — تحويل إلى Grid 2x2 مضغوط

**الملف:** `src/components/expenses/ExpenseStats.tsx`

التغييرات الكاملة:
- استبدال الـ 4 كروت الطولية + كرت Status Breakdown الضخم بـ Grid 2x2 مضغوط
- الكروت الأربع:
  1. **الرصيد الصافي** — رقم كبير (`text-2xl font-black`) + سطر واحد "يجب أن تدفع" أو "لك عند الآخرين" — خلفية خفيفة (لا أحمر صارخ)
  2. **إجمالي المدفوع** — رقم كبير أخضر + badges صغيرة "موافق: X" و "معلق: Y"
  3. **إجمالي المستحق** — رقم كبير + badges مشابهة
  4. **نظرة عامة** — عدد المصاريف + المجموعات + معدل الموافقة (مضغوط)
- حذف كرت `Status Breakdown` الكبير (md:col-span-2 lg:col-span-4) — المعلومات نفسها موجودة في الكروت الأربع
- تقليل padding من `p-6` إلى `p-3`
- Grid: `grid-cols-2 gap-3`

---

## B) MyExpenses.tsx — Header أخف + Tabs أصغر

**الملف:** `src/pages/MyExpenses.tsx`

التغييرات:
- **Header**: تقليل spacing من `space-y-6` إلى `space-y-4`
- زر "إضافة مصروف" يبقى أساسي (default variant)، زر "تحديث" يبقى outline وأصغر
- **Tabs**: تقليل ارتفاع TabsList — إضافة `h-9` وتصغير الأيقونات والنص
- التبويب النشط يحصل على shadow خفيف مثل V2 في صفحة المجموعة

---

## C) ExpenseCard.tsx — كرت مختصر V2

**الملف:** `src/components/expenses/ExpenseCard.tsx`

التغييرات الرئيسية:

1. **الشكل الافتراضي مختصر (Collapsed)**:
   - السطر الأول: Badge الحالة (يمين/أعلى) + المبلغ (`text-lg font-black`) — مرة واحدة فقط
   - السطر الثاني: عنوان المصروف
   - السطر الثالث: اسم المجموعة + التاريخ (سطر ثانوي مضغوط)
   - السطر الرابع: سطر واحد فقط "نصيبك: -5.83 SAR" (الأهم للمستخدم)

2. **إزالة العناصر من العرض الافتراضي**:
   - إزالة قسم "دفعت/نصيبك/الصافي" الكامل بخلفية gradient — يبقى سطر "نصيبك" فقط
   - إزالة زر "عرض التفاصيل" الكبير — الكرت نفسه يصبح قابل للنقر (`onClick` → `onViewDetails`)
   - إضافة سهم صغير (ChevronLeft للـ RTL) في الزاوية للإشارة أنه قابل للنقر

3. **أزرار التعديل/الحذف**:
   - تظهر فقط عند الحالة المناسبة (كما هي)
   - تصغير الحجم وتقليل البروز
   - نقلها إلى سطر واحد صغير أسفل الكرت

4. **ألوان الحالة**:
   - approved: `bg-green-500/10 text-green-600 border-green-500/20`
   - pending: `bg-amber-500/10 text-amber-600 border-amber-500/20`
   - rejected: `bg-muted text-muted-foreground`

5. **Padding**: تقليل من `p-3 sm:p-4` إلى `p-3`

---

## D) ExpenseFilters.tsx — تحسينات طفيفة

**الملف:** `src/components/expenses/ExpenseFilters.tsx`

التغييرات:
- تقليل ارتفاع حقل البحث (إضافة `h-9`)
- الفلاتر السريعة: إضافة `overflow-x-auto flex-nowrap no-scrollbar` للتمرير الأفقي
- تصغير أزرار الفلاتر (`h-7 text-xs`)
- زر "فلاتر متقدمة" يبقى كما هو (Collapsible)

---

## E) ExpenseStats — قسم الإحصائيات (Analytics Tab)

**الملف:** `src/components/expenses/ExpenseStats.tsx`

بما أن كرت Status Breakdown الكبير تم حذفه من الملخص أعلى الصفحة، يبقى متاحاً فقط ضمن تبويب "الإحصائيات" عبر `ExpenseChart.tsx` الذي يعرض الرسوم البيانية — لا تغيير على ExpenseChart.

---

## F) الملفات المتأثرة

| الملف | نوع التغيير |
|-------|-------------|
| `src/components/expenses/ExpenseStats.tsx` | Grid 2x2 مضغوط + حذف Status Breakdown |
| `src/components/expenses/ExpenseCard.tsx` | كرت مختصر + كرت قابل للنقر + سطر واحد "نصيبك" |
| `src/components/expenses/ExpenseFilters.tsx` | تصغير ارتفاعات + scrollable chips |
| `src/pages/MyExpenses.tsx` | spacing أقل + tabs أصغر |

---

## G) القيود المُلتزم بها
- لا تغيير في API calls أو حسابات الأرصدة
- RTL محفوظ 100%
- لا تكرار Badge الحالة داخل الكرت
- Bottom Nav لا يتداخل (padding-bottom موجود)
- جميع الوظائف (حذف/تعديل/عرض تفاصيل) تعمل كما هي
