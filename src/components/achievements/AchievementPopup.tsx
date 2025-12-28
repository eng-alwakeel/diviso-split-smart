import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Achievement, useAchievements } from '@/hooks/useAchievements';
import { ShareableAchievementCard } from './ShareableAchievementCard';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface AchievementPopupProps {
  achievement: Achievement | null;
  open: boolean;
  onClose: () => void;
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({
  achievement,
  open,
  onClose
}) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [hasShared, setHasShared] = useState(false);

  useEffect(() => {
    if (open && achievement) {
      // Trigger confetti on popup open
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [open, achievement]);

  const handleShare = () => {
    setHasShared(true);
  };

  if (!achievement) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className={cn("text-center text-2xl", isRTL && "font-arabic")}>
            🎉 {isRTL ? 'تهانينا!' : 'Congratulations!'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          <ShareableAchievementCard 
            achievement={achievement} 
            onShare={handleShare}
          />
          
          <div className="mt-4 flex justify-center">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="text-muted-foreground"
            >
              {hasShared 
                ? (isRTL ? 'إغلاق' : 'Close')
                : (isRTL ? 'لاحقاً' : 'Maybe later')
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
