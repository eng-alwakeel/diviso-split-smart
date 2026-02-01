
# خطة تأمين جدول الفواتير (Invoice Security Fix)

## ملخص المشكلة الأمنية

جدول `invoices` يحتوي على بيانات مالية حساسة، وبالرغم من وجود RLS يمنع المستخدمين من رؤية فواتير غيرهم، إلا أن هناك حقول داخلية يمكن استغلالها لربط البيانات بأنظمة خارجية (مثل Odoo).

---

## التحليل الحالي

| العنصر | الحالة | الملاحظة |
|--------|--------|----------|
| RLS Enabled | ✅ مفعّل | الجدول محمي |
| SELECT Policy | ✅ موجودة | `user_id = auth.uid()` |
| Admin Policy | ✅ موجودة | المسؤولون يرون كل الفواتير |
| Secure View | ❌ غير موجود | الكود يقرأ من الجدول مباشرة |
| Sensitive Fields | ⚠️ مكشوفة | `odoo_invoice_id`, `payment_txn_id`, `seller_cr_number` |

---

## الحقول الحساسة المطلوب إخفاؤها

| الحقل | السبب |
|-------|-------|
| `odoo_invoice_id` | معرّف داخلي للنظام المحاسبي |
| `odoo_invoice_name` | اسم الفاتورة في النظام المحاسبي |
| `payment_txn_id` | رقم عملية الدفع (يمكن استخدامه للتتبع) |
| `seller_vat_number` | رقم ضريبي (معلومات الشركة) |
| `seller_cr_number` | رقم السجل التجاري |
| `odoo_partner_id` | معرّف العميل في النظام المحاسبي |

---

## خطوات التنفيذ

### المرحلة 1: قاعدة البيانات

**إنشاء View آمن** يستثني الحقول الداخلية:

```sql
CREATE OR REPLACE VIEW public.invoices_user_view
WITH (security_invoker = on) AS
SELECT
  id,
  user_id,
  invoice_number,
  invoice_type,
  issue_datetime,
  created_at,
  updated_at,
  total_excl_vat,
  total_vat,
  total_incl_vat,
  vat_rate,
  currency,
  buyer_name,
  buyer_email,
  buyer_phone,
  seller_legal_name,
  seller_address,
  payment_status,
  payment_provider,
  pdf_url,
  qr_base64,
  qr_payload,
  notes,
  subscription_id,
  credit_purchase_id,
  original_invoice_id
FROM public.invoices;

-- منح الوصول للمستخدمين المصادق عليهم
GRANT SELECT ON public.invoices_user_view TO authenticated;
```

**ملاحظة**: الـ View يستخدم `security_invoker=on` مما يعني أن سياسات RLS الموجودة على الجدول الأساسي ستُطبق تلقائياً.

---

### المرحلة 2: تحديث الكود

**تعديل `src/hooks/useInvoices.ts`:**

استبدال القراءة من `invoices` إلى `invoices_user_view`:

```typescript
// قبل (غير آمن):
const { data: invoicesData } = await supabase
  .from('invoices')
  .select('*')
  .eq('user_id', user.id);

// بعد (آمن):
const { data: invoicesData } = await supabase
  .from('invoices_user_view')
  .select('*')
  .eq('user_id', user.id);
```

**تحديث واجهة `Invoice`:**

إزالة الحقول الحساسة من التعريف:

```typescript
export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  user_id: string;
  buyer_email: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  seller_legal_name: string;
  seller_address: string | null;
  payment_status: string;
  payment_provider: string | null;
  // ❌ إزالة: payment_txn_id, seller_vat_number, odoo_invoice_id, odoo_invoice_name
  currency: string;
  total_excl_vat: number;
  total_vat: number;
  total_incl_vat: number;
  vat_rate: number;
  qr_base64: string | null;
  qr_payload: string | null;
  pdf_url: string | null;
  notes: string | null;
  issue_datetime: string;
  created_at: string;
  updated_at: string | null;
  subscription_id: string | null;
  credit_purchase_id: string | null;
  original_invoice_id: string | null;
  items?: InvoiceItem[];
}
```

---

### المرحلة 3: تحديث واجهة المستخدم

**تعديل `src/components/settings/InvoiceDetailsDialog.tsx`:**

- إزالة عرض `payment_txn_id` من واجهة التفاصيل
- إزالة عرض `seller_vat_number` (يُعرض فقط في PDF الرسمي)

---

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| Database Migration | إنشاء `invoices_user_view` |
| `src/hooks/useInvoices.ts` | تحديث الاستعلامات + Interface |
| `src/components/settings/InvoiceDetailsDialog.tsx` | إزالة الحقول الحساسة من العرض |

---

## التحقق بعد التنفيذ

1. إعادة فحص الأمان (Security Scan)
2. التأكد من عمل صفحة الفواتير
3. التأكد من أن الحقول الداخلية غير مرئية
4. التأكد من عمل تحميل PDF وإرسال البريد

---

## التفاصيل التقنية

### لماذا View بدلاً من تقييد RLS؟

- RLS تحمي الصفوف لكنها لا تخفي الأعمدة
- View يسمح بتحديد الحقول المسموح بها بدقة
- `security_invoker=on` يضمن تطبيق RLS الموجود
- لا حاجة لتغيير السياسات الحالية

### ماذا عن Edge Functions؟

Edge Functions (مثل `generate-invoice-pdf`) تستخدم `service_role` وبالتالي:
- يمكنها الوصول لكل الحقول
- ستستمر في العمل بشكل طبيعي
- لا تتأثر بهذا التغيير
