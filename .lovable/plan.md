
# خطة إصلاح عرض الرقم التسلسلي في الداشبورد

## المشكلة
الشارة لا تظهر في الداشبورد بالرغم من وجود الكود الصحيح. السبب هو أن جلب `userId` يتم بشكل async وقد لا يكتمل قبل render الأول، أو أن الـ query لا يُحدّث بشكل صحيح.

## الحل المقترح
تحسين طريقة جلب `userId` في الداشبورد باستخدام `getSession` بدلاً من `getUser` لأنه:
1. أسرع (يستخدم cache محلي)
2. لا يحتاج استدعاء الخادم في كل مرة
3. متوفر فوراً إذا كان المستخدم مسجل الدخول

## التغييرات المطلوبة

### الملف: `src/pages/OptimizedDashboard.tsx`

**التغيير:**
استبدال:
```typescript
const { data: userId } = useQuery({
  queryKey: ['current-user-for-dashboard'],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  },
  staleTime: 5 * 60 * 1000,
});
```

بـ:
```typescript
const { data: userId } = useQuery({
  queryKey: ['current-user-id'],
  queryFn: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  },
  staleTime: Infinity, // User ID doesn't change during session
  gcTime: Infinity,
});
```

**السبب:**
- `getSession()` يستخدم الـ session المخزن محلياً ولا يستدعي الخادم
- `staleTime: Infinity` يمنع إعادة الجلب لأن ID المستخدم لا يتغير خلال الجلسة

## التفاصيل التقنية

| الخاصية | getUser() | getSession() |
|---------|-----------|--------------|
| سرعة | بطيء (يستدعي الخادم) | سريع (cache محلي) |
| موثوقية | أحدث بيانات | بيانات الجلسة |
| الاستخدام | تحديث البيانات | جلب ID سريع |

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `src/pages/OptimizedDashboard.tsx` | تحديث query لاستخدام getSession |
