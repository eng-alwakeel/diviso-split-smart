
# خطة: توحيد صيغة عداد برنامج المستخدمين المؤسسين

## المطلوب

توحيد عرض العداد في جميع الأماكن بالصيغة:
```
⏳ متبقي {{remaining}} من 1000 مقعد
```

- **لا يتم** عرض عدد المستخدمين المنضمين
- **يتم** عرض المقاعد المتبقية فقط
- **يختفي** العداد عند `remaining = 0`

---

## الأماكن التي تحتاج تعديل

| # | الملف | الموقع | الحالة الحالية | التعديل |
|---|-------|--------|----------------|---------|
| 1 | `FoundingProgramBanner.tsx` | صفحة التسجيل | `🔥 متبقي X من 1000 مقعد` (Flame icon) | تغيير إلى `⏳ متبقي X من 1000 مقعد` |
| 2 | `HeroSection.tsx` | الصفحة الرئيسية | `⭐` + نص | تغيير إلى `⏳ متبقي X من 1000 مقعد` |
| 3 | `LaunchPage.tsx` | صفحة Launch | نص مباشر | تغيير إلى `⏳ متبقي X من 1000 مقعد` |
| 4 | `DemoExperience.tsx` | صفحة التجربة | نص مباشر | تغيير إلى `⏳ متبقي X من 1000 مقعد` |
| 5 | `StickySignupBar.tsx` | شريط CTA | نص مباشر | تغيير إلى `⏳ متبقي X من 1000 مقعد` |
| 6 | `ar/auth.json` | الترجمة العربية | `spots_remaining` | تحديث الصيغة |
| 7 | `en/auth.json` | الترجمة الإنجليزية | `spots_remaining` | تحديث الصيغة |

---

## التغييرات التفصيلية

### 1. تحديث الترجمات

**`src/i18n/locales/ar/auth.json`**
```json
"spots_remaining": "⏳ متبقي {{remaining}} من 1000 مقعد"
```

**`src/i18n/locales/en/auth.json`**
```json
"spots_remaining": "⏳ {{remaining}} of 1000 spots remaining"
```

---

### 2. `FoundingProgramBanner.tsx` (سطر 42-49)

**من:**
```tsx
<div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
  <Flame className="h-4 w-4" />
  {isLoading ? (
    <span className="animate-pulse">...</span>
  ) : (
    <span>{t('founding_program.remaining', { remaining, limit })}</span>
  )}
</div>
```

**إلى:**
```tsx
<div className="text-sm font-medium text-amber-600 dark:text-amber-400">
  {isLoading ? (
    <span className="animate-pulse">⏳ ...</span>
  ) : (
    <span>{t('founding_program.spots_remaining', { remaining })}</span>
  )}
</div>
```

---

### 3. `HeroSection.tsx` (سطر 82-86)

**من:**
```tsx
<p className="text-xs text-amber-200/80 mt-1 text-center lg:text-start">
  {isRTL 
    ? `متبقي ${remaining} من 1000 مقعد`
    : `${remaining} of 1000 spots remaining`
  }
</p>
```

**إلى:**
```tsx
<p className="text-xs text-amber-200/80 mt-1 text-center lg:text-start">
  {isRTL 
    ? `⏳ متبقي ${remaining} من 1000 مقعد`
    : `⏳ ${remaining} of 1000 spots remaining`
  }
</p>
```

---

### 4. `LaunchPage.tsx` (سطر 296)

**من:**
```tsx
متبقي {remaining} من 1000 مقعد
```

**إلى:**
```tsx
⏳ متبقي {remaining} من 1000 مقعد
```

---

### 5. `DemoExperience.tsx` (سطر 191)

**من:**
```tsx
متبقي {remaining} من 1000 مقعد
```

**إلى:**
```tsx
⏳ متبقي {remaining} من 1000 مقعد
```

---

### 6. `StickySignupBar.tsx` (سطر 32)

**من:**
```tsx
`متبقي ${remaining} من 1000 مقعد`
```

**إلى:**
```tsx
`⏳ متبقي ${remaining} من 1000 مقعد`
```

---

## ملخص الملفات المعدلة

| الملف | نوع التعديل |
|-------|-------------|
| `src/i18n/locales/ar/auth.json` | تحديث صيغة الترجمة |
| `src/i18n/locales/en/auth.json` | تحديث صيغة الترجمة |
| `src/components/auth/FoundingProgramBanner.tsx` | إزالة أيقونة Flame، استخدام الترجمة الموحدة |
| `src/components/HeroSection.tsx` | إضافة ⏳ |
| `src/pages/LaunchPage.tsx` | إضافة ⏳ |
| `src/components/launch/DemoExperience.tsx` | إضافة ⏳ |
| `src/components/launch/StickySignupBar.tsx` | إضافة ⏳ |

---

## الصيغة النهائية الموحدة

| اللغة | الصيغة |
|-------|--------|
| العربية | `⏳ متبقي 945 من 1000 مقعد` |
| الإنجليزية | `⏳ 945 of 1000 spots remaining` |

---

## معايير القبول

| # | المعيار |
|---|---------|
| 1 | جميع الأماكن تستخدم الصيغة الموحدة مع ⏳ |
| 2 | لا يتم عرض عدد المنضمين (total) |
| 3 | يتم عرض المتبقي (remaining) فقط |
| 4 | العداد يختفي عند remaining = 0 (isClosed) |
| 5 | الصيغة متناسقة بين العربية والإنجليزية |
