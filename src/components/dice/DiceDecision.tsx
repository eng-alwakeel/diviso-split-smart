import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import { DiceType, ACTIVITY_DICE, CUISINE_DICE, FOOD_DICE, getDiceForGroupType } from "@/data/diceData";
import { useDiceDecision } from "@/hooks/useDiceDecision";
import { DicePicker } from "./DicePicker";
import { DiceResultDisplay } from "./DiceResult";
import { ShareDiceResult } from "./ShareDiceResult";
import { AnimatedDice, DualAnimatedDice } from "./AnimatedDice";
import { ZeroCreditsPaywall } from "@/components/credits/ZeroCreditsPaywall";
import { ArrowLeft, Dice5 } from "lucide-react";

interface DiceDecisionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  groupType?: string;
  initialDice?: DiceType;
}

type DiceState = 'picker' | 'ready' | 'rolling' | 'revealing' | 'result' | 'share';

// Revealing duration in ms
const REVEAL_DURATION = 600;

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
  const [isRevealing, setIsRevealing] = useState(false);

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

  // Handle reveal animation when rolling completes
  useEffect(() => {
    if (!isRolling && (result || dualResult) && !isRevealing) {
      setIsRevealing(true);
      
      const timer = setTimeout(() => {
        setIsRevealing(false);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, REVEAL_DURATION);
      
      return () => clearTimeout(timer);
    }
  }, [isRolling, result, dualResult]);

  // Determine current state
  const currentState = useMemo((): DiceState => {
    if (showShare) return 'share';
    if (isRevealing) return 'revealing';
    if (result || dualResult) return 'result';
    if (isRolling) return 'rolling';
    if (selectedDice) return 'ready';
    return 'picker';
  }, [showShare, isRevealing, result, dualResult, isRolling, selectedDice]);

  // Get available dice based on group type
  const availableDice = useMemo(() => {
    return getDiceForGroupType(groupType);
  }, [groupType]);

  const handleClose = useCallback(() => {
    reset();
    setShowShare(false);
    setIsRevealing(false);
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const handleSelectDice = useCallback((dice: DiceType) => {
    selectDice(dice);
  }, [selectDice]);

  const handleRoll = useCallback(async () => {
    if (selectedDice?.id === 'quick') {
      await rollQuickDice();
    } else {
      await rollDice();
    }
  }, [selectedDice, rollQuickDice, rollDice]);

  const handleAccept = useCallback(() => {
    acceptDecision();
    handleClose();
  }, [acceptDecision, handleClose]);

  const handleShare = useCallback(() => {
    setShowShare(true);
  }, []);

  const handleBack = useCallback(() => {
    reset();
    setShowShare(false);
    setIsRevealing(false);
  }, [reset]);

  const getDialogTitle = () => {
    switch (currentState) {
      case 'picker':
        return t('dialog.choose_dice');
      case 'ready':
        return isRTL ? selectedDice?.nameAr : selectedDice?.nameEn;
      case 'rolling':
        return t('dialog.dice_deciding', { defaultValue: 'النرد يقرر...' });
      case 'revealing':
        return t('dialog.dice_said', { defaultValue: 'النرد قال كلمته' });
      case 'result':
        return t('dialog.result');
      case 'share':
        return t('share.title');
      default:
        return t('dialog.title');
    }
  };

  // Determine faces for animation based on selected dice
  const animationFaces = selectedDice?.faces?.length ? selectedDice.faces : ACTIVITY_DICE.faces;

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
            <DialogTitle className="flex-1 flex items-center gap-2">
              <span className="text-xl">🎲</span>
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

          {/* Ready State */}
          {currentState === 'ready' && selectedDice && (
            <div className="space-y-8 text-center">
              <div className="py-8">
                {selectedDice.id === 'quick' ? (
                  <DualAnimatedDice
                    isRolling={false}
                    activityFaces={ACTIVITY_DICE.faces}
                    foodFaces={CUISINE_DICE.faces}
                    className="mx-auto"
                  />
                ) : (
                  <AnimatedDice
                    faces={animationFaces}
                    isRolling={false}
                    size="lg"
                    className="mx-auto"
                  />
                )}
              </div>
              
              <p className="text-muted-foreground">
                {isRTL ? selectedDice.descriptionAr : selectedDice.descriptionEn}
              </p>
              
              <Button
                size="lg"
                className="w-full text-lg py-6 gap-2"
                onClick={handleRoll}
              >
                <Dice5 className="w-5 h-5" />
                {t('dialog.lets_see', { defaultValue: 'خلّنا نشوف وش يطلع 🎲' })}
              </Button>
            </div>
          )}

          {/* Rolling State */}
          {currentState === 'rolling' && (
            <div className="py-16 text-center space-y-8">
              {selectedDice?.id === 'quick' ? (
                <DualAnimatedDice
                  isRolling={true}
                  activityFaces={ACTIVITY_DICE.faces}
                  foodFaces={CUISINE_DICE.faces}
                  className="mx-auto"
                />
              ) : (
                <AnimatedDice
                  faces={animationFaces}
                  isRolling={true}
                  size="lg"
                  className="mx-auto"
                />
              )}
              
              <p className="text-lg text-muted-foreground animate-pulse">
                {t('dialog.dice_deciding', { defaultValue: 'النرد يقرر...' })}
              </p>
            </div>
          )}

          {/* Revealing State */}
          {currentState === 'revealing' && (
            <div className="py-16 text-center space-y-8">
              {dualResult ? (
                <DualAnimatedDice
                  isRolling={false}
                  isRevealing={true}
                  activityFace={dualResult.activity.face}
                  foodFace={(dualResult.cuisine || dualResult.food)?.face}
                  activityFaces={ACTIVITY_DICE.faces}
                  foodFaces={CUISINE_DICE.faces}
                  className="mx-auto"
                />
              ) : result ? (
                <AnimatedDice
                  faces={animationFaces}
                  isRolling={false}
                  isRevealing={true}
                  resultFace={result.face}
                  size="lg"
                  className="mx-auto"
                />
              ) : null}
              
              <p className="text-lg font-medium text-foreground">
                {t('dialog.dice_said', { defaultValue: 'النرد قال كلمته' })}
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
