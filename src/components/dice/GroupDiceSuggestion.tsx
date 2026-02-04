import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DiceDecision } from "./DiceDecision";
import { DiceType, getDiceForGroupType, ACTIVITY_DICE, FOOD_DICE } from "@/data/diceData";
import { cn } from "@/lib/utils";
import { Dice5 } from "lucide-react";

interface GroupDiceSuggestionProps {
  groupId?: string;
  groupType?: string;
  className?: string;
}

export function GroupDiceSuggestion({
  groupId,
  groupType,
  className
}: GroupDiceSuggestionProps) {
  const { t, i18n } = useTranslation('dice');
  const isRTL = i18n.language === 'ar';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInitialDice, setSelectedInitialDice] = useState<DiceType | undefined>();

  // Get available dice based on group type
  const availableDice = getDiceForGroupType(groupType);

  const handleDiceClick = (dice: DiceType) => {
    setSelectedInitialDice(dice);
    setDialogOpen(true);
  };

  const getDiceIcon = (id: string) => {
    switch (id) {
      case 'activity': return '🎯';
      case 'food': return '🍽️';
      case 'quick': return '⚡';
      default: return '🎲';
    }
  };

  // Don't render if no available dice
  if (availableDice.length === 0) {
    return null;
  }

  return (
    <>
      <Card className={cn(
        "border-primary/10 bg-gradient-to-r from-muted/30 to-muted/50",
        "hover:border-primary/30 transition-all duration-200",
        className
      )}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
              <Dice5 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t('group.suggestion_title')}
              </span>
            </div>
            
            {/* Dice Buttons */}
            <div className="flex gap-2 flex-1 justify-end">
              {availableDice.filter(d => d.id !== 'quick').map((dice) => (
                <Button
                  key={dice.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDiceClick(dice)}
                  className="text-xs gap-1.5 hover:border-primary/50 hover:bg-primary/5"
                >
                  <span>{getDiceIcon(dice.id)}</span>
                  <span className="hidden sm:inline">
                    {isRTL ? dice.nameAr : dice.nameEn}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dice Decision Dialog */}
      <DiceDecision
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        groupId={groupId}
        groupType={groupType}
        initialDice={selectedInitialDice}
      />
    </>
  );
}
