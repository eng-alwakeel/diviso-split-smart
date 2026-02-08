import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, CheckCircle2, Gift, Coins, Check } from 'lucide-react';
import { useDailyCheckin } from '@/hooks/useDailyCheckin';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DayCircleProps {
  day: number;
  completed: boolean;
  isToday: boolean;
  isLast: boolean;
}

const DayCircle = ({ day, completed, isToday, isLast }: DayCircleProps) => (
  <div
    className={cn(
      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
      completed && 'bg-primary text-primary-foreground',
      !completed && isToday && 'ring-2 ring-primary/40 bg-muted/50 text-foreground',
      !completed && !isToday && 'bg-muted/30 border border-border/50 text-muted-foreground'
    )}
  >
    {completed ? (
      <Check className="w-3.5 h-3.5" />
    ) : isLast ? (
      <Trophy className="w-3.5 h-3.5" />
    ) : (
      day
    )}
  </div>
);

interface WeekProgressBarProps {
  weekProgress: { day: number; completed: boolean; isToday: boolean }[];
}

const WeekProgressBar = ({ weekProgress }: WeekProgressBarProps) => (
  <div className="flex items-center justify-between gap-1 py-2">
    {weekProgress.map((dp) => (
      <DayCircle
        key={dp.day}
        day={dp.day}
        completed={dp.completed}
        isToday={dp.isToday}
        isLast={dp.day === 7}
      />
    ))}
    <Trophy className="w-5 h-5 text-primary ms-1 shrink-0" />
  </div>
);

export const DailyRewardCardCompact = () => {
  const { t } = useTranslation('dashboard');
  const { streak, weekProgress, checkedInToday, loading, claiming, claimReward } = useDailyCheckin();

  if (loading) {
    return <Skeleton className="h-36 w-full rounded-lg" />;
  }

  return (
    <Card className="border-border/60">
      <CardContent className="p-3">
        {/* Header: Title + Streak badge */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {t('daily_reward_compact.title')}
            </span>
          </div>
          {streak.currentStreak > 0 && (
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              <Flame className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{streak.currentStreak}</span>
            </div>
          )}
        </div>

        {/* Subtitle */}
        <p className="text-xs text-muted-foreground mb-2">
          {t('daily_reward_compact.subtitle')}
        </p>

        {/* Week Progress Bar */}
        <WeekProgressBar weekProgress={weekProgress} />

        {/* Action Area */}
        <div className="mt-2">
          {!checkedInToday ? (
            <Button
              className="w-full"
              size="sm"
              onClick={claimReward}
              disabled={claiming}
            >
              {claiming
                ? t('daily_reward_compact.claiming')
                : t('daily_reward_compact.claim_button')}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-1.5 py-1.5">
              <CheckCircle2 className="w-4 h-4 text-status-positive" />
              <span className="text-sm text-status-positive font-medium">
                {t('daily_reward_compact.checked_in')}
              </span>
            </div>
          )}
        </div>

        {/* Footer stats - only if coins > 0 */}
        {streak.coins > 0 && (
          <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-primary" />
              <span className="text-xs text-muted-foreground">
                {streak.coins} {t('daily_reward_compact.coins')}
              </span>
            </div>
            <span className="text-border">|</span>
            <span className="text-xs text-muted-foreground">
              {streak.totalCheckIns} {t('daily_reward_compact.checkins')}
            </span>
            <span className="text-border">|</span>
            <span className="text-xs text-muted-foreground">
              {streak.longestStreak} {t('daily_reward_compact.longest_streak')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
