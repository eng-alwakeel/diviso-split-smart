import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DiceType, ACTIVITY_DICE, FOOD_DICE, getDiceForGroupType } from "@/data/diceData";
import { useDiceDecision } from "@/hooks/useDiceDecision";
import { DicePicker } from "./DicePicker";
import { DiceResultDisplay } from "./DiceResult";
import { ShareDiceResult } from "./ShareDiceResult";
import { AnimatedDice } from "./AnimatedDice";
import { ZeroCreditsPaywall } from "@/components/credits/ZeroCreditsPaywall";
import { ArrowLeft } from "lucide-react";

interface DiceDecisionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  groupType?: string;
  initialDice?: DiceType;
}

type DiceState = 'picker' | 'ready' | 'rolling' | 'result' | 'share';

export function DiceDecision({
  open,
  onOpenChange,
  groupId,
  groupType,
  initialDice
}: DiceDecisionProps) {
  const { t, i18n } = useTranslation('dice');
  const isRTL = i18n.language === 'ar';
  const [showShare, setShowShare] = useState(false);

  const {
    selectedDice,
    isRolling,
    result,
    dualResult,
    hasRerolled,
    showFoodPrompt,
    showPaywall,
    suggestedDice,
    suggestionReason,
    isLoadingSuggestion,
    selectDice,
    rollDice,
    rollQuickDice,
    rollFoodAfterActivity,
    acceptDecision,
    rerollDice,
    reset,
    closePaywall,
    loadSuggestion
  } = useDiceDecision();

  // Load suggestion when dialog opens with group context
  useEffect(() => {
    if (open && groupType) {
      loadSuggestion({
        groupType,
        memberCount: undefined,
        timeOfDay: undefined,
        lastActivity: undefined
      });
    }
  }, [open, groupType, loadSuggestion]);

  // Handle initial dice selection
  useEffect(() => {
    if (open && initialDice) {
      selectDice(initialDice);
    }
  }, [open, initialDice, selectDice]);

  // Determine current state
  const currentState = useMemo((): DiceState => {
    if (showShare) return 'share';
    if (result || dualResult) return 'result';
    if (isRolling) return 'rolling';
    if (selectedDice) return 'ready';
    return 'picker';
  }, [showShare, result, dualResult, isRolling, selectedDice]);

  // Trigger confetti on result
  useEffect(() => {
    if (currentState === 'result' && (result || dualResult)) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [currentState, result, dualResult]);

  // Get available dice based on group type
  const availableDice = useMemo(() => {
    return getDiceForGroupType(groupType);
  }, [groupType]);

  // Handle dialog close
  const handleClose = () => {
    reset();
    setShowShare(false);
    onOpenChange(false);
  };

  // Handle dice selection
  const handleSelectDice = (dice: DiceType) => {
    selectDice(dice);
  };

  // Handle roll
  const handleRoll = async () => {
    if (selectedDice?.id === 'quick') {
      await rollQuickDice();
    } else {
      await rollDice();
    }
  };

  // Handle accept
  const handleAccept = () => {
    acceptDecision();
    handleClose();
  };

  // Handle share
  const handleShare = () => {
    setShowShare(true);
  };

  // Handle back to picker
  const handleBack = () => {
    reset();
    setShowShare(false);
  };

  // Get dialog title based on state
  const getDialogTitle = () => {
    switch (currentState) {
      case 'picker':
        return t('dialog.choose_dice');
      case 'ready':
        return isRTL ? selectedDice?.nameAr : selectedDice?.nameEn;
      case 'rolling':
        return t('dialog.rolling');
      case 'result':
        return t('dialog.result');
      case 'share':
        return t('share.title');
      default:
        return t('dialog.title');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {(currentState === 'ready' || currentState === 'result' || currentState === 'share') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="flex-1">
              {getDialogTitle()}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Picker State */}
          {currentState === 'picker' && (
            <DicePicker
              onSelect={handleSelectDice}
              suggestedDice={suggestedDice}
              suggestionReason={suggestionReason}
              availableDice={availableDice}
            />
          )}

          {/* Ready State - Show dice and roll button */}
          {currentState === 'ready' && selectedDice && (
            <div className="space-y-6 text-center">
              <div className="py-8">
                <AnimatedDice
                  faces={selectedDice.id === 'quick' ? ACTIVITY_DICE.faces : selectedDice.faces}
                  isRolling={false}
                  size="lg"
                  className="mx-auto"
                />
              </div>
              
              <p className="text-muted-foreground">
                {isRTL ? selectedDice.descriptionAr : selectedDice.descriptionEn}
              </p>
              
              <Button
                size="lg"
                className={cn(
                  "w-full text-lg py-6",
                  `bg-gradient-to-r ${selectedDice.color} hover:opacity-90`
                )}
                onClick={handleRoll}
              >
                🎲 {t('actions.roll')}
              </Button>
            </div>
          )}

          {/* Rolling State */}
          {currentState === 'rolling' && (
            <div className="py-12 text-center space-y-6">
              {selectedDice?.id === 'quick' || dualResult ? (
                // Dual dice rolling
                <div className="flex justify-center gap-6">
                  <AnimatedDice
                    faces={ACTIVITY_DICE.faces}
                    isRolling={true}
                    size="md"
                  />
                  <AnimatedDice
                    faces={FOOD_DICE.faces}
                    isRolling={true}
                    size="md"
                  />
                </div>
              ) : (
                // Single dice rolling
                <AnimatedDice
                  faces={selectedDice?.faces || ACTIVITY_DICE.faces}
                  isRolling={true}
                  size="lg"
                  className="mx-auto"
                />
              )}
              
              <p className="text-muted-foreground animate-pulse">
                {t('dialog.rolling')}...
              </p>
            </div>
          )}

          {/* Result State */}
          {currentState === 'result' && (
            <DiceResultDisplay
              result={result}
              dualResult={dualResult}
              hasRerolled={hasRerolled}
              showFoodPrompt={showFoodPrompt}
              isRolling={isRolling}
              onAccept={handleAccept}
              onReroll={rerollDice}
              onShare={handleShare}
              onContinueFood={rollFoodAfterActivity}
            />
          )}

          {/* Share State */}
          {currentState === 'share' && (
            <ShareDiceResult
              result={result}
              dualResult={dualResult}
              onClose={() => setShowShare(false)}
            />
          )}
        </div>
      </DialogContent>

      {/* Zero Credits Paywall */}
      <ZeroCreditsPaywall
        open={showPaywall}
        onOpenChange={(open) => !open && closePaywall()}
        actionName={t('actions.roll')}
        requiredCredits={1}
      />
    </Dialog>
  );
}
