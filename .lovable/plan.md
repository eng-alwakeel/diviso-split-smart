

# إصلاح عدم ظهور التسويات في الدردشة

## المشكلة
عند إنشاء تسوية، يتم إدراج رسائل الإعلان مباشرة في جدول `messages` عبر `supabase.from("messages").insert(...)`. لكن الدردشة تعتمد فقط على **broadcast events** لاستقبال الرسائل الجديدة — ولا يوجد مستمع لتغييرات قاعدة البيانات (Postgres Realtime). لذلك رسائل التسوية لا تظهر حتى يتم تحديث الصفحة.

أيضاً: `onCreated` يستدعي `refetch()` الذي يعيد تحميل بيانات المجموعة (أرصدة، مصاريف) لكن **لا يعيد تحميل رسائل الدردشة**.

## الحل

### 1. إضافة Postgres Realtime listener في `useChatBroadcast.ts`
إضافة مستمع `postgres_changes` على جدول `messages` مفلتر بـ `group_id`، بحيث أي رسالة تُدرج في قاعدة البيانات (سواء من التسوية أو الأرصدة السابقة أو أي مصدر آخر) تظهر تلقائياً في الدردشة.

```
channel.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'messages',
  filter: `group_id=eq.${groupId}`
}, (payload) => {
  // Add to messages if not already present (dedup by id)
})
```

### 2. تفعيل Realtime على جدول `messages` (migration)
التأكد أن جدول `messages` مُفعّل عليه Realtime في Supabase حتى يعمل المستمع.

## الملفات المتأثرة
| الملف | التغيير |
|-------|---------|
| `src/hooks/useChatBroadcast.ts` | إضافة postgres_changes listener للـ INSERT |
| migration جديد | تفعيل realtime على جدول messages |

