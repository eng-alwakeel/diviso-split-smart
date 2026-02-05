
# خطة تفعيل Google AdSense Offerwall عند الضغط على "شاهد إعلان"

## ملخص المشكلة

عند ضغط المستخدم على زر "شاهد إعلان" في `ZeroCreditsPaywall`، النظام الحالي يستخدم محاكاة (`setTimeout` لـ 3 ثواني) بدلاً من عرض إعلان فعلي من Google AdSense Offerwall.

## الحالة الحالية

| المكون | الحالة |
|--------|--------|
| Google AdSense Script | ✅ مُحمّل في `index.html` |
| Publisher ID | ✅ `ca-pub-4156962854639409` |
| Offerwall Message | ✅ منشور في AdSense Console (Main - Arabic) |
| `ZeroCreditsPaywall.tsx` | ⚠️ يستخدم محاكاة `setTimeout` |
| `useRewardedAds.ts` | ✅ جاهز لإدارة الجلسات |

---

## الحل: استخدام Google Offerwall API

### كيف يعمل Google AdSense Offerwall:

1. **لا يوجد دالة `showOfferwall()` مباشرة** - Google يعرض الـ Offerwall تلقائياً بناءً على إعدادات Console
2. **طريقة التفعيل**: إعادة تحميل الصفحة مع parameters خاصة أو استخدام `controlledMessagingFunction`
3. **Custom Choice API**: للربط مع نظام النقاط الداخلي

---

## الخطوات التقنية

### 1. إنشاء خدمة AdSense Offerwall

ملف جديد: `src/lib/adsenseOfferwall.ts`

```text
الوظائف:
├── triggerOfferwall() - فتح Offerwall
├── initControlledMessaging() - التحكم بعرض الرسائل
├── registerCustomChoice() - ربط مع نظام النقاط
└── checkOfferwallStatus() - التحقق من حالة العرض
```

**المحتوى:**
- تعريف TypeScript types لـ `window.googlefc`
- دالة `triggerOfferwall()` تفتح نافذة/iframe مع parameter `?fc=alwaysshow&fctype=monetization`
- دالة `registerCustomChoice()` تربط زر الإعلان بنظام `claimRewardAsToken`

### 2. تعديل `ZeroCreditsPaywall.tsx`

استبدال المحاكاة الحالية:

```text
// الحالي (سطور 100-131)
setTimeout(async () => {
  // محاكاة...
}, 3000);

// الجديد
import { triggerOfferwall, waitForOfferwallComplete } from '@/lib/adsenseOfferwall';

const completed = await triggerOfferwall();
if (completed) {
  const result = await claimRewardAsToken(session.sessionId, actionName);
  // ... باقي المنطق
}
```

### 3. إضافة TypeScript Types

ملف: `src/types/googlefc.d.ts`

```text
interface Window {
  googlefc?: {
    MessageTypeEnum?: {
      OFFERWALL: string;
      GDPR_CONSENT: string;
    };
    controlledMessagingFunction?: (message: GoogleFcMessage) => Promise<void>;
    offerwall?: {
      customchoice?: {
        registry?: CustomOfferwallChoice;
        InitializeResponseEnum?: {...};
      };
    };
  };
}
```

### 4. تسجيل Custom Choice (متقدم)

لربط "شاهد إعلان" مع Offerwall بشكل كامل:

```text
class DivisoOfferwallChoice {
  async initialize(params) {
    // تحقق إذا المستخدم لديه رصيد
    const hasCredits = await checkUserCredits();
    return hasCredits 
      ? ACCESS_GRANTED 
      : ACCESS_NOT_GRANTED;
  }
  
  async show() {
    // عرض الإعلان ومنح النقاط
    const session = await createSession(...);
    // انتظار مشاهدة الإعلان
    const success = await waitForRewardedAd();
    if (success) {
      await claimRewardAsToken(session.sessionId);
    }
    return success;
  }
}
```

---

## الملفات المتأثرة

| الملف | النوع | التغيير |
|-------|-------|---------|
| `src/lib/adsenseOfferwall.ts` | جديد | خدمة التحكم بالـ Offerwall |
| `src/types/googlefc.d.ts` | جديد | TypeScript types لـ Google FC |
| `src/components/credits/ZeroCreditsPaywall.tsx` | تعديل | استدعاء Offerwall بدل المحاكاة |
| `index.html` | تعديل | إضافة `controlledMessagingFunction` |

---

## التفاصيل التقنية

### محتوى `src/lib/adsenseOfferwall.ts`:

