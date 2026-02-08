import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Flame, CheckCircle2, Gift, Coins } from 'lucide-react';
import { useDailyCheckin } from '@/hooks/useDailyCheckin';
import { Skeleton } from '@/components/ui/skeleton';

export const DailyRewardCardCompact = () => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { streak, checkedInToday, loading } = useDailyCheckin();

  if (loading) {
    return <Skeleton className="h-20 w-full rounded-lg" />;
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-sm transition-all duration-200 border-border/60"
      onClick={() => navigate('/rewards')}
    >
      <CardContent className="p-3">
        {/* Header: Title + Streak badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-foreground">
              {t('daily_reward_compact.title')}
            </span>
          </div>
          {streak.currentStreak > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full">
              <Flame className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{streak.currentStreak}</span>
            </div>
          )}
        </div>

        {/* Status line */}
        <div className="flex items-center gap-1.5 mb-1">
          {checkedInToday ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                {t('daily_reward_compact.checked_in')}
              </span>
            </>
          ) : (
            <>
              <Gift className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t('daily_reward_compact.not_checked_in')}
              </span>
            </>
          )}
        </div>

        {/* Footer stats - only if coins > 0 */}
        {streak.coins > 0 && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-500" />
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
