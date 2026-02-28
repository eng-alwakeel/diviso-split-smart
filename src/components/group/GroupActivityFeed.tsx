import { useActivityFeed } from '@/hooks/useActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, HandCoins, UserPlus, Activity, UserMinus, UserCheck, Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface GroupActivityFeedProps {
  groupId: string | undefined;
}

const EVENT_ICONS: Record<string, typeof Receipt> = {
  expense_added: Receipt,
  settlement_made: HandCoins,
  member_joined: UserPlus,
  invite_accepted: UserCheck,
  invite_rejected: UserMinus,
  pending_linked: Link2,
};

const EVENT_COLORS: Record<string, string> = {
  expense_added: 'bg-amber-500/10 text-amber-600',
  settlement_made: 'bg-blue-500/10 text-blue-600',
  member_joined: 'bg-green-500/10 text-green-600',
  invite_accepted: 'bg-green-500/10 text-green-600',
  invite_rejected: 'bg-muted text-muted-foreground',
  pending_linked: 'bg-primary/10 text-primary',
};

function getShortTime(dateStr: string, isAr: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return isAr ? 'الآن' : 'now';
  if (minutes < 60) return isAr ? `${minutes}د` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return isAr ? `${hours}س` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return isAr ? `${days}ي` : `${days}d`;
}

export function GroupActivityFeed({ groupId }: GroupActivityFeedProps) {
  const { events, isLoading } = useActivityFeed(groupId);
  const { i18n } = useTranslation('dashboard');
  const isAr = i18n.language === 'ar';

  if (isLoading) {
    return <Skeleton className="h-20 w-full rounded-lg" />;
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
          <Activity className="w-3.5 h-3.5 text-primary" />
          {isAr ? 'آخر الأحداث' : 'Recent Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {events.slice(0, 8).map((event) => {
            const Icon = EVENT_ICONS[event.event_type] || Receipt;
            const colorClass = EVENT_COLORS[event.event_type] || 'bg-muted text-muted-foreground';
            const message = isAr ? event.smart_message_ar : event.smart_message_en;

            return (
              <div key={event.id} className="flex items-center gap-2 py-1">
                <div className={cn("w-5 h-5 rounded-md flex items-center justify-center shrink-0", colorClass)}>
                  <Icon className="w-3 h-3" />
                </div>
                <p className="text-[11px] text-foreground/80 flex-1 min-w-0 truncate leading-tight">{message}</p>
                <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                  {getShortTime(event.created_at, isAr)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
