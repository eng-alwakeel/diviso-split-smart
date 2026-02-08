import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ActivePlan, DashboardMode } from '@/hooks/useDashboardMode';

interface HomePlanCardProps {
  activePlan: ActivePlan | null;
  mode: DashboardMode;
}

function getDaysLeft(endDate: string | null): number {
  if (!endDate) return 0;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function HomePlanCard({ activePlan, mode }: HomePlanCardProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  // Determine which state to render
  const isOnboarding = mode === 'onboarding';
  const hasActivePlan = !isOnboarding && activePlan !== null;

  // State A: Active plan
  if (hasActivePlan) {
    const daysLeft = getDaysLeft(activePlan.end_date);
    const destination = activePlan.destination;

    const subtitle = destination
      ? t('home_plan.subtitle_active', { destination, separator: ' | ', days: daysLeft })
      : t('home_plan.subtitle_active_no_dest', { days: daysLeft });

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
                  {t('home_plan.title_active')}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activePlan.title} | {subtitle}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/plans/${activePlan.id}`)}
              className="shrink-0 text-xs"
            >
              {t('home_plan.cta_view')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State: Onboarding or No plan
  const title = isOnboarding ? t('home_plan.title_onboarding') : t('home_plan.title_new');
  const subtitle = isOnboarding ? t('home_plan.subtitle_onboarding') : t('home_plan.subtitle_new');

  return (
    <Card className="border-border/50 bg-card/80">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOnboarding ? 'bg-muted' : 'bg-primary/10'}`}>
              <CalendarDays className={`w-4 h-4 ${isOnboarding ? 'text-muted-foreground' : 'text-primary'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {subtitle}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/create-plan')}
            className="shrink-0 text-xs"
          >
            <Plus className="w-3 h-3 ltr:mr-1 rtl:ml-1" />
            {t('home_plan.cta_create')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
