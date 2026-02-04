import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DiceResult as DiceResultType, DualDiceResult } from "@/data/diceData";
import { Check, RotateCcw, Share2, Utensils } from "lucide-react";

interface DiceResultProps {
  result: DiceResultType | null;
  dualResult: DualDiceResult | null;
  hasRerolled: boolean;
  showFoodPrompt: boolean;
  isRolling?: boolean;
  onAccept: () => void;
  onReroll: () => void;
  onShare: () => void;
  onContinueFood: () => void;
  className?: string;
}

export function DiceResultDisplay({
  result,
  dualResult,
  hasRerolled,
  showFoodPrompt,
  isRolling,
  onAccept,
  onReroll,
  onShare,
  onContinueFood,
  className
}: DiceResultProps) {
  const { t, i18n } = useTranslation('dice');
  const isRTL = i18n.language === 'ar';

  // Render dual result (Quick Decision)
  if (dualResult) {
    const activityLabel = isRTL 
      ? dualResult.activity.face.labelAr 
      : dualResult.activity.face.labelEn;
    const foodLabel = isRTL 
      ? dualResult.food.face.labelAr 
      : dualResult.food.face.labelEn;

    return (
      <div className={cn("space-y-6", className)}>
        {/* Dual Result Display */}
        <div className="grid grid-cols-2 gap-4">
          {/* Activity Result */}
          <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">
                🎯 {t('result.activity_label')}
              </p>
              <div className="text-5xl mb-2 animate-scale-in">
                {dualResult.activity.face.emoji}
              </div>
              <p className="font-semibold text-sm">
                {activityLabel}
              </p>
            </CardContent>
          </Card>

          {/* Food Result */}
          <Card className="border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-red-500/5">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">
                🍽️ {t('result.food_label')}
              </p>
              <div className="text-5xl mb-2 animate-scale-in">
                {dualResult.food.face.emoji}
              </div>
              <p className="font-semibold text-sm">
                {foodLabel}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={onAccept}
            className="flex-1"
            size="lg"
          >
            <Check className="w-4 h-4 ml-2" />
            {t('result.accept')}
          </Button>
          
          <Button 
            variant="outline"
            onClick={onReroll}
            disabled={hasRerolled || isRolling}
            size="lg"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline"
            onClick={onShare}
            size="lg"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Render single result
  if (result) {
    const label = isRTL ? result.face.labelAr : result.face.labelEn;

    return (
      <div className={cn("space-y-6", className)}>
        {/* Single Result Display */}
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-8 text-center">
            <div className="text-8xl mb-4 animate-scale-in">
              {result.face.emoji}
            </div>
            <p className="text-xl font-bold text-foreground">
              {label}
            </p>
          </CardContent>
        </Card>

        {/* Food Prompt - shows when restaurant is selected */}
        {showFoodPrompt && (
          <Card className="border-dashed border-2 border-orange-500/50 bg-orange-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-500" />
                  <p className="text-sm font-medium">
                    {t('result.continue_food')}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onContinueFood}
                  className="border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                >
                  🎲 {t('result.roll_food')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={onAccept}
            className="flex-1"
            size="lg"
          >
            <Check className="w-4 h-4 ml-2" />
            {t('result.accept')}
          </Button>
          
          <Button 
            variant="outline"
            onClick={onReroll}
            disabled={hasRerolled || isRolling}
            size="lg"
            title={hasRerolled ? t('result.reroll_used') : t('result.reroll')}
          >
            <RotateCcw className={cn("w-4 h-4", hasRerolled && "opacity-50")} />
          </Button>
          
          <Button 
            variant="outline"
            onClick={onShare}
            size="lg"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
        
        {hasRerolled && (
          <p className="text-xs text-muted-foreground text-center">
            {t('result.reroll_used_hint')}
          </p>
        )}
      </div>
    );
  }

  return null;
}
