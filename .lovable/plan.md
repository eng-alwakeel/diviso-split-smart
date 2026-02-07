
# إضافة رابط "تثبيت Diviso على الجوال" في الفوتر

## التغيير
إضافة رابط واحد جديد في قسم "روابط مفيدة" بالفوتر، بنفس ستايل الروابط الحالية، يوجه لصفحة `/install` الموجودة.

## الملفات المطلوب تعديلها

### 1. `src/i18n/locales/ar/landing.json`
إضافة مفتاح ترجمة جديد:
```
"installApp": "تثبيت Diviso على الجوال"
```

### 2. `src/i18n/locales/en/landing.json`
إضافة مفتاح ترجمة جديد:
```
"installApp": "Install Diviso on Mobile"
```

### 3. `src/components/Footer.tsx`
- استيراد أيقونة `Smartphone` من `lucide-react`
- إضافة رابط جديد بعد "كيف يعمل التطبيق" مباشرة (ثاني رابط في القائمة):

```tsx
<Link to="/install" className="flex items-center gap-2 hover:text-foreground transition-colors text-sm">
  <Smartphone className="w-4 h-4" />
  {t('footer.installApp')}
</Link>
```

الرابط يستخدم `Link` من React Router (مثل باقي الروابط)، مع أيقونة هاتف صغيرة من `lucide-react` لتمييزه بشكل بسيط.

---

## ملاحظات
- صفحة `/install` موجودة بالفعل ومربوطة في `App.tsx`
- لا حاجة لإنشاء أي ملف جديد
- التغيير بسيط: 3 ملفات فقط (ترجمتين + الفوتر)
