import { Card, CardContent } from '@/components/ui/card';
import { Receipt, HandCoins, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GroupEventCardProps {
  event: {
    event_type: string;
    smart_message_ar: string;
    smart_message_en: string;
    group_name: string;
    created_at: string;
  };
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

export function GroupEventCard({ event }: GroupEventCardProps) {
  const { t, i18n } = useTranslation('dashboard');
  const isAr = i18n.language === 'ar';
  const Icon = EVENT_ICONS[event.event_type] || Receipt;
  const message = isAr ? event.smart_message_ar : event.smart_message_en;

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground leading-relaxed">{message}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-muted-foreground">{event.group_name}</span>
              <span className="text-xs text-muted-foreground opacity-50">•</span>
              <span className="text-xs text-muted-foreground">
                {getRelativeTime(event.created_at, t)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
