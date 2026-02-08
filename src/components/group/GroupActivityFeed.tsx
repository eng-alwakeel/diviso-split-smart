import { useActivityFeed } from '@/hooks/useActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, HandCoins, UserPlus, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GroupActivityFeedProps {
  groupId: string | undefined;
}

const EVENT_ICONS: Record<string, typeof Receipt> = {
  expense_added: Receipt,
  settlement_made: HandCoins,
  member_joined: UserPlus,
};

function getRelativeTime(dateStr: string, t: (k: string, opts?: any) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('activity_feed.time_ago.just_now');
  if (minutes < 60) return t('activity_feed.time_ago.minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('activity_feed.time_ago.hours', { count: hours });
  const days = Math.floor(hours / 24);
  return t('activity_feed.time_ago.days', { count: days });
}

export function GroupActivityFeed({ groupId }: GroupActivityFeedProps) {
  const { events, isLoading } = useActivityFeed(groupId);
  const { t, i18n } = useTranslation('dashboard');
  const isAr = i18n.language === 'ar';

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  if (events.length === 0) {
    return null; // Don't show empty feed
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          {t('activity_feed.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="space-y-2.5 max-h-64 overflow-y-auto">
          {events.slice(0, 10).map((event) => {
            const Icon = EVENT_ICONS[event.event_type] || Receipt;
            const message = isAr ? event.smart_message_ar : event.smart_message_en;

            return (
              <div key={event.id} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground leading-relaxed">{message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {getRelativeTime(event.created_at, t)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
