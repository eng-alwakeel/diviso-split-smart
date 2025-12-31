import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Twitter, Instagram, Copy, Check, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Achievement, useAchievements } from '@/hooks/useAchievements';
import { cn } from '@/lib/utils';

interface ShareableAchievementCardProps {
  achievement: Achievement;
  onShare?: (platform: string) => void;
  compact?: boolean;
}

export const ShareableAchievementCard: React.FC<ShareableAchievementCardProps> = ({
  achievement,
  onShare,
  compact = false
}) => {
  const { t, i18n } = useTranslation('dashboard');
  const isRTL = i18n.language === 'ar';
  const { shareAchievement, getAchievementIcon, getAchievementColor } = useAchievements();
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const getAchievementTitle = () => {
    const titles: Record<string, string> = {
      expenses_milestone: isRTL ? `تتبعت ${achievement.achievement_value} مصروف!` : `Tracked ${achievement.achievement_value} expenses!`,
      groups_milestone: isRTL ? `أنشأت ${achievement.achievement_value} مجموعات!` : `Created ${achievement.achievement_value} groups!`,
      savings_milestone: isRTL ? `وفرت ${achievement.achievement_value} ريال!` : `Saved ${achievement.achievement_value} SAR!`,
      streak_milestone: isRTL ? `سلسلة ${achievement.achievement_value} يوم!` : `${achievement.achievement_value} day streak!`,
      referrals_milestone: isRTL ? `دعوت ${achievement.achievement_value} أصدقاء!` : `Referred ${achievement.achievement_value} friends!`,
    };
    return titles[achievement.achievement_type] || (isRTL ? 'إنجاز جديد!' : 'New Achievement!');
  };

  const getShareText = () => {
    const title = getAchievementTitle();
    return isRTL 
      ? `🏆 حققت إنجاز جديد في Diviso!\n\n${title}\n\nجرب التطبيق الآن: https://diviso.app`
      : `🏆 Achieved something new in Diviso!\n\n${title}\n\nTry the app now: https://diviso.app`;
  };

  const handleShare = async (platform: string) => {
    setSharing(true);
    const shareText = getShareText();
    const url = 'https://diviso.app';
    
    try {
      if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
      } else if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
      } else if (platform === 'copy') {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      
      if (!achievement.shared) {
        await shareAchievement(achievement.id, platform);
      }
      
      onShare?.(platform);
    } finally {
      setSharing(false);
    }
  };

  const gradientColor = getAchievementColor(achievement.achievement_level);
  const icon = getAchievementIcon(achievement.achievement_type);

  if (compact) {
    return (
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-3">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-lg", gradientColor)}>
              {icon}
            </div>
            <div className={cn("flex-1", isRTL && "text-right")}>
              <p className="font-semibold text-sm">{getAchievementTitle()}</p>
              {!achievement.shared && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  {isRTL ? '+20 عملة للمشاركة' : '+20 coins for sharing'}
                </p>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={() => handleShare('whatsapp')} disabled={sharing}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
      <div className={cn("bg-gradient-to-br p-6 text-white", gradientColor)}>
        <div className="text-center">
          <div className="text-5xl mb-3">{icon}</div>
          <h3 className="text-xl font-bold mb-1">
            {isRTL ? '🏆 إنجاز جديد في Diviso!' : '🏆 New Achievement in Diviso!'}
          </h3>
          <p className="text-2xl font-bold opacity-90">{getAchievementTitle()}</p>
          {achievement.achievement_level && (
            <div className="mt-2 inline-block px-3 py-1 bg-white/20 rounded-full text-sm">
              {achievement.achievement_level.charAt(0).toUpperCase() + achievement.achievement_level.slice(1)}
            </div>
          )}
        </div>
      </div>
      
      <CardContent className="p-4">
        {!achievement.shared && (
          <div className={cn("flex items-center justify-center gap-2 mb-4 text-primary", isRTL && "flex-row-reverse")}>
            <Coins className="w-5 h-5" />
            <span className="font-semibold">
              {isRTL ? 'شارك واحصل على 20 عملة!' : 'Share and get 20 coins!'}
            </span>
          </div>
        )}
        
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2 text-green-600 border-green-200 hover:bg-green-50"
            onClick={() => handleShare('whatsapp')}
            disabled={sharing}
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2 text-blue-500 border-blue-200 hover:bg-blue-50"
            onClick={() => handleShare('twitter')}
            disabled={sharing}
          >
            <Twitter className="w-5 h-5" />
            Twitter
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2"
            onClick={() => handleShare('copy')}
            disabled={sharing}
          >
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            {copied ? (isRTL ? 'تم!' : 'Done!') : (isRTL ? 'نسخ' : 'Copy')}
          </Button>
        </div>
        
        {achievement.shared && (
          <p className={cn("text-center text-sm text-muted-foreground mt-3", isRTL && "text-right")}>
            ✓ {isRTL ? 'تم المشاركة' : 'Already shared'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
