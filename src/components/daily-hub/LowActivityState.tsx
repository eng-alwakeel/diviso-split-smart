import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DailyHubData } from '@/hooks/useDailyHub';

interface LowActivityStateProps {
  data: DailyHubData;
}

export function LowActivityState({ data }: LowActivityStateProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardContent className="p-5">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {t('daily_hub.low_activity_title', { days: data.days_since_last_action })}
          </p>
          <Button
            size="sm"
            onClick={() => navigate('/my-groups')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('daily_hub.low_activity_cta')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
