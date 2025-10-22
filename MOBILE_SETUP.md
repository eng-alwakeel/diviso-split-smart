# 📱 دليل إعداد تطبيق الموبايل - Diviso Mobile App Setup

## ✅ تم الإعداد بنجاح!

تم تثبيت وإعداد جميع المكونات المطلوبة لتطبيق الموبايل:

### 🎉 ما تم تنفيذه:

#### 1. **Capacitor Plugins المثبتة:**
- ✅ `@capacitor/status-bar` - إدارة شريط الحالة
- ✅ `@capacitor/splash-screen` - شاشة البداية
- ✅ `@capacitor/app` - معلومات التطبيق والـ lifecycle
- ✅ `@capacitor/haptics` - ردود الفعل اللمسية
- ✅ `@capacitor/share` - المشاركة الأصلية
- ✅ `@capacitor/push-notifications` - الإشعارات Push
- ✅ `@capacitor/camera` - الكاميرا (موجود مسبقاً)
- ✅ `@capacitor/filesystem` - نظام الملفات (موجود مسبقاً)

#### 2. **الملفات التي تم إنشاؤها/تحديثها:**
- ✅ `capacitor.config.ts` - إعدادات Capacitor مع Deep Links
- ✅ `src/lib/native.ts` - Utilities للميزات الأصلية
- ✅ `src/hooks/useNativeFeatures.ts` - Hook لإدارة الميزات الأصلية
- ✅ `src/hooks/useDeepLinks.ts` - معالجة Deep Links
- ✅ `index.html` - Meta tags للموبايل
- ✅ `src/index.css` - Safe areas للأجهزة
- ✅ `src/App.tsx` - تكامل الـ Hooks
- ✅ `src/components/referral/SocialShareButtons.tsx` - مشاركة أصلية

---

## 📋 الخطوات التالية - للتجربة على جهاز فعلي:

### **المتطلبات:**
- Node.js و npm مثبتين
- Android Studio (للأندرويد) أو Xcode (لـ iOS على Mac فقط)
- حساب GitHub

---

### **خطوة 1: تصدير المشروع إلى GitHub**
1. اضغط على زر **"Export to GitHub"** في Lovable
2. اختر أو أنشئ repository جديد
3. انتظر حتى يكتمل التصدير

---

### **خطوة 2: استنساخ المشروع**
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

---

### **خطوة 3: تثبيت Dependencies**
```bash
npm install
```

---

### **خطوة 4: إضافة المنصات**

#### للأندرويد:
```bash
npx cap add android
npx cap update android
```

#### لـ iOS (Mac فقط):
```bash
npx cap add ios
npx cap update ios
```

---

### **خطوة 5: بناء المشروع**
```bash
npm run build
```

---

### **خطوة 6: Sync التطبيق**
```bash
npx cap sync
```

⚠️ **مهم:** قم بتشغيل `npx cap sync` بعد كل `git pull` لمزامنة التغييرات.

---

### **خطوة 7: تشغيل التطبيق**

#### على الأندرويد:
```bash
npx cap run android
```

#### على iOS (Mac فقط):
```bash
npx cap run ios
```

---

## 🔧 إعدادات التطوير vs الإنتاج

### **للتطوير (Hot Reload):**
في `capacitor.config.ts`، قم بإلغاء التعليق على هذا السطر:
```typescript
url: 'https://3776a414-f124-4f36-83bd-711dd8d56f9a.lovableproject.com?forceHideBadge=true',
```

هذا يسمح بالـ Hot Reload المباشر من Lovable Sandbox!

### **للإنتاج:**
احتفظ بالـ `url` معلق عليه (كما هو الآن):
```typescript
// url: 'https://3776a414-f124-4f36-83bd-711dd8d56f9a.lovableproject.com?forceHideBadge=true',
```

---

## 🎨 ميزات التطبيق الأصلي المفعّلة:

