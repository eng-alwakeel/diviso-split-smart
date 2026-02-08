import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dice5, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface DailyDiceCardProps {
  suggestedType: string | null;
  lockedDate?: string | null;
}

const DICE_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  food: { ar: 'نرد أكل 🍕', en: 'Food dice 🍕' },
  activity: { ar: 'نرد طلعات 🎯', en: 'Activity dice 🎯' },
  quick: { ar: 'نرد سريع ⚡', en: 'Quick dice ⚡' },
};

export function DailyDiceCard({ suggestedType, lockedDate }: DailyDiceCardProps) {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const today = new Date().toISOString().split('T')[0];
  const isLocked = lockedDate === today && !!suggestedType;

  const label = suggestedType
    ? (isAr ? DICE_TYPE_LABELS[suggestedType]?.ar : DICE_TYPE_LABELS[suggestedType]?.en) || suggestedType
    : null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Dice5 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{t('daily_hub.daily_dice_title')}</p>
                {isLocked && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    {t('daily_hub.dice_locked')}
                  </Badge>
                )}
              </div>
              {label && (
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              )}
              {isLocked && (
                <p className="text-[10px] text-muted-foreground/70">{t('daily_hub.dice_locked_hint')}</p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={() => navigate('/dice')}
            className="text-xs"
          >
            {t('daily_hub.daily_dice_cta')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
