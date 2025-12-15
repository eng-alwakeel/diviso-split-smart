import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useSocialShareTracking } from '@/hooks/useSocialShareTracking';
import { 
  PLATFORM_CONFIGS, 
  generateTrackedLink, 
  getDefaultMessage,
  isMobileDevice,
  type SocialPlatform 
} from '@/lib/socialShareConfig';
import { supabase } from '@/integrations/supabase/client';
import { shareNative, isNativePlatform } from '@/lib/native';

interface SocialShareButtonsProps {
  referralLink: string;
  referralCode: string;
  message?: string;
  layout?: 'grid' | 'horizontal' | 'vertical';
  platforms?: SocialPlatform[];
  showLabels?: boolean;
}

export const SocialShareButtons = ({
  referralLink,
  referralCode,
  message,
  layout = 'grid',
  platforms = ['whatsapp', 'telegram', 'twitter', 'facebook', 'snapchat', 'instagram'],
  showLabels = true
}: SocialShareButtonsProps) => {
  const { trackShare } = useSocialShareTracking();
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });
  }, []);

  const handleShare = async (platform: SocialPlatform) => {
    const config = PLATFORM_CONFIGS[platform];
    const trackedLink = generateTrackedLink(referralLink, platform);
    const shareMessage = message || getDefaultMessage(referralCode, platform);

    // Track the share
    await trackShare(platform, referralCode, userId);

    // Try native sharing first (if on mobile app)
    if (isNativePlatform()) {
      const shared = await shareNative({
        title: 'انضم إلى Diviso',
        text: shareMessage,
        url: trackedLink,
        dialogTitle: `مشاركة عبر ${config.name}`
      });

      if (shared) {
        toast({
          title: 'تم المشاركة',
          description: 'تم مشاركة رابط الإحالة بنجاح'
        });
        return;
      }
    }

    // Handle special platforms
    if (platform === 'instagram') {
      await handleInstagramShare(shareMessage, trackedLink);
      return;
    }

    const shareParams = {
      referralLink: trackedLink,
      message: shareMessage,
      referralCode
    };

    // Try mobile URL scheme first on mobile devices
    if (isMobileDevice() && config.mobileUrl) {
      const mobileUrl = config.mobileUrl(shareParams);
      
      if (mobileUrl) {
        // Try to open the app using URL scheme
        const appOpened = await tryOpenApp(mobileUrl, config.shareUrl(shareParams));
        
        if (appOpened) {
          toast({
            title: 'تم فتح التطبيق',
            description: `جاري المشاركة على ${config.name}`
          });
          return;
        }
      }
    }

    // Fallback: Try Web Share API on mobile
    if (isMobileDevice() && navigator.share) {
      try {
        await navigator.share({
          title: 'انضم إلى Diviso',
          text: shareMessage,
          url: trackedLink
        });
        toast({
          title: 'تم المشاركة',
          description: 'تم مشاركة رابط الإحالة بنجاح'
        });
        return;
      } catch (error) {
        // User cancelled or share failed, continue to web fallback
        if ((error as Error).name !== 'AbortError') {
          console.log('Web Share API failed, using fallback');
        }
      }
    }

    // Final fallback: Open web share URL
    const shareUrl = config.shareUrl(shareParams);
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      toast({
        title: 'تم فتح المشاركة',
        description: `يمكنك الآن مشاركة إحالتك على ${config.name}`
      });
    }
  };

  const tryOpenApp = (appUrl: string, fallbackUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let appOpened = false;

      // Create a hidden iframe to try opening the app
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // Set up visibility change listener
      const handleVisibilityChange = () => {
        if (document.hidden) {
          appOpened = true;
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Try to open the app
      window.location.href = appUrl;

      // Check after a short delay if the app opened
      setTimeout(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.body.removeChild(iframe);

        const elapsed = Date.now() - startTime;
        
        // If page is still visible and not much time passed, app didn't open
        if (!appOpened && !document.hidden && elapsed < 2000) {
          // App didn't open, use fallback
          if (fallbackUrl) {
            window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
          }
          resolve(false);
        } else {
          resolve(true);
        }
      }, 1500);
    });
  };

  const handleInstagramShare = async (text: string, link: string) => {
    try {
      // Copy text to clipboard
      await navigator.clipboard.writeText(`${text}\n\n${link}`);
      
      toast({
        title: 'تم نسخ النص',
        description: 'الصق الآن في Instagram Story! 📸',
        duration: 5000
      });

      // Try to open Instagram
      if (isMobileDevice()) {
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        
        if (isIOS) {
          window.location.href = 'instagram://story-camera';
        } else {
          window.location.href = 'intent://instagram.com/#Intent;package=com.instagram.android;scheme=https;end';
        }
        
        // Fallback
        setTimeout(() => {
          window.open('https://www.instagram.com/', '_blank');
        }, 1500);
      } else {
        window.open('https://www.instagram.com/', '_blank');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل نسخ النص',
        variant: 'destructive'
      });
    }
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-wrap gap-2';
      case 'vertical':
        return 'flex flex-col gap-2';
      case 'grid':
      default:
        return 'grid grid-cols-2 sm:grid-cols-3 gap-3';
    }
  };

  return (
    <div className={getLayoutClasses()}>
      {platforms.map((platform) => {
        const config = PLATFORM_CONFIGS[platform];
        const Icon = config.icon;

        return (
          <Button
            key={platform}
            onClick={() => handleShare(platform)}
            variant="outline"
            className={`
              relative overflow-hidden group
              hover:scale-105 transition-all duration-300
              border-2
            `}
            style={{
              borderColor: config.color + '40'
            }}
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
              style={{
                background: `linear-gradient(135deg, ${config.color}, ${config.color})`
              }}
            />
            
            <div className="flex items-center gap-2 relative z-10">
              <Icon 
                className="h-5 w-5 transition-transform group-hover:scale-110" 
                style={{ color: config.color }}
              />
              {showLabels && (
                <span className="font-medium">{config.name}</span>
              )}
            </div>
          </Button>
        );
      })}
    </div>
  );
};
