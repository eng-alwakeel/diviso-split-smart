import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dice5, ChevronDown, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DiceDecision } from '@/components/dice/DiceDecision';
import { DiceType, ACTIVITY_DICE, CUISINE_DICE, BUDGET_DICE, WHOPAYS_DICE, TASK_DICE, getDiceById } from '@/data/diceData';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

const DICE_MAP: Record<string, DiceType> = {
  activity: ACTIVITY_DICE,
  cuisine: CUISINE_DICE,
  budget: BUDGET_DICE,
  whopays: WHOPAYS_DICE,
  task: TASK_DICE,
};

export function DailyDiceCard() {
  const { t, i18n } = useTranslation('dice');
  const isAr = i18n.language === 'ar';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [suggestedType, setSuggestedType] = useState<DiceType>(ACTIVITY_DICE);
  const [suggestionReason, setSuggestionReason] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState(0);

  // Load smart suggestion + streak
  useEffect(() => {
    const loadSuggestion = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('suggest-dice', {
          body: {
            time_of_day: getTimeOfDay(),
            available_dice: ['activity', 'cuisine', 'budget', 'whopays', 'task']
          }
        });

        if (!error && data?.suggested_dice?.length > 0) {
          const id = data.suggested_dice[0];
          const dice = DICE_MAP[id];
          if (dice) {
            setSuggestedType(dice);
            setSuggestionReason(data.reason || null);
          }
        }
      } catch {
        // Keep default
      }
    };

    const loadStreak = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('daily_hub_cache')
          .select('streak_count')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data?.streak_count) {
          setStreakCount(data.streak_count);
        }
      } catch {
        // ignore
      }
    };

    loadSuggestion();
    loadStreak();
  }, []);

  const subtitle = useMemo(() => {
    const key = `daily_suggestion.subtitle_${suggestedType.id}`;
    return t(key, { defaultValue: t('daily_suggestion.subtitle_default') });
  }, [suggestedType, t]);

  const handleRoll = useCallback(() => {
    setShowPicker(false);
    setDialogOpen(true);
  }, []);

  const handleChangeType = useCallback(() => {
    setShowPicker(true);
    setDialogOpen(true);
  }, []);

  const diceIcon = suggestedType.icon;
  const diceName = isAr ? suggestedType.nameAr : suggestedType.nameEn;

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-md transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            {/* Icon + Content */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center shrink-0">
                <span className="text-2xl">{diceIcon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {t('daily_suggestion.title')}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">
                    {subtitle}
                  </span>
                  <button
                    onClick={handleChangeType}
                    className="text-xs text-primary hover:underline flex items-center gap-0.5 shrink-0"
                  >
                    {diceName}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Button
              size="sm"
              onClick={handleRoll}
              className="shrink-0 gap-1.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Dice5 className="w-4 h-4" />
              {t('daily_suggestion.cta')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DiceDecision
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialDice={showPicker ? undefined : suggestedType}
      />
    </>
  );
}
