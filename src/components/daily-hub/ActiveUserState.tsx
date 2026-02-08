import { StreakDisplay } from './StreakDisplay';
import { GroupEventCard } from './GroupEventCard';
import { DailyDiceCard } from './DailyDiceCard';
import type { DailyHubData } from '@/hooks/useDailyHub';

interface ActiveUserStateProps {
  data: DailyHubData;
}

export function ActiveUserState({ data }: ActiveUserStateProps) {
  return (
    <div className="space-y-3">
      <StreakDisplay count={data.streak_count} />

      {data.last_group_event && (
        <GroupEventCard event={data.last_group_event} />
      )}

      <DailyDiceCard suggestedType={data.suggested_dice_type} />

      {data.motivational_message && (
        <p className="text-sm text-muted-foreground text-center py-1">
          {data.motivational_message}
        </p>
      )}
    </div>
  );
}
