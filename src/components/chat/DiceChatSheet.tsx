import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dice5, Loader2, Zap, Target, UtensilsCrossed } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { hapticImpact, hapticNotification } from '@/lib/native';
import { useAnalyticsEvents } from '@/hooks/useAnalyticsEvents';
import { useUsageCredits } from '@/hooks/useUsageCredits';
import { ZeroCreditsPaywall } from '@/components/credits/ZeroCreditsPaywall';
import {
  createDecision,
  faceToResult,
  hasOpenDecision,
  DiceDecisionResult,
} from '@/services/diceChatService';
import { ACTIVITY_FACES, FOOD_FACES } from '@/data/diceData';
import { cn } from '@/lib/utils';

interface DiceChatSheetProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type DiceChoice = 'quick' | 'activity' | 'food';

interface DiceOption {
  id: DiceChoice;
  icon: React.ReactNode;
  emoji: string;
  isHighlighted?: boolean;
}

const DICE_OPTIONS: DiceOption[] = [
  { id: 'food', icon: <UtensilsCrossed className="w-6 h-6" />, emoji: '🍽️' },
  { id: 'activity', icon: <Target className="w-6 h-6" />, emoji: '🎯' },
  { id: 'quick', icon: <Zap className="w-6 h-6" />, emoji: '⚡', isHighlighted: true },
];

export function DiceChatSheet({ groupId, isOpen, onClose, onSuccess }: DiceChatSheetProps) {
  const { t, i18n } = useTranslation(['dice', 'common']);
  const { toast } = useToast();
  const { trackEvent } = useAnalyticsEvents();
  const { checkCredits, consumeCredits } = useUsageCredits();
  const [selectedDice, setSelectedDice] = useState<DiceChoice>('quick');
  const [isRolling, setIsRolling] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const isRTL = i18n.language === 'ar';

  const handleRoll = async () => {
    if (isRolling) return;

    // Check credits before rolling
    const creditCheck = await checkCredits('roll_dice');
    if (!creditCheck.canPerform) {
      setShowPaywall(true);
      return;
    }

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
        // Consume credit after successful roll
        await consumeCredits('roll_dice');
        
        await hapticNotification('success');
        trackEvent('dice_posted_to_chat', {
          dice_type: selectedDice,
          group_id: groupId,
        });
        
        onClose();
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
      <SheetContent side="bottom" className="rounded-t-2xl bg-background border-border">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-center flex items-center justify-center gap-2 text-foreground">
            <Dice5 className="w-6 h-6" />
            {t('dice:dialog.title', 'خلّ النرد يقرر')}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-4">
          {/* Dice options - equal cards */}
          <div className="grid grid-cols-3 gap-3">
            {DICE_OPTIONS.map((option) => {
              const isSelected = selectedDice === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedDice(option.id)}
                  disabled={isRolling}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3",
                    // Base styles
                    "bg-muted/50 border-border/50",
                    // Highlighted card (quick)
                    option.isHighlighted && !isSelected && "bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20",
                    // Selected state
                    isSelected && "border-primary bg-primary/10",
                    // Hover
                    !isSelected && "hover:bg-muted"
                  )}
                >
                  {/* Emoji */}
                  <span className="text-3xl">{option.emoji}</span>
                  
                  {/* Name */}
                  <span className={cn(
                    "text-sm font-semibold text-center",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {t(`dice:picker.${option.id}.name`)}
                  </span>
                  
                  {/* Description */}
                  <span className="text-xs text-muted-foreground text-center leading-tight">
                    {t(`dice:picker.${option.id}.description`)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Roll button */}
          <Button
            onClick={handleRoll}
            disabled={isRolling}
            className="w-full h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isRolling ? (
              <>
                <Loader2 className={cn("w-5 h-5 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                {t('dice:dialog.rolling', 'جاري الرمي...')}
              </>
            ) : (
              <>
                <Dice5 className={cn("w-5 h-5", isRTL ? "ml-2" : "mr-2")} />
                {t('dice:actions.roll', 'ارمِ النرد')} 🎲
              </>
            )}
          </Button>
        </div>
      </SheetContent>

      {/* Zero Credits Paywall */}
      <ZeroCreditsPaywall
        open={showPaywall}
        onOpenChange={setShowPaywall}
        actionName={t('dice:actions.roll', 'رمي النرد')}
        requiredCredits={1}
      />
    </Sheet>
  );
}
