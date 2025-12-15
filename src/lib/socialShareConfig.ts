import { 
  MessageCircle, 
  Instagram, 
  Twitter, 
  Facebook, 
  Send,
  Ghost,
  type LucideIcon
} from 'lucide-react';

export type SocialPlatform = 'whatsapp' | 'snapchat' | 'instagram' | 'twitter' | 'facebook' | 'telegram';

export interface PlatformConfig {
  name: string;
  nameEn: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  shareUrl: (params: ShareParams) => string;
  mobileUrl?: (params: ShareParams) => string;
  supportsDirectShare: boolean;
  requiresSpecialHandling: boolean;
}

export interface ShareParams {
  referralLink: string;
  message: string;
  referralCode: string;
  qrCodeDataUrl?: string;
}

export const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  whatsapp: {
    name: 'واتساب',
    nameEn: 'WhatsApp',
    icon: MessageCircle,
    color: '#25D366',
    gradient: 'from-[#25D366] to-[#128C7E]',
    supportsDirectShare: true,
    requiresSpecialHandling: false,
    shareUrl: ({ referralLink, message }: ShareParams) => {
      const text = encodeURIComponent(`${message}\n\n${referralLink}`);
      // Use api.whatsapp.com for better mobile compatibility
      return `https://api.whatsapp.com/send?text=${text}`;
    },
    mobileUrl: ({ referralLink, message }: ShareParams) => {
      const text = encodeURIComponent(`${message}\n\n${referralLink}`);
      return `whatsapp://send?text=${text}`;
    }
  },
  telegram: {
    name: 'تليجرام',
    nameEn: 'Telegram',
    icon: Send,
    color: '#0088CC',
    gradient: 'from-[#0088CC] to-[#00659E]',
    supportsDirectShare: true,
    requiresSpecialHandling: false,
    shareUrl: ({ referralLink, message }: ShareParams) => {
      const text = encodeURIComponent(message);
      const url = encodeURIComponent(referralLink);
      return `https://t.me/share/url?url=${url}&text=${text}`;
    },
    mobileUrl: ({ referralLink, message }: ShareParams) => {
      const text = encodeURIComponent(message);
      const url = encodeURIComponent(referralLink);
      return `tg://msg_url?url=${url}&text=${text}`;
    }
  },
  twitter: {
    name: 'تويتر (X)',
    nameEn: 'Twitter',
    icon: Twitter,
    color: '#1DA1F2',
    gradient: 'from-[#1DA1F2] to-[#0084B4]',
    supportsDirectShare: true,
    requiresSpecialHandling: false,
    shareUrl: ({ referralLink, message }: ShareParams) => {
      const text = encodeURIComponent(message);
      const url = encodeURIComponent(referralLink);
      return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    },
    mobileUrl: ({ referralLink, message }: ShareParams) => {
      const text = encodeURIComponent(`${message} ${referralLink}`);
      return `twitter://post?message=${text}`;
    }
  },
  facebook: {
    name: 'فيسبوك',
    nameEn: 'Facebook',
    icon: Facebook,
    color: '#4267B2',
    gradient: 'from-[#4267B2] to-[#2851A3]',
    supportsDirectShare: true,
    requiresSpecialHandling: false,
    shareUrl: ({ referralLink }: ShareParams) => {
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    },
    mobileUrl: ({ referralLink }: ShareParams) => {
      return `fb://share/?link=${encodeURIComponent(referralLink)}`;
    }
  },
  snapchat: {
    name: 'سناب شات',
    nameEn: 'Snapchat',
    icon: Ghost,
    color: '#FFFC00',
    gradient: 'from-[#FFFC00] to-[#FFA500]',
    supportsDirectShare: true,
    requiresSpecialHandling: true,
    shareUrl: ({ referralLink }: ShareParams) => {
      return `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(referralLink)}`;
    },
    mobileUrl: ({ referralLink }: ShareParams) => {
      return `snapchat://creativekit/share?attachmentUrl=${encodeURIComponent(referralLink)}`;
    }
  },
  instagram: {
    name: 'انستقرام',
    nameEn: 'Instagram',
    icon: Instagram,
    color: '#E4405F',
    gradient: 'from-[#833AB4] via-[#FD1D1D] to-[#F77737]',
    supportsDirectShare: false,
    requiresSpecialHandling: true,
    shareUrl: () => '',
    mobileUrl: () => 'instagram://story-camera'
  }
};

export const generateTrackedLink = (
  baseLink: string,
  platform: SocialPlatform
): string => {
  const url = new URL(baseLink);
  url.searchParams.set('utm_source', platform);
  url.searchParams.set('utm_medium', 'social');
  url.searchParams.set('utm_campaign', 'referral');
  return url.toString();
};

export const getDefaultMessage = (referralCode: string, platform?: SocialPlatform): string => {
  const messages: Record<string, string> = {
    whatsapp: `🎉 انضم إلى Diviso معي!\n\nقسّم بذكاء، سافر براحة 🚀\n\n✨ استخدم كود الإحالة: ${referralCode}\n📱 واحصل على 7 أيام مجانية!`,
    telegram: `🎉 انضم إلى Diviso معي!\n\nقسّم بذكاء، سافر براحة 🚀\n\nاستخدم كود: ${referralCode} واحصل على 7 أيام مجانية!`,
    twitter: `🚀 جرّب Diviso - قسّم مصاريفك بذكاء!\n\nكود الإحالة: ${referralCode}\n✨ 7 أيام مجانية`,
    facebook: `انضم إلى Diviso - التطبيق الأذكى لتقسيم المصاريف! استخدم كود الإحالة: ${referralCode}`,
    snapchat: `جرّب Diviso! استخدم كود: ${referralCode} 🎉`,
    instagram: `🎉 انضم إلى Diviso\n\nقسّم بذكاء، سافر براحة\nكود: ${referralCode}\n✨ 7 أيام مجانية!`,
  };

  return messages[platform || 'whatsapp'] || messages.whatsapp;
};

export const detectBrowser = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edge')) return 'Edge';
  
  return 'Unknown';
};

export const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};
