import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DailyHubData } from '@/hooks/useDailyHub';

interface MiniActivityFeedProps {
  lastGroupEvent: DailyHubData['last_group_event'];
}

export function MiniActivityFeed({ lastGroupEvent }: MiniActivityFeedProps) {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  if (!lastGroupEvent) return null;

  const message = isAr
    ? lastGroupEvent.smart_message_ar
    : lastGroupEvent.smart_message_en;

  return (
    <Card className="border-border/40 bg-card/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-foreground flex-1 min-w-0 truncate">
            {message}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/group/${lastGroupEvent.group_id}`)}
            className="shrink-0 text-xs gap-1"
          >
            <Eye className="w-3 h-3" />
            {t('mini_feed.view_details')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
