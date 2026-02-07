

# تحسين QR Code للانضمام -- Design + Conversion + Usability

## ملخص التغييرات

تحويل مكون QRCodeDisplay من نسخة واحدة مزخرفة إلى **نسختين منفصلتين**:
- **نسخة A (Brand)**: للعرض داخل التطبيق فقط -- مع شعار Diviso وألوان خفيفة
- **نسخة B (Functional)**: للتحميل والمشاركة -- أبيض/أسود بدون زخرفة للمسح الأسرع

مع تحديث النصوص لرفع معدل التحويل، وإضافة رابط مختصر `/j/`.

---

## الملفات المطلوب تعديلها/إنشاؤها

### 1. `src/components/QRCodeDisplay.tsx` -- إعادة بناء كامل

**التغييرات الرئيسية:**

#### نسخة A (Brand -- داخل التطبيق):
- لون QR: أسود داكن (`#1A1C1E`) بدل الأخضر الحالي (`#6B8A1F`)
- خلفية بيضاء
- Logo Diviso: تصغير من 30% إلى 20% (`imageSize: 0.2`)
- نقاط: `type: "square"` بدل `"rounded"` (أقرب للـ Standard)
- زوايا: `type: "square"` بدل `"extra-rounded"`
- Error Correction: `'H'` (يبقى كما هو)

#### نسخة B (Functional -- للمشاركة/التحميل):
- إنشاء QRCodeStyling instance منفصل بالإعدادات التالية:
  - لون QR: أسود خالص `#000000`
  - خلفية: أبيض خالص `#ffffff`
  - بدون Logo (`image: undefined`)
  - نقاط: `type: "square"` (Standard QR)
  - زوايا: `type: "square"` (Standard)
  - Error Correction: `'H'`
  - حجم: `1024x1024` بكسل (كافي بعد ضغط واتساب)

#### تعديل دوال التحميل والمشاركة:
- `downloadQRCode()`: يستخدم نسخة B (Functional) دائما
- `shareQRCode()`: يستخدم نسخة B (Functional) دائما
- العرض في التطبيق: يستخدم نسخة A (Brand)

#### تعديل النصوص:
- استبدال `t('qr.scan_to_join')` بمفتاح جديد `t('qr.join_group')` = "انضم للمجموعة"
- إضافة وصف `t('qr.scan_instruction')` = "امسح بالكاميرا وابدأ القسمة فوراً"
- في نسخة B المحملة: إضافة نص `t('qr.scan_to_join_group')` = "امسح للانضمام للمجموعة"

#### تعديل واجهة العرض:
- تكبير مساحة QR (الأولوية البصرية)
- إزالة الحد الخارجي (gradient border) وتبسيط الإطار
- تقليل العناصر الثانوية

#### Props جديد:
- إضافة `variant?: 'brand' | 'functional'` (افتراضي: `'brand'`)
- إضافة `shortUrl?: string` لعرض الرابط المختصر تحت QR

---

### 2. `src/i18n/locales/ar/referral.json` -- تحديث النصوص

```text
"qr": {
  ...النصوص الحالية...
+ "join_group": "انضم للمجموعة",
+ "scan_instruction": "افتح الكاميرا وامسح الرمز",
+ "scan_to_join_group": "امسح للانضمام للمجموعة"
}
```

### 3. `src/i18n/locales/en/referral.json` -- تحديث النصوص

```text
"qr": {
  ...النصوص الحالية...
+ "join_group": "Join the Group",
+ "scan_instruction": "Open camera and scan the code",
+ "scan_to_join_group": "Scan to join the group"
}
```

---

### 4. `src/App.tsx` -- إضافة الرابط المختصر `/j/:code`

إضافة route جديد:
```text
<Route path="/j/:referralCode" element={<LazyReferralSignup />} />
```
بجانب الـ route الحالي `/join/:referralCode` -- كلاهما يشيران لنفس الصفحة.

### 5. `src/hooks/useReferrals.ts` -- تحديث الرابط