```typescript
// Types for Google Funding Choices
declare global {
  interface Window {
    googlefc?: GoogleFC;
  }
}

interface GoogleFC {
  controlledMessagingFunction?: (message: GoogleFCMessage) => void;
  callbackQueue?: Array<() => void>;
  MessageTypeEnum?: {
    OFFERWALL: number;
  };
}

// Trigger offerwall by opening monetization page
export async function triggerOfferwall(): Promise<boolean> {
  return new Promise((resolve) => {
    // Open offerwall in current page with monetization trigger
    const offerwallUrl = `${window.location.origin}/?fc=alwaysshow&fctype=monetization`;
    
    // Create hidden iframe or use popup
    const iframe = document.createElement('iframe');
    iframe.src = offerwallUrl;
    iframe.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 99999;
      border: none;
      background: rgba(0,0,0,0.8);
    `;
    
    // Listen for completion message
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'offerwall_complete') {
        document.body.removeChild(iframe);
        window.removeEventListener('message', handleMessage);
        resolve(event.data.success);
      }
    };
    
    window.addEventListener('message', handleMessage);
    document.body.appendChild(iframe);
    
    // Timeout fallback
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
        window.removeEventListener('message', handleMessage);
        resolve(false);
      }
    }, 60000); // 1 minute timeout
  });
}

// Initialize controlled messaging for subscribers
export function initControlledMessaging(isPaidUser: boolean): void {
  window.googlefc = window.googlefc || {};
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
  
  window.googlefc.callbackQueue.push(() => {
    window.googlefc!.controlledMessagingFunction = (message) => {
      if (isPaidUser) {
        // Suppress offerwall for paid users
        message.proceed(false);
      } else {
        message.proceed(true);
      }
    };
  });
}
```

### تعديل `ZeroCreditsPaywall.tsx` - دالة `handleWatchAd`:

```typescript
const handleWatchAd = async () => {
  if (!actionName || isWatchingAd) return;
  
  setIsWatchingAd(true);
  
  try {
    await logRewardedStart(AD_PLACEMENTS.PAYWALL_REWARDED);
    
    const session = await createSession(actionName, requiredCredits);
    if (!session) {
      toast.error(isRTL ? 'غير مؤهل لمشاهدة الإعلان' : 'Not eligible');
      setIsWatchingAd(false);
      return;
    }

    toast.info(isRTL ? 'جاري فتح الإعلان...' : 'Opening ad...');
    
    // Trigger real AdSense Offerwall
    const { triggerOfferwall } = await import('@/lib/adsenseOfferwall');
    const completed = await triggerOfferwall();
    
    if (completed) {
      await logRewardedComplete(AD_PLACEMENTS.PAYWALL_REWARDED, 1);
      
      const result = await claimRewardAsToken(session.sessionId, actionName);
      
      if (result.success) {
        await logRewardedClaim(AD_PLACEMENTS.PAYWALL_REWARDED, 1);
        toast.success(
          isRTL 
            ? `تم! يمكنك تنفيذ عملية واحدة خلال ${result.expiresInMinutes} دقيقة` 
            : `Done! One action unlocked for ${result.expiresInMinutes} minutes`
        );
        setTimeout(() => onOpenChange(false), 1000);
      } else {
        toast.error(isRTL ? 'فشل في التفعيل' : 'Failed to unlock');
      }
    } else {
      toast.warning(isRTL ? 'لم يكتمل الإعلان' : 'Ad not completed');
      await updateSessionStatus(session.sessionId, 'failed');
    }
    
    setIsWatchingAd(false);
    await checkEligibility(actionName, requiredCredits);
  } catch (error) {
    console.error('Error watching ad:', error);
    toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
    setIsWatchingAd(false);
  }
};
```

---

## ملاحظات مهمة

1. **Google AdSense Offerwall** يعمل تلقائياً عند تحميل الصفحة إذا كان المستخدم غير مشترك
2. **لا يمكن استدعاء Offerwall برمجياً بشكل مباشر** - الحل هو إعادة تحميل الصفحة مع parameters
3. **للربط الكامل**: يجب استخدام Custom Choice API لإضافة خيار "شاهد إعلان" داخل Offerwall نفسه
4. **الاختبار**: استخدم `?fc=alwaysshow` لاختبار ظهور Offerwall

---

## البديل الموصى به: Rewarded Web Interstitial

بما أن AdSense Offerwall مصمم للـ paywalls على المحتوى وليس للـ in-app actions، قد يكون الأفضل:

1. **استخدام Google Publisher Tag (GPT)** لعرض Rewarded Interstitial
2. **أو الاستمرار بـ Paymentwall** الذي يدعم rewarded ads بشكل أفضل للتطبيقات

---

## خطوات التنفيذ

1. ✅ إنشاء `src/lib/adsenseOfferwall.ts`
2. ✅ إضافة TypeScript types
3. ✅ تعديل `ZeroCreditsPaywall.tsx`
4. ✅ إضافة controlled messaging في `index.html`
5. 🔲 اختبار على الموقع المنشور

