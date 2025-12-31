import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDailyCheckin } from '@/hooks/useDailyCheckin';
import { Gift, Check, Trophy, Flame, Star, Loader2, Coins, Camera, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const DayCircle = memo(({ 
  day, 
  completed, 
  isToday, 
  reward 
}: { 
  day: number; 
  completed: boolean; 
  isToday: boolean;
  reward: { 
    type: 'coins' | 'badge' | 'soft_unlock' | 'boost'; 
    value: string; 
    coins: number;
    feature?: string;
    icon?: string;
  };
}) => {
  const getIcon = () => {
    if (completed) {
      return <Check className="h-4 w-4" />;
    }
    if (day === 7) {
      return <Trophy className="h-4 w-4 text-primary" />;
    }
    if (reward.type === 'soft_unlock') {
      return <Sparkles className="h-4 w-4 text-primary" />;
    }
    if (reward.type === 'boost') {
      return <Camera className="h-4 w-4 text-primary" />;
    }
    if (reward.type === 'badge') {
      return <Star className="h-4 w-4 text-primary" />;
    }
    if (reward.type === 'coins') {
      return <Coins className="h-4 w-4 text-muted-foreground" />;
    }
    return <Gift className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
          completed && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
          isToday && !completed && "bg-primary/20 border-2 border-primary animate-pulse",
          !completed && !isToday && "bg-muted border border-border"
        )}
      >
        {isToday && !completed ? (
          <Gift className="h-4 w-4 text-primary" />
        ) : (
          getIcon()
        )}
      </div>
      <span className={cn(
        "text-xs font-medium",
        completed ? "text-primary" : "text-muted-foreground"
      )}>
        {day}
      </span>
    </div>
  );
});

DayCircle.displayName = 'DayCircle';

const DailyCheckInCard = memo(() => {
  const { t } = useTranslation('dashboard');
  const { streak, weekProgress, checkedInToday, loading, claiming, claimReward } = useDailyCheckin();

  if (loading) {
    return (
      <Card className="bg-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-primary/20 overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{t('checkin.title')}</h3>
              <p className="text-xs text-muted-foreground">{t('checkin.description')}</p>
            </div>
          </div>
          {streak.currentStreak > 0 && (
            <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">{streak.currentStreak}</span>
            </div>
          )}
        </div>

        {/* Week Progress */}
        <div className="flex items-center justify-between mb-4 px-2">
          {weekProgress.map((day) => (
            <DayCircle
              key={day.day}
              day={day.day}
              completed={day.completed}
              isToday={day.isToday}
              reward={day.reward}
            />
          ))}
        </div>

        {/* Action Button */}
        <Button
          onClick={claimReward}
          disabled={checkedInToday || claiming}
          className={cn(
            "w-full transition-all",
            checkedInToday 
              ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30" 
              : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
          )}
        >
          {claiming ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              {t('checkin.claiming')}
            </>
          ) : checkedInToday ? (
            <>
              <Check className="h-4 w-4 ml-2" />
              {t('checkin.claimed_today')}
            </>
          ) : (
            <>
              <Gift className="h-4 w-4 ml-2" />
              {t('checkin.claim_button')}
            </>
          )}
        </Button>

        {/* Stats Footer */}
        {(streak.coins > 0 || streak.points > 0) && (
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/50">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{streak.coins || streak.points}</p>
              <p className="text-xs text-muted-foreground">{t('checkin.coins')}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{streak.totalCheckIns}</p>
              <p className="text-xs text-muted-foreground">{t('checkin.checkins')}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{streak.longestStreak}</p>
              <p className="text-xs text-muted-foreground">{t('checkin.longest_streak')}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DailyCheckInCard.displayName = 'DailyCheckInCard';

export default DailyCheckInCard;
