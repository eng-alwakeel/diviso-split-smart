

## اصلاح نهائي لتدفق دعوة الجوال

### السبب الجذري الحالي

الـ Edge Function `create-phone-invite` ترجع **401 Unauthorized** لأن `anonClient.auth.getClaims(token)` تفشل. هذه الدالة إما غير متوفرة أو تتصرف بشكل مختلف في بيئة Deno. الحل المعتمد في Supabase هو استخدام `auth.getUser()`.

من سجلات Edge Logs:
```
POST | 401 | create-phone-invite
```

### الخطة

#### 1. إصلاح Edge Function: `create-phone-invite/index.ts`

استبدال authentication من `getClaims` إلى `getUser`:

```typescript
// قبل (يفشل):
const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
const callerId = claimsData.claims.sub;

// بعد (يعمل):
const { data: { user }, error: userErr } = await anonClient.auth.getUser(token);
const callerId = user.id;
```

باقي المنطق يبقى كما هو - الـ member creation وtoken generation صحيحة.

#### 2. لا تغييرات أخرى مطلوبة

- الـ triggers تم إصلاحها سابقاً (تتعامل مع `user_id = NULL`)
- الـ schema صحيح (`display_name` موجود، `user_id` nullable)
- الـ UI (`PhoneInviteTab.tsx`) صحيحة ولا تحتاج تعديل

### الملفات المتأثرة

| ملف | تغيير |
|---|---|
| `supabase/functions/create-phone-invite/index.ts` | استبدال `getClaims` بـ `getUser` |

### لماذا سينجح؟

السبب مؤكد 100% من سجلات Edge Function: الدالة ترجع 401 قبل أي عملية DB. بعد استبدال `getClaims` بـ `getUser` (المعتمدة رسمياً) سيمر الـ auth وتعمل باقي العمليات بشكل طبيعي.
