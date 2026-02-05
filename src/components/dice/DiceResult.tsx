import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { DiceResult as DiceResultType, DualDiceResult } from "@/data/diceData";
import { ThumbsUp, RotateCcw, Share2, Utensils, Divide } from "lucide-react";

interface DiceResultProps {
  result: DiceResultType | null;
  dualResult: DualDiceResult | null;
  hasRerolled: boolean;
  showFoodPrompt: boolean;
  isRolling?: boolean;
  voteCount?: number;
  voteThreshold?: number;
  hasVoted?: boolean;
  isAccepted?: boolean;
  onAccept: () => void;
  onReroll: () => void;
  onShare: () => void;
  onContinueFood: () => void;
  onVote?: () => void;
  onStartSplit?: () => void;
  className?: string;
}

// Result tile component
function ResultTile({ 
  emoji, 
  label, 
  typeLabel,
  isActivity = false 
}: { 
  emoji: string; 
  label: string; 
  typeLabel: string;
  isActivity?: boolean;
}) {
  return (
    <div 
      className={cn(
        "flex-1 bg-card rounded-xl border border-border/50 p-5 text-center",
        "animate-result-expand opacity-0",
        "transition-all duration-300"
      )}
    >
      <p className="text-xs text-muted-foreground mb-3">
        {isActivity ? '🎯' : '🍽️'} {typeLabel}
      </p>
      <span className="text-5xl block mb-3 select-none">{emoji}</span>
      <p className="font-bold text-lg text-foreground">{label}</p>
    </div>
  );
}

