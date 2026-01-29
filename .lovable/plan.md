

# خطة إنشاء الفاتورة المحلية وإرسالها لـ Odoo

## ملخص الوضع الحالي

| البيان | القيمة |
|--------|--------|
| المستخدم | `096e33cc-68ab-4abb-9561-90a709a1f408` |
| الاسم | adel alwakeel |
| الهاتف | +966540000663 (سعودي = VAT 15%) |
| Odoo Partner ID | غير موجود (null) |
| عدد عمليات الشراء المكتملة | 2 عمليات (19 ريال لكل واحدة) |
| الفواتير الموجودة | 0 |

### بيانات آخر عملية شراء:
- **Purchase ID**: `257e2add-ba78-4d5a-9f1e-ed4d6aa0ff7f`
- **Payment Reference**: `f0a9e8f0-9202-432c-8b82-19502dc848b6`
- **Plan**: starter_monthly
- **المبلغ**: 19 SAR
- **Billing Cycle**: monthly

---

## الخطوات المطلوبة

### الخطوة 1: إنشاء الفاتورة المحلية في قاعدة البيانات

سأقوم باستدعاء دالة `create_invoice_for_purchase` مع المعاملات التالية:

```text
+---------------------+------------------------------------------+
| المعامل             | القيمة                                   |
+---------------------+------------------------------------------+
| p_user_id           | 096e33cc-68ab-4abb-9561-90a709a1f408     |
| p_purchase_type     | subscription                             |
| p_purchase_id       | 257e2add-ba78-4d5a-9f1e-ed4d6aa0ff7f     |
| p_amount            | 19                                       |
| p_description       | Starter Monthly Subscription             |
| p_description_ar    | اشتراك ستارتر (شهري)                     |
| p_payment_reference | f0a9e8f0-9202-432c-8b82-19502dc848b6     |
| p_billing_cycle     | monthly                                  |
+---------------------+------------------------------------------+
```

**النتيجة المتوقعة:**
- إنشاء سجل في جدول `invoices` برقم فاتورة جديد (مثل `DIV-INV-2026-000003`)
- حساب الضريبة تلقائياً: 16.52 SAR + 2.48 VAT = 19 SAR
- إنشاء سجل في جدول `invoice_items` بنوع `subscription_monthly`

---

### الخطوة 2: إرسال الفاتورة إلى Odoo للحصول على ZATCA QR Code

سأقوم باستدعاء Edge Function `odoo-create-invoice` مع البيانات التالية:

```json
{
  "user_id": "096e33cc-68ab-4abb-9561-90a709a1f408",
  "purchase_type": "subscription_monthly",
  "amount": 19,
  "description": "Diviso Monthly Subscription / اشتراك ديفيزو الشهري",
  "payment_reference": "f0a9e8f0-9202-432c-8b82-19502dc848b6",
  "subscription_id": "257e2add-ba78-4d5a-9f1e-ed4d6aa0ff7f"
}
```

**ما سيحدث:**
1. البحث عن Partner في Odoo بالإيميل أو الهاتف
2. إنشاء Partner جديد إذا لم يوجد
3. حفظ `odoo_partner_id` في جدول `profiles`
4. إنشاء فاتورة في Odoo مع المنتج المناسب
5. ترحيل الفاتورة (posting) لتوليد بيانات ZATCA
6. استرجاع `l10n_sa_qr_code_str` وتحديث الفاتورة المحلية بـ QR Code

---

### الخطوة 3: التحقق من النتائج

بعد التنفيذ، سأتحقق من:
1. وجود الفاتورة في جدول `invoices`
2. وجود `qr_base64` في الفاتورة
3. تحديث `odoo_partner_id` في `profiles`

---

## تفاصيل تقنية

### حساب الضريبة (للمستخدم السعودي):
```text
المبلغ الإجمالي (شامل الضريبة): 19 SAR
نسبة الضريبة: 15%
المبلغ قبل الضريبة: 19 / 1.15 = 16.52 SAR
قيمة الضريبة: 19 - 16.52 = 2.48 SAR
```

### Odoo Secrets المطلوبة (متوفرة):
- ODOO_URL
- ODOO_DB
- ODOO_USERNAME
- ODOO_API_KEY
- ODOO_COMPANY_ID
- ODOO_SALES_JOURNAL_ID
- ODOO_VAT_TAX_ID
- ODOO_PRODUCT_MONTHLY_SUB_ID

---

## الإجراءات

1. **Migration SQL**: استدعاء `create_invoice_for_purchase` لإنشاء الفاتورة المحلية
2. **Edge Function Call**: استدعاء `odoo-create-invoice` مع معرف الاشتراك للحصول على QR Code
3. **التحقق**: التأكد من ظهور الفاتورة مع QR Code في واجهة المستخدم

