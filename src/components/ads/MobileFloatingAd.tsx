 import { useEffect, useRef } from 'react';
 import { ENABLE_ADS, ADSENSE_CONFIG } from '@/lib/adConfig';
 import { useSubscription } from '@/hooks/useSubscription';
 import { useIsMobile } from '@/hooks/use-mobile';
 
 declare global {
   interface Window {
     adsbygoogle: any[];
   }
 }
 
 export const MobileFloatingAd = () => {
   const adRef = useRef<HTMLDivElement>(null);
   const { subscription } = useSubscription();
   const isMobile = useIsMobile();
 
   const isPaidUser = subscription &&
     subscription.plan && 
     subscription.status === 'active';
 
   // Only show on mobile, when ads are enabled
   const shouldShowAd = ENABLE_ADS && isMobile;
 
   useEffect(() => {
     if (!shouldShowAd) return;
     
     try {
       if (typeof window !== 'undefined' && adRef.current) {
         (window.adsbygoogle = window.adsbygoogle || []).push({});
       }
     } catch (error) {
       console.warn('AdSense mobile push error:', error);
     }
   }, [shouldShowAd]);
 
   // Don't render if ads disabled or not on mobile
   if (!shouldShowAd) return null;
 
   return (
     <div 
       className="fixed bottom-20 left-14 z-40"
       style={{ maxWidth: 'calc(100vw - 70px)' }}
     >
       <div 
         ref={adRef}
         className="bg-card/80 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg"
         style={{ width: '350px', maxWidth: '100%', height: '70px' }}
       >
         <ins
           className="adsbygoogle"
           style={{ display: 'inline-block', width: '350px', height: '70px' }}
           data-ad-client={ADSENSE_CONFIG.publisherId}
           data-ad-slot={ADSENSE_CONFIG.slots.mobileFloat}
         />
       </div>
     </div>
   );
 };