export function DiceResultDisplay({
  result,
  dualResult,
  hasRerolled,
  showFoodPrompt,
  isRolling,
  voteCount = 0,
  voteThreshold = 2,
  hasVoted = false,
  isAccepted = false,
  onAccept,
  onReroll,
  onShare,
  onContinueFood,
  onVote,
  onStartSplit,
  className
}: DiceResultProps) {
  const { t, i18n } = useTranslation('dice');
  const isRTL = i18n.language === 'ar';

  const voteProgress = (voteCount / voteThreshold) * 100;

  // Render dual result (Quick Decision) - Vertical layout
  if (dualResult) {
    const activityLabel = isRTL 
      ? dualResult.activity.face.labelAr 
      : dualResult.activity.face.labelEn;
    const foodLabel = isRTL 
      ? dualResult.food.face.labelAr 
      : dualResult.food.face.labelEn;

    return (
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('dialog.dice_chose', { defaultValue: 'النرد اختار التالي' })}
          </p>
        </div>

        {/* Dual Result Display - Vertical Stack */}
        <div className="flex flex-col gap-4">
          <ResultTile
            emoji={dualResult.activity.face.emoji}
            label={activityLabel}
            typeLabel={t('chat.activity_tile')}
            isActivity
          />
          <ResultTile
            emoji={dualResult.food.face.emoji}
            label={foodLabel}
            typeLabel={t('chat.food_tile')}
          />
        </div>

        {/* Voting Section */}
        {!isAccepted && (
          <>
            <Separator className="bg-border/30" />
            
            <div className="space-y-4">
              <p className="text-center text-sm font-medium text-foreground">
                {t('voting.do_we_agree', { defaultValue: 'هل نوافق على القرار؟' })}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>{t('chat.voters')}:</span>
                  <span className="font-semibold text-foreground">{voteCount}</span>
                  <span>{t('chat.of')}</span>
                  <span className="font-semibold text-foreground">{voteThreshold}</span>
                </div>
                <Progress 
                  value={voteProgress} 
                  className="h-1.5 bg-muted" 
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={onVote || onAccept}
                  className="flex-1 gap-2"
                  size="lg"
                  variant={hasVoted ? "secondary" : "default"}
                >
                  <ThumbsUp className="w-4 h-4" />
                  {hasVoted ? t('chat.voted') : t('chat.vote')}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={onReroll}
                  disabled={hasRerolled || isRolling}
                  size="lg"
                  className="gap-2"
                >
                  <RotateCcw className={cn("w-4 h-4", hasRerolled && "opacity-50")} />
                  {hasRerolled && (
                    <span className="text-xs">{t('chat.reroll_done')}</span>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Accepted State */}
        {isAccepted && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-status-positive">
              <span className="text-lg">✅</span>
              <span className="font-semibold">{t('chat.decision_accepted')}</span>
            </div>
            
            <Button 
              onClick={onStartSplit}
              className="w-full gap-2"
              size="lg"
            >
              <Divide className="w-4 h-4" />
              {t('chat.start_split')}
            </Button>
          </div>
        )}

        {/* Share Button - Icon only */}
        <div className="flex justify-center">
          <Button 
            variant="ghost"
            size="icon"
            onClick={onShare}
            className="text-muted-foreground hover:text-foreground"
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
        {/* Header */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('dialog.dice_chose', { defaultValue: 'النرد اختار التالي' })}
          </p>
        </div>

        {/* Single Result Display */}
        <Card className="border border-border/50 bg-card animate-result-expand opacity-0">
          <CardContent className="p-8 text-center">
            <span className="text-7xl block mb-4 select-none">{result.face.emoji}</span>
            <p className="text-xl font-bold text-foreground">{label}</p>
          </CardContent>
        </Card>

        {/* Food Prompt - shows when restaurant is selected */}
        {showFoodPrompt && (
          <Card className="border-dashed border-2 border-warning/50 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-warning" />
                  <p className="text-sm font-medium">
                    {t('result.continue_food')}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onContinueFood}
                  className="border-warning/50 text-warning hover:bg-warning/10"
                >
                  🎲 {t('result.roll_food')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voting Section */}
        {!isAccepted && (
          <>
            <Separator className="bg-border/30" />
            
            <div className="space-y-4">
              <p className="text-center text-sm font-medium text-foreground">
                {t('voting.do_we_agree', { defaultValue: 'هل نوافق على القرار؟' })}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>{t('chat.voters')}:</span>
                  <span className="font-semibold text-foreground">{voteCount}</span>
                  <span>{t('chat.of')}</span>
                  <span className="font-semibold text-foreground">{voteThreshold}</span>
                </div>
                <Progress 
                  value={voteProgress} 
                  className="h-1.5 bg-muted" 
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={onVote || onAccept}
                  className="flex-1 gap-2"
                  size="lg"
                  variant={hasVoted ? "secondary" : "default"}
                >
                  <ThumbsUp className="w-4 h-4" />
                  {hasVoted ? t('chat.voted') : t('chat.vote')}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={onReroll}
                  disabled={hasRerolled || isRolling}
                  size="lg"
                  className="gap-2"
                  title={hasRerolled ? t('result.reroll_used') : t('result.reroll')}
                >
                  <RotateCcw className={cn("w-4 h-4", hasRerolled && "opacity-50")} />
                  {hasRerolled && (
                    <span className="text-xs">{t('chat.reroll_done')}</span>
                  )}
                </Button>
              </div>
              
              {hasRerolled && (
                <p className="text-xs text-muted-foreground text-center">
                  {t('result.reroll_used_hint')}
                </p>
              )}
            </div>
          </>
        )}

        {/* Accepted State */}
        {isAccepted && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-status-positive">
              <span className="text-lg">✅</span>
              <span className="font-semibold">{t('chat.decision_accepted')}</span>
            </div>
            
            <Button 
              onClick={onStartSplit}
              className="w-full gap-2"
              size="lg"
            >
              <Divide className="w-4 h-4" />
              {t('chat.start_split')}
            </Button>
          </div>
        )}

        {/* Share Button - Icon only */}
        <div className="flex justify-center">
          <Button 
            variant="ghost"
            size="icon"
            onClick={onShare}
            className="text-muted-foreground hover:text-foreground"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