### **1. Status Bar (شريط الحالة):**
- يتغير تلقائياً مع Dark/Light Mode
- مخصص بلون التطبيق (#1A1C1E)

### **2. Native Sharing (المشاركة الأصلية):**
- يستخدم نافذة المشاركة الأصلية للنظام
- يعمل تلقائياً في `SocialShareButtons`

### **3. Camera & Gallery:**
- وظائف `takePhoto()` و `pickImage()` جاهزة
- تستخدم في مسح الفواتير (OCR)

### **4. Haptic Feedback:**
- ردود فعل لمسية للتفاعلات المهمة
- 3 أنواع: `light`, `medium`, `heavy`

### **5. Deep Links:**
- `diviso://invite/CODE` → `/i/CODE`
- `https://diviso.app/i/CODE` → `/i/CODE`
- `diviso://referral` → `/referral`
- يعمل تلقائياً عند فتح روابط خارجية

### **6. Android Back Button:**
- معالجة ذكية لزر الرجوع
- تأكيد الخروج في الصفحة الرئيسية

### **7. Safe Areas:**
- دعم كامل للأجهزة ذات النوتش (iPhone X+)
- تلقائي للـ Bottom Nav والمحتوى

---

## 📱 الأيقونات والـ Splash Screens:

### **المطلوب إضافته:**

#### للأندرويد:
ضع الأيقونات في:
```
android/app/src/main/res/
├── mipmap-hdpi/ic_launcher.png (72x72)
├── mipmap-mdpi/ic_launcher.png (48x48)
├── mipmap-xhdpi/ic_launcher.png (96x96)
├── mipmap-xxhdpi/ic_launcher.png (144x144)
└── mipmap-xxxhdpi/ic_launcher.png (192x192)
```

#### لـ iOS:
ضع الأيقونات في:
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
```

يمكنك استخدام أدوات مثل:
- [Icon Kitchen](https://icon.kitchen/)
- [App Icon Generator](https://www.appicon.co/)

---

## 🚀 نشر التطبيق:

### **Google Play Store (Android):**
1. قم ببناء APK موقّع:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
2. اتبع [دليل Google Play](https://support.google.com/googleplay/android-developer/answer/9859152)

### **Apple App Store (iOS):**
1. افتح المشروع في Xcode
2. اتبع [دليل App Store](https://developer.apple.com/app-store/submissions/)

---

## 🐛 استكشاف الأخطاء:

### **مشكلة: التطبيق لا يبني**
```bash
# نظف الـ cache
rm -rf node_modules package-lock.json
npm install
npm run build
npx cap sync
```

### **مشكلة: الـ Plugins لا تعمل**
```bash
# أعد تثبيت الـ platforms
npx cap update android
npx cap update ios
```

### **مشكلة: التغييرات لا تظهر**
```bash
npm run build
npx cap sync
```

---

## 📚 موارد إضافية:

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Android Studio Guide](https://developer.android.com/studio)
- [Xcode Guide](https://developer.apple.com/xcode/)

---

## ✨ نصائح للإنتاج:

1. ✅ قم بتعطيل console.log في الإنتاج
2. ✅ اضبط أيقونات وsplash screens مخصصة
3. ✅ اختبر على أجهزة مختلفة (Android & iOS)
4. ✅ فعّل Push Notifications (تحتاج Firebase)
5. ✅ اضبط App Signing للنشر
6. ✅ راجع Privacy Policy وTerms of Service

---

## 🎯 الميزات المتقدمة القادمة:

- [ ] Push Notifications (Firebase)
- [ ] In-App Purchases (RevenueCat مفعّل)
- [ ] Biometric Authentication
- [ ] Background Sync
- [ ] Offline Mode Enhancement

---

**تهانينا! 🎉** تطبيقك جاهز للتطوير والاختبار على الأجهزة الفعلية!

إذا واجهت أي مشكلة، راجع [Capacitor Troubleshooting](https://capacitorjs.com/docs/getting-started/troubleshooting) أو اسألني!