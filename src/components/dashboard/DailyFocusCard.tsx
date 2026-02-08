import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, Check, Dice5 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { OnboardingTask } from '@/hooks/useOnboarding';
import type { ActivePlan, DashboardMode, SessionHint } from '@/hooks/useDashboardMode';

interface DailyFocusCardProps {
  mode: DashboardMode;
  sessionHint?: SessionHint;
  lastActionHint?: string | null;
  nextTask?: OnboardingTask | null;
  activePlan?: ActivePlan | null;
  netBalance?: number;
  daysSinceLastAction?: number;
}

function getDaysLeft(endDate: string | null): number {
  if (!endDate) return 0;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function DailyFocusCard({
  mode,
  sessionHint = 'curiosity',
  lastActionHint,
  nextTask,
  activePlan,
  netBalance = 0,
  daysSinceLastAction = 0,
}: DailyFocusCardProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  // Last action hint line (shared across modes)
  const lastActionLine = lastActionHint ? (
    <p className="text-xs text-muted-foreground mt-1">
      {t(`daily_focus.${lastActionHint}`)}
    </p>
  ) : null;

  // Onboarding mode
  if (mode === 'onboarding' && nextTask) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t('daily_focus.onboarding_greeting')}
              </p>
              {lastActionLine}
            </div>
            <p className="text-sm text-muted-foreground">
              {t(nextTask.descriptionKey)}
            </p>
            <Button
              size="sm"
              onClick={() => nextTask.route && navigate(nextTask.route)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {t(nextTask.titleKey)}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Re-engagement mode
  if (mode === 'reengagement') {
    return (
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
        <CardContent className="p-5">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t('daily_focus.reengagement_title')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('daily_focus.reengagement_sub')}
              </p>
              {lastActionLine}
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/dice')}
              className="gap-2"
            >
              <Dice5 className="w-4 h-4" />
              {t('daily_focus.reengagement_dice_cta')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Daily Hub mode — driven by sessionHint
  // sessionHint === 'action' && activePlan
  if (sessionHint === 'action' && activePlan) {
    const daysLeft = getDaysLeft(activePlan.end_date);
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t('daily_focus.plan_active')}
              </p>
              <p className="text-sm text-muted-foreground">
                {activePlan.title} — {t('daily_focus.plan_days_left', { days: daysLeft })}
              </p>
              {lastActionLine}
            </div>
            <Button
              size="sm"
              onClick={() => navigate(`/add-expense?plan_id=${activePlan.id}`)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('daily_focus.plan_add_expense')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // sessionHint === 'done'
  if (sessionHint === 'done') {
    return (
      <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t('daily_focus.done_title')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('daily_focus.done_sub')}
              </p>
              {lastActionLine}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // sessionHint === 'curiosity' (default daily)
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-5">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t('daily_focus.daily_ready')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('daily_focus.daily_ready_sub')}
            </p>
            {lastActionLine}
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/add-expense')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('daily_focus.no_plan_cta')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
