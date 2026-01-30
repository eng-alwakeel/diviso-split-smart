
# خطة إزالة خانة كود الإحالة من صفحة إنشاء الحساب

## السبب
تم تغيير نظام المكافآت من "7 أيام مجانية عند إدخال كود إحالة" إلى "50 نقطة ترحيبية لكل مستخدم جديد"، لذلك لم تعد هناك حاجة لخانة إدخال كود الإحالة في نموذج التسجيل.

---

## التغييرات المطلوبة

### 1. تحديث `src/pages/Auth.tsx`

**إزالة الـ State Variables:**
```typescript
// إزالة هذه المتغيرات (الأسطر 51-53)
const [referralCode, setReferralCode] = useState("");
const [referralValid, setReferralValid] = useState<boolean | null>(null);
const [checkingReferral, setCheckingReferral] = useState(false);
```

**إزالة دالة التحقق من الكود:**
```typescript
// إزالة validateReferralCode (الأسطر 79-100)
// إزالة useEffect للتحقق (الأسطر 103-113)
```

**إزالة منطق معالجة الإحالة في handleSignup:**
```typescript
// إزالة الأسطر 342-363 (معالجة referralCode)
```

**إزالة واجهة المستخدم (UI) لخانة الإحالة:**
```typescript
// إزالة الأسطر 1006-1046 (Referral Code Input section)
```

**إزالة الـ Imports غير المستخدمة:**
```typescript
// إزالة Gift, Check, X من lucide-react إذا لم تُستخدم في مكان آخر
```

---

### 2. ملفات الترجمة (اختياري - للتنظيف)

**`src/i18n/locales/ar/auth.json`:**
- إزالة `fields.referral_code`
- إزالة `fields.referral_placeholder`
- إزالة `messages.referral_valid`
- إزالة `messages.referral_invalid`
- إزالة `toast.verify_email_referral`
- إزالة `toast.otp_sent_referral`

**`src/i18n/locales/en/auth.json`:**
- نفس الحقول المذكورة أعلاه

---

## ملاحظات مهمة

| النقطة | التفصيل |
|--------|---------|
| صفحة `ReferralSignup.tsx` | تبقى كما هي - للمستخدمين القادمين عبر روابط الإحالة |
| نظام الإحالة | يستمر بالعمل عبر الروابط فقط (بدون إدخال يدوي للكود) |
| نظام النقاط الترحيبية | يُفترض أنه مُفعّل من جهة Backend |

---

## ملخص الملفات

| الملف | نوع التغيير |
|-------|------------|
| `src/pages/Auth.tsx` | إزالة كود الإحالة (state, logic, UI) |
| `src/i18n/locales/ar/auth.json` | تنظيف الترجمات غير المستخدمة |
| `src/i18n/locales/en/auth.json` | تنظيف الترجمات غير المستخدمة |

---

## النتيجة المتوقعة

بعد التنفيذ، صفحة إنشاء الحساب ستظهر بدون خانة "كود الإحالة (اختياري)" - المستخدمون الجدد سيحصلون على 50 نقطة ترحيبية تلقائياً بدلاً من نظام الأيام المجانية.
