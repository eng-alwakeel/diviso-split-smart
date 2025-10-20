# ✅ قائمة الفحص قبل أي Commit

## عند إضافة Tooltips:
- [ ] استخدمت `@/components/ui/safe-tooltip` وليس `@/components/ui/tooltip`
- [ ] لم أضف `TooltipProvider` في أي مكون (موجود فقط في `App.tsx`)
- [ ] اختبرت المكون في المتصفح
- [ ] لا توجد أخطاء في Console
- [ ] لا يوجد خطأ `Cannot read properties of null (reading 'useState')`

## عند إضافة React Queries:
- [ ] استخدمت `staleTime` مناسب (5 دقائق للبيانات الثابتة)
- [ ] استخدمت `React.memo` للمكونات الثقيلة
- [ ] اختبرت عدد Re-renders (استخدم React DevTools)
- [ ] لا توجد استعلامات متكررة غير ضرورية

## عند إضافة مكونات جديدة:
- [ ] المكون صغير ومحدد الوظيفة (Single Responsibility)
- [ ] استخدمت TypeScript interfaces للـ props
- [ ] استخدمت semantic tokens من `index.css` للألوان
- [ ] المكون responsive على الموبايل والديسكتوب

## عند تعديل Database Queries:
- [ ] استخدمت indexes مناسبة
- [ ] استخدمت `select()` لتحديد الحقول المطلوبة فقط
- [ ] تجنبت N+1 queries (استخدم JOINs)
- [ ] اختبرت الأداء مع بيانات كثيرة

## قبل Push:
- [ ] اختبرت Dashboard - يحمل بأقل من 2 ثانية
- [ ] لا توجد شاشة بيضاء (white screen)
- [ ] لا أخطاء في Console
- [ ] اختبرت على Chrome و Safari/Firefox
- [ ] اختبرت على Mobile viewport
- [ ] لا توجد toast notifications متكررة

## Performance Checklist:
- [ ] Images محسنة (WebP، lazy loading)
- [ ] لا توجد console.log كثيرة في production
- [ ] Bundle size معقول (<500KB للـ main chunk)
- [ ] First Contentful Paint < 1.5 ثانية

## Security Checklist:
- [ ] لا توجد API keys في الكود
- [ ] استخدمت environment variables للـ secrets
- [ ] Row Level Security (RLS) مفعل للجداول الجديدة
- [ ] لا توجد SQL injection vulnerabilities

## Documentation:
- [ ] أضفت تعليقات للكود المعقد
- [ ] حدّثت README.md إذا لزم الأمر
- [ ] أضفت JSDoc للدوال المهمة

---

## 🔗 روابط مفيدة

- [دليل Tooltips](./TOOLTIP_GUIDE.md)
- [تحسين الأداء](./src/utils/performanceOptimizations.ts)
- [React Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/important-defaults)

---

## 💡 نصائح

### عند حدوث خطأ بعد Commit:
1. لا تعمل `revert` كامل - اعمل revert للملف المحدد فقط
2. استخدم Git History لمقارنة التغييرات
3. راجع Console logs للأخطاء
4. استخدم React DevTools Profiler لمشاكل الأداء

### عند البطء في التطبيق:
1. افتح React DevTools → Profiler
2. سجل الـ interaction البطيء
3. ابحث عن المكونات التي تعمل re-render كثير
4. استخدم `React.memo` و `useMemo` و `useCallback`

### عند مشاكل في Database:
1. افتح Supabase Dashboard → Database → Query Performance
2. تحقق من Indexes
3. تحقق من عدد الـ queries (يجب أن تكون قليلة)
4. استخدم `explain analyze` لفهم الاستعلام
