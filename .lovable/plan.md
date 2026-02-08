

# اضافة النرد والتخطيط الى قائمة تكاليف العمليات

## ملخص

اضافة عمليتين مفقودتين الى قائمة تكاليف العمليات في تاب النقاط بصفحة الاعدادات:
- **رمي النرد** (1 نقطة)
- **انشاء خطة** (3 نقاط)

البيانات موجودة بالفعل في `CREDIT_COSTS` لكنها غير معروضة في الواجهة.

---

## التعديل

### `src/components/settings/CreditsTab.tsx`

**تعديل واحد فقط** -- اضافة عنصرين الى مصفوفة `operationCosts`:

```text
القائمة الحالية (7 عناصر):
1. ocr_scan (Scan) -- 1 نقطة
2. smart_category (Tag) -- 1 نقطة
3. recommendation (Lightbulb) -- 1 نقطة
4. create_group (UserPlus) -- 5 نقاط
5. settlement (HandCoins) -- 3 نقاط
6. advanced_report (FileText) -- 2 نقاط
7. export_pdf (FileDown) -- 1 نقطة

القائمة بعد التعديل (9 عناصر):
1. ocr_scan (Scan) -- 1 نقطة
2. smart_category (Tag) -- 1 نقطة
3. recommendation (Lightbulb) -- 1 نقطة
4. roll_dice (Dice5) -- 1 نقطة          ← جديد
5. create_plan (Map) -- 3 نقاط          ← جديد
6. create_group (UserPlus) -- 5 نقاط
7. settlement (HandCoins) -- 3 نقاط
8. advanced_report (FileText) -- 2 نقاط
9. export_pdf (FileDown) -- 1 نقطة
```

**تعديلات اضافية:**
- استيراد ايقونتين: `Dice5` و `Map` من `lucide-react`
- تصحيح لون ايقونة العنوان: `text-amber-500` يتحول الى `text-primary` (التزام بالوان البراند)

---

## التفاصيل التقنية

- `roll_dice` موجود في `CREDIT_COSTS` بتكلفة 1 نقطة واسم عربي "رمي النرد"
- `create_plan` موجود في `CREDIT_COSTS` بتكلفة 3 نقاط واسم عربي "إنشاء خطة"
- لا حاجة لتعديل اي ملف آخر
- الترجمة تأتي تلقائيا من `CREDIT_COSTS[key].nameAr` / `nameEn`

---

## الملفات المعدلة

| الملف | التعديل |
|-------|--------|
| `src/components/settings/CreditsTab.tsx` | اضافة `roll_dice` و `create_plan` + استيراد ايقونات + تصحيح لون |

