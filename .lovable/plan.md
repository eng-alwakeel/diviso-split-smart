

# مشكلة: التطبيق مثبّت لكن المهمة ما تتكمّل

## التحليل

بعد فحص الكود، المشكلة لها سببين:

1. **الأخطاء مخفية**: دالة `complete_onboarding_task` تُستدعى داخل `try/catch {}` فارغ — إذا فشل الـ RPC (مثلاً بسبب مشكلة الـ function overloading السابقة أو عدم جاهزية الـ session)، ما نعرف.

2. **التوقيت**: الـ `usePwaInstall` hook يشتغل داخل `PwaInstallPrompt` → `InstallWidget`. لما `getIsStandalone()` ترجع `true`، يستدعي الـ RPC **لكن** ممكن الـ auth session ما تكون جاهزة بعد (المستخدم لسه يحمّل الصفحة).

3. **مافي retry**: إذا فشل الاستدعاء الأول، ما يحاول مرة ثانية.

## الحل

### 1. نقل منطق إكمال مهمة التثبيت إلى `Dashboard.tsx`
- بدل الاعتماد على hook داخل component قد ما يظهر، نضيف `useEffect` في Dashboard يتحقق من standalone mode ويكمل المهمة
- Dashboard هو أول شيء يفتحه المستخدم بعد تسجيل الدخول، والـ auth session مضمونة تكون جاهزة

### 2. إضافة console.error في `usePwaInstall.ts`
- استبدال `catch {}` الفارغ بـ `catch (e) { console.error('install_app task error:', e) }` للتشخيص

### 3. إضافة fallback في Dashboard
```typescript
// في Dashboard.tsx
useEffect(() => {
  const checkStandaloneAndComplete = async () => {
    const isStandalone = 
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    
    if (!isStandalone) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.rpc('complete_onboarding_task', {
      p_task_name: 'install_app',
      p_user_id: user.id,
    });
  };
  checkStandaloneAndComplete();
}, []);
```

### الملفات المتأثرة
- `src/pages/Dashboard.tsx` — إضافة useEffect لإكمال المهمة
- `src/hooks/usePwaInstall.ts` — إضافة console.error بدل catch فارغ

