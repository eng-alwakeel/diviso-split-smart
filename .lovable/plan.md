

# إزالة رسالة "وضع التطوير" من نافذة تأكيد رقم الجوال

## التغيير

إزالة البانر الأزرق الذي يعرض رسالة "وضع التطوير: استخدم الرمز 123456 للتحقق" من مكون `PhoneVerificationDialog`.

## الملف المطلوب تعديله

### `src/components/settings/PhoneVerificationDialog.tsx`

حذف كتلة الـ `div` التالية (الأسطر 80-85 تقريباً):

```tsx
{/* إشعار وضع التطوير */}
<div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-md border border-blue-200 dark:border-blue-800">
  <p className="text-sm text-blue-700 dark:text-blue-300">
    <strong>وضع التطوير:</strong> استخدم الرمز <code ...>123456</code> للتحقق
  </p>
</div>
```

تغيير بسيط -- ملف واحد فقط، حذف 6 أسطر.

