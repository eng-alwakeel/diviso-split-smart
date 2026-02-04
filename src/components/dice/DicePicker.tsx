import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DiceType, DICE_TYPES } from "@/data/diceData";

interface DicePickerProps {
  onSelect: (dice: DiceType) => void;
  suggestedDice?: DiceType | null;
  suggestionReason?: string | null;
  availableDice?: DiceType[];
  className?: string;
}

export function DicePicker({ 
  onSelect, 
  suggestedDice,
  suggestionReason,
  availableDice,
  className 
}: DicePickerProps) {
  const { t, i18n } = useTranslation('dice');
  const isRTL = i18n.language === 'ar';

  // Use available dice if provided, otherwise show all
  const diceToShow = availableDice || DICE_TYPES;

  const getDiceIcon = (id: string) => {
    switch (id) {
      case 'activity': return '🎯';
      case 'food': return '🍽️';
      case 'quick': return '⚡';
      default: return '🎲';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold text-center">
        {t('picker.title')}
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {diceToShow.map((dice) => {
          const isSuggested = suggestedDice?.id === dice.id;
          const name = isRTL ? dice.nameAr : dice.nameEn;
          const description = isRTL ? dice.descriptionAr : dice.descriptionEn;
          
          return (
            <Card
              key={dice.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                "border-2",
                isSuggested 
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => onSelect(dice)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center text-3xl",
                    `bg-gradient-to-br ${dice.color} shadow-lg`
                  )}>
                    {getDiceIcon(dice.id)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">
                        {name}
                      </h4>
                      {isSuggested && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                          ✨ {t('picker.suggested')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {description}
                    </p>
                    {isSuggested && suggestionReason && (
                      <p className="text-xs text-primary/70 mt-1 flex items-center gap-1">
                        <span>💡</span> {suggestionReason}
                      </p>
                    )}
                  </div>
                  
                  {/* Arrow indicator */}
                  <div className="text-muted-foreground">
                    {isRTL ? '←' : '→'}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
