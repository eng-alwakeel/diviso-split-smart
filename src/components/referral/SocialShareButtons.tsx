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

    // Generate share URL (fallback for web or if native sharing failed)
    const shareUrl = config.shareUrl({
      referralLink: trackedLink,
      message: shareMessage,
      referralCode
    });

    // Open share URL
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      toast({
        title: 'تم فتح المشاركة',
        description: `يمكنك الآن مشاركة إحالتك على ${config.name}`
      });
    }
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
