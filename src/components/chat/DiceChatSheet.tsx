import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dice5, Loader2, Zap, Target, UtensilsCrossed } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { hapticImpact, hapticNotification } from '@/lib/native';
import { useAnalyticsEvents } from '@/hooks/useAnalyticsEvents';
import {
  createDecision,
  faceToResult,
  hasOpenDecision,
  DiceDecisionResult,
} from '@/services/diceChatService';
import { ACTIVITY_FACES, FOOD_FACES } from '@/data/diceData';

interface DiceChatSheetProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type DiceChoice = 'quick' | 'activity' | 'food';

const DICE_OPTIONS: { id: DiceChoice; icon: React.ReactNode; gradient: string }[] = [
  { id: 'quick', icon: <Zap className="w-5 h-5" />, gradient: 'from-purple-500 to-pink-600' },
  { id: 'activity', icon: <Target className="w-5 h-5" />, gradient: 'from-blue-500 to-indigo-600' },
  { id: 'food', icon: <UtensilsCrossed className="w-5 h-5" />, gradient: 'from-orange-500 to-red-600' },
];

export function DiceChatSheet({ groupId, isOpen, onClose, onSuccess }: DiceChatSheetProps) {
  const { t } = useTranslation(['dice', 'common']);
  const { toast } = useToast();
  const { trackEvent } = useAnalyticsEvents();
  const [selectedDice, setSelectedDice] = useState<DiceChoice>('quick');
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = async () => {
    if (isRolling) return;

    setIsRolling(true);
    await hapticImpact('medium');

    try {
      // Check for existing open decision
      const hasOpen = await hasOpenDecision(groupId);
      if (hasOpen) {
        toast({
          title: t('dice:chat.open_decision_exists_title', 'قرار مفتوح'),
          description: t('dice:chat.open_decision_exists', 'فيه قرار مفتوح... صوّتوا عليه أول 😅'),
          variant: 'destructive',
        });
        setIsRolling(false);
        return;
      }

      // Generate results
      const results: DiceDecisionResult[] = [];
      
      if (selectedDice === 'quick') {
        const activityFace = ACTIVITY_FACES[Math.floor(Math.random() * ACTIVITY_FACES.length)];
        const foodFace = FOOD_FACES[Math.floor(Math.random() * FOOD_FACES.length)];
        results.push(faceToResult(activityFace), faceToResult(foodFace));
      } else if (selectedDice === 'activity') {
        const face = ACTIVITY_FACES[Math.floor(Math.random() * ACTIVITY_FACES.length)];
        results.push(faceToResult(face));
      } else {
        const face = FOOD_FACES[Math.floor(Math.random() * FOOD_FACES.length)];
        results.push(faceToResult(face));
      }

      // Create decision
      const result = await createDecision(groupId, selectedDice, results);

      if (result.success) {
        await hapticNotification('success');
        trackEvent('dice_posted_to_chat', {
          dice_type: selectedDice,
          group_id: groupId,
        });
        
        toast({
          title: t('dice:chat.decision_posted', 'تم نشر القرار! 🎲'),
          description: t('dice:chat.vote_now', 'صوّتوا عليه الحين'),
        });
        
        onSuccess?.();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[DiceChatSheet] Roll error:', error);
      toast({
        title: t('common:toast.error'),
        description: t('dice:chat.roll_failed', 'فشل في رمي النرد'),
        variant: 'destructive',
      });
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-center flex items-center justify-center gap-2">
            <Dice5 className="w-6 h-6" />
            {t('dice:dialog.title', 'خلّ النرد يقرر')}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-4">
          {/* Dice options */}
          <div className="grid grid-cols-3 gap-3">
            {DICE_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedDice(option.id)}
                disabled={isRolling}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${selectedDice === option.id
                    ? `border-primary bg-gradient-to-br ${option.gradient} text-white`
                    : 'border-border bg-muted/50 hover:bg-muted'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  {option.icon}
                  <span className="text-xs font-medium">
                    {t(`dice:picker.${option.id}.name`)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Description */}
          <p className="text-center text-sm text-muted-foreground">
            {t(`dice:picker.${selectedDice}.description`)}
          </p>

          {/* Roll button */}
          <Button
            onClick={handleRoll}
            disabled={isRolling}
            className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary/80"
            variant="hero"
          >
            {isRolling ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
                {t('dice:dialog.rolling', 'جاري الرمي...')}
              </>
            ) : (
              <>
                <Dice5 className="w-5 h-5 ml-2" />
                {t('dice:actions.roll', 'ارمِ النرد')} 🎲
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
