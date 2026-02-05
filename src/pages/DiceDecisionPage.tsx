import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DicePicker } from "@/components/dice/DicePicker";
import { DiceResultDisplay } from "@/components/dice/DiceResult";
import { ShareDiceResult } from "@/components/dice/ShareDiceResult";
import { AnimatedDice } from "@/components/dice/AnimatedDice";
import { ZeroCreditsPaywall } from "@/components/credits/ZeroCreditsPaywall";
import { useDiceDecision } from "@/hooks/useDiceDecision";
import { useSmartDiceComment } from "@/hooks/useSmartDiceComment";
import { ACTIVITY_DICE, FOOD_DICE, DiceType } from "@/data/diceData";
import { cn } from "@/lib/utils";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

type PageState = 'picker' | 'ready' | 'rolling' | 'result' | 'share';

const DiceDecisionPage = () => {
  const { t, i18n } = useTranslation('dice');
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const [showShare, setShowShare] = useState(false);

  // Smart comment hook
  const { comment: smartComment, isLoading: isLoadingComment, generateComment, clearComment } = useSmartDiceComment();

  const {
    selectedDice,
    isRolling,
    result,
    dualResult,
    hasRerolled,
    showFoodPrompt,
    showPaywall,
    selectDice,
    rollDice,
    rollQuickDice,
    rollFoodAfterActivity,
    acceptDecision,
    rerollDice,
    reset,
    closePaywall
  } = useDiceDecision();

  // Determine current state
  const getCurrentState = (): PageState => {
    if (showShare) return 'share';
    if (result || dualResult) return 'result';
    if (isRolling) return 'rolling';
    if (selectedDice) return 'ready';
    return 'picker';
  };

  const currentState = getCurrentState();

  // Generate smart comment when result changes
  useEffect(() => {
    if (result && !smartComment) {
      generateComment({
        diceType: result.diceType.id,
        resultLabel: result.face.labelEn,
        resultLabelAr: result.face.labelAr,
      });
    } else if (dualResult && !smartComment) {
      generateComment({
        diceType: 'quick',
        resultLabel: dualResult.activity.face.labelEn,
        resultLabelAr: dualResult.activity.face.labelAr,
      });
    }
  }, [result, dualResult, smartComment, generateComment]);

  // Handle dice selection
  const handleSelectDice = (dice: DiceType) => {
    selectDice(dice);
    clearComment(); // Clear any previous comment
  };

  // Handle roll
  const handleRoll = async () => {
    clearComment(); // Clear comment before new roll
    if (selectedDice?.id === 'quick') {
      await rollQuickDice();
    } else {
      await rollDice();
    }
  };

  // Handle accept
  const handleAccept = () => {
    acceptDecision();
    navigate('/dashboard');
  };

  // Handle share
  const handleShare = () => {
    setShowShare(true);
  };

  // Handle back
  const handleBack = () => {
    if (showShare) {
      setShowShare(false);
    } else {
      reset();
      clearComment();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={t('page.title')} 
        description={t('page.description')}
      />
      <AppHeader />

      <div className="page-container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          {currentState !== 'picker' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {t('page.heading')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('page.subheading')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="h-5 w-5" />
          </Button>
        </div>

        {/* Main Content */}
        <Card className="border-primary/10">
          <CardContent className="p-6">
            {/* Picker State */}
            {currentState === 'picker' && (
              <DicePicker onSelect={handleSelectDice} />
            )}

            {/* Ready State - Show dice and roll button */}
            {currentState === 'ready' && selectedDice && (
              <div className="space-y-8 text-center py-4">
                <div className="py-8">
                  <AnimatedDice
                    faces={selectedDice.id === 'quick' ? ACTIVITY_DICE.faces : selectedDice.faces}
                    isRolling={false}
                    size="lg"
                    className="mx-auto"
                  />
                </div>
                
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    {isRTL ? selectedDice.nameAr : selectedDice.nameEn}
                  </h2>
                  <p className="text-muted-foreground">
                    {isRTL ? selectedDice.descriptionAr : selectedDice.descriptionEn}
                  </p>
                </div>
                
                <Button
                  size="lg"
                  className={cn(
                    "w-full max-w-xs mx-auto text-lg py-6",
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
              <div className="py-16 text-center space-y-8">
                {selectedDice?.id === 'quick' ? (
                  // Dual dice rolling
                  <div className="flex justify-center gap-8">
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
                
                <p className="text-lg text-muted-foreground animate-pulse">
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
                smartComment={smartComment}
                isLoadingComment={isLoadingComment}
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
          </CardContent>
        </Card>
      </div>

      <div className="h-24" />
      <BottomNav />

      {/* Zero Credits Paywall */}
      <ZeroCreditsPaywall
        open={showPaywall}
        onOpenChange={(open) => !open && closePaywall()}
        actionName={t('actions.roll')}
        requiredCredits={1}
      />
    </div>
  );
};

export default DiceDecisionPage;
