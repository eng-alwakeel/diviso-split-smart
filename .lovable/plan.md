

# تحسين دردشة المجموعة لتصبح احترافية (Telegram/WhatsApp style)

## التغييرات المطلوبة

### 1. MessageBubble.tsx — إعادة كتابة شبه كاملة

**المشاكل الحالية:**
- كل MessageBubble تستدعي `supabase.auth.getSession()` + query للـ subscription = أداء سيء جداً
- لا يوجد دعم للرسائل المتتالية (consecutive messages grouping)
- لا يوجد دعم لرسائل النظام (system messages)

**التعديلات:**
- تمرير `currentUserId` كـ prop بدل استدعاء getSession في كل رسالة
- إضافة props: `showSenderInfo: boolean` (يتحكم فيها GroupChat)
- Avatar بحجم 36px (w-9 h-9) مع إخفاءه عند الرسائل المتتالية (invisible placeholder للحفاظ على المحاذاة)
- اسم المرسل بـ `text-[12px] font-medium`
- الوقت بـ `text-[11px]` ولون خافت
- رسائل المستخدم الحالي: بدون اسم/صورة، محاذاة يمين، لون `bg-primary`
- فقاعات بـ `rounded-2xl` مع tail effect (rounded corners مختلفة للطرف)

### 2. GroupChat.tsx — تحسين الأداء + التجميع

**التعديلات:**
- حساب `showSenderInfo` لكل رسالة: إذا الرسالة السابقة من نفس المرسل وخلال 5 دقائق → `false`
- تمرير `currentUserId` لـ MessageBubble بدل ما كل واحدة تجيبه
- Smart scroll: يتتبع هل المستخدم في الأسفل قبل إضافة رسالة جديدة، يعمل auto-scroll فقط إذا كان في الأسفل
- رسائل النظام (system): تُعرض كنص في المنتصف بخلفية رمادية خفيفة بدون فقاعة
- استخدام `React.memo` على MessageBubble

### 3. SystemMessage component — مكون جديد بسيط

رسالة وسط الشاشة بـ:
- `text-center text-[11px] text-muted-foreground`
- `bg-muted/50 rounded-full px-3 py-1 mx-auto w-fit`

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `src/components/chat/MessageBubble.tsx` | إعادة كتابة: إزالة getSession، إضافة props جديدة، تحسين التصميم |
| `src/components/group/GroupChat.tsx` | إضافة consecutive grouping logic، smart scroll، تمرير currentUserId |
| `src/components/chat/SystemMessage.tsx` | مكون جديد لرسائل النظام |

