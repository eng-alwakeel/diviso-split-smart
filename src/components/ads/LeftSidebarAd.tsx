 import { useEffect, useRef } from 'react';
 import { ENABLE_ADS, ADSENSE_CONFIG } from '@/lib/adConfig';
 import { useSubscription } from '@/hooks/useSubscription';
 import { useIsMobile } from '@/hooks/use-mobile';
 
 declare global {
   interface Window {
     adsbygoogle: any[];
   }
 }
 
 export const LeftSidebarAd = () => {
   const adRef = useRef<HTMLDivElement>(null);
   const { subscription } = useSubscription();
   const isMobile = useIsMobile();

  const isPaidUser = subscription &&
     subscription.plan && 
     subscription.status === 'active';
 
  const shouldShowAd = ENABLE_ADS && !isMobile;

   useEffect(() => {
    if (!shouldShowAd) return;
    
     try {
       if (typeof window !== 'undefined' && adRef.current) {
         (window.adsbygoogle = window.adsbygoogle || []).push({});
       }
     } catch (error) {
       console.warn('AdSense push error:', error);
     }
  }, [shouldShowAd]);

  // Don't render if ads disabled or on mobile
  if (!shouldShowAd) return null;
 
   return (
     <aside className="hidden lg:block fixed left-4 top-24 z-30 w-[250px]">
       <div 
         ref={adRef}
         className="bg-card/50 rounded-lg overflow-hidden"
         style={{ minHeight: '700px' }}
       >
         <ins
           className="adsbygoogle"
           style={{ display: 'inline-block', width: '250px', height: '700px' }}
           data-ad-client={ADSENSE_CONFIG.publisherId}
           data-ad-slot={ADSENSE_CONFIG.slots.sidebar}
         />
       </div>
     </aside>
   );
 };