تعديل `getReferralLink()`:
```text
// قبل:
return `${BRAND_CONFIG.url}/join/${referralCode}`;

// بعد:
return `${BRAND_CONFIG.url}/j/${referralCode}`;
```

هذا يقصّر الرابط المعروض في QR ويقلل كثافة البيانات مما يسرّع المسح.

---

### 6. `src/pages/ReferralCenter.tsx` -- تحسين العرض

- تكبير حجم QR من `size={180}` إلى `size={220}`
- تمرير الرابط المختصر كـ prop
- تحديث نص العنوان لاستخدام مفاتيح الترجمة الجديدة

### 7. `src/components/referral/ShareOptionsDialog.tsx` -- تحسين تاب QR

- تكبير حجم QR من `size={250}` إلى `size={280}`
- تحديث النصوص المحيطة
- عرض الرابط المختصر تحت QR

### 8. `src/components/group/InviteManagementDialog.tsx` -- تحسين QR المجموعة

- تكبير من `size={140}` إلى `size={180}`

### 9. `src/pages/GroupInvite.tsx` -- تحسين QR صفحة الدعوة

- تكبير من `size={200}` إلى `size={240}`

---

## التفاصيل التقنية

### بنية QRCodeDisplay الجديدة

```text
QRCodeDisplay
+-- Props: value, size, className, showActions, variant ('brand'|'functional')
|
+-- brandQrRef (للعرض)
|   - QRCodeStyling مع:
|     color: #1A1C1E, dots: square, corners: square
|     image: favicon.png (20%), errorCorrection: H
|
+-- functionalQrRef (للتحميل/المشاركة - مخفي)
|   - QRCodeStyling مع:
|     color: #000000, dots: square, corners: square
|     بدون image, errorCorrection: H, size: 1024x1024
|
+-- downloadQRCode() --> يستخدم functionalQrRef
+-- shareQRCode() --> يستخدم functionalQrRef
+-- العرض المرئي --> يستخدم brandQrRef
```

### مقارنة QR قبل وبعد

| الخاصية | قبل (حالياً) | نسخة A (Brand) | نسخة B (Functional) |
|---------|-------------|----------------|---------------------|
| لون النقاط | #6B8A1F (أخضر) | #1A1C1E (داكن جداً) | #000000 (أسود) |
| نوع النقاط | rounded | square | square |
| الزوايا | extra-rounded | square | square |
| Logo | 30% مع margin | 20% مع margin | بدون |
| Error Correction | H | H | H |
| الحجم | حسب الـ prop | حسب الـ prop | 1024px ثابت |
| الاستخدام | الكل | العرض فقط | التحميل/المشاركة |

### الرابط المختصر

```text
قبل: https://diviso.app/join/00CB6801  (35 حرف)
بعد: https://diviso.app/j/00CB6801    (31 حرف)
```

أقل حروف = أقل بيانات في QR = نقاط أقل = مسح أسرع.

الـ route القديم `/join/:code` يبقى يعمل للتوافق مع الروابط السابقة.

---

## ملخص الملفات

| الملف | العملية | الأولوية |
|-------|---------|---------|
| `src/components/QRCodeDisplay.tsx` | إعادة بناء (نسختين A+B) | حرجة |
| `src/i18n/locales/ar/referral.json` | إضافة مفاتيح ترجمة | حرجة |
| `src/i18n/locales/en/referral.json` | إضافة مفاتيح ترجمة | حرجة |
| `src/App.tsx` | إضافة route `/j/:code` | مهمة |
| `src/hooks/useReferrals.ts` | تقصير الرابط | مهمة |
| `src/pages/ReferralCenter.tsx` | تكبير QR + نصوص جديدة | مهمة |
| `src/components/referral/ShareOptionsDialog.tsx` | تكبير QR + نصوص | مهمة |
| `src/components/group/InviteManagementDialog.tsx` | تكبير QR | تحسين |
| `src/pages/GroupInvite.tsx` | تكبير QR | تحسين |

