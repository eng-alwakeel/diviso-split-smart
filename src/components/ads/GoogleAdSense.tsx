import { useEffect, useRef, memo } from 'react';
import { ADSENSE_CONFIG, ENABLE_ADS } from '@/lib/adConfig';
import { useGlobalSubscription } from '@/hooks/useGlobalSubscription';

interface GoogleAdSenseProps {
  slot?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical' | 'fluid';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const GoogleAdSense = memo(({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  style
}: GoogleAdSenseProps) => {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);
  const { subscription } = useGlobalSubscription();

  // Don't show ads to paid subscribers
  const isPaidUser = subscription?.status === 'active' && subscription?.plan;

  useEffect(() => {
    if (!ENABLE_ADS || isPaidUser || initialized.current) return;
    
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && adRef.current) {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
          initialized.current = true;
        }
      } catch (error) {
        console.warn('AdSense initialization error:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isPaidUser]);

  // Don't render if ads are disabled or user is paid
  if (!ENABLE_ADS || isPaidUser) {
    return null;
  }

  const adSlot = slot || ADSENSE_CONFIG.slots.banner || '';

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ 
          display: 'block',
          minHeight: format === 'horizontal' ? '90px' : format === 'rectangle' ? '250px' : '100px',
          ...style 
        }}
        data-ad-client={ADSENSE_CONFIG.publisherId}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
});

GoogleAdSense.displayName = 'GoogleAdSense';

export default GoogleAdSense;
