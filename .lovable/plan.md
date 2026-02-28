

## اصلاح خطأ "admin_required" في إنشاء رابط الدعوة

### المشكلة المؤكدة من السجلات

```
Token creation error: { code: "28000", message: "admin_required" }
```

الدالة `create_group_join_token` (RPC) تستخدم `auth.uid()` داخلياً:
1. `is_group_admin(p_group_id)` تعتمد على `auth.uid()` -- ترجع NULL مع service role client
2. `created_by` default هو `auth.uid()` -- أيضاً NULL

لذلك حتى لو الـ Edge Function تحققت من الصلاحيات بنفسها، الـ RPC يفشل لأنه لا يعرف من المستخدم.

### الحل

تعديل Edge Function `create-phone-invite/index.ts` فقط:

**استبدال** استدعاء `svc.rpc("create_group_join_token", ...)` بإدراج مباشر في جدول `group_join_tokens`:

```typescript
// بدلاً من:
const { data: tokenData } = await svc.rpc("create_group_join_token", { ... });

// نستخدم:
const { data: tokenRow } = await svc
  .from("group_join_tokens")
  .insert({
    group_id: groupId,
    role: "member",
    link_type: "phone_invite",
    created_by: callerId,  // نمرر callerId بشكل صريح
    max_uses: -1,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })
  .select("token")
  .single();
```

هذا يعمل لأن service role client يتجاوز RLS، ونحن فعلاً تحققنا من صلاحيات المستخدم (admin/owner) في سطر 72-83 من الـ Edge Function.

### التعديلات بالتحديد

**ملف واحد**: `supabase/functions/create-phone-invite/index.ts`

1. تمرير `callerId` كمعامل إضافي لدالة `getOrCreateInviteUrl`
2. استبدال `svc.rpc(...)` بـ `svc.from("group_join_tokens").insert(...)` مع `created_by: callerId`
3. تعديل مدة الصلاحية إلى 30 يوم بدل يوم واحد

### لماذا سينجح؟

- السبب الجذري مؤكد 100%: `auth.uid() = NULL` داخل الـ RPC عند استخدام service role
- الإدراج المباشر يتجاوز هذا القيد
- التحقق من الصلاحيات (admin/owner) يتم بالفعل في الـ Edge Function نفسها
- لا تغييرات على الـ schema أو الـ triggers أو الواجهة
