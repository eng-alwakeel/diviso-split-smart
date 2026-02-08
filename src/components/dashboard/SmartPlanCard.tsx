import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ActivePlan } from '@/hooks/useDashboardMode';

interface SmartPlanCardProps {
  activePlan: ActivePlan | null;
}

function getDaysLeft(endDate: string | null): number {
  if (!endDate) return 0;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function SmartPlanCard({ activePlan }: SmartPlanCardProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  if (activePlan) {
    const daysLeft = getDaysLeft(activePlan.end_date);
    return (
      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {t('smart_plan.current_plan')}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activePlan.title} | {t('smart_plan.days_left', { days: daysLeft })}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/plans/${activePlan.id}`)}
              className="shrink-0 text-xs"
            >
              {t('smart_plan.view_plan')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {t('smart_plan.no_plan_prompt')}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/plans/create')}
            className="shrink-0 text-xs"
          >
            <Plus className="w-3 h-3 ltr:mr-1 rtl:ml-1" />
            {t('smart_plan.create_plan_cta')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
