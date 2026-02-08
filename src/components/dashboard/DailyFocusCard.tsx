import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { OnboardingTask } from '@/hooks/useOnboarding';
import type { ActivePlan } from '@/hooks/useDashboardMode';
import type { DashboardMode } from '@/hooks/useDashboardMode';

interface DailyFocusCardProps {
  mode: DashboardMode;
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

// Map onboarding task descriptions to friendly CTA text
const TASK_CTA_MAP: Record<string, string> = {
  profile: '/settings',
  group: '/create-group',
  expense: '/add-expense',
  invite: '/my-groups',
  referral: '/referral',
};

export function DailyFocusCard({
  mode,
  nextTask,
  activePlan,
  netBalance = 0,
  daysSinceLastAction = 0,
}: DailyFocusCardProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  // Onboarding mode
  if (mode === 'onboarding' && nextTask) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              {t('daily_focus.onboarding_greeting')}
            </p>
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
            <p className="text-sm font-semibold text-foreground">
              {t('daily_focus.reengagement', { days: daysSinceLastAction })}
            </p>
            <Button
              size="sm"
              onClick={() => navigate('/my-groups')}
              className="gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              {t('daily_focus.reengagement_cta')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Daily Hub mode
  // Has active plan
  if (activePlan) {
    const daysLeft = getDaysLeft(activePlan.end_date);
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              {t('daily_focus.plan_active')}
            </p>
            <p className="text-sm text-muted-foreground">
              {activePlan.title} — {t('daily_focus.plan_days_left', { days: daysLeft })}
            </p>
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

  // Balanced (net balance ~0)
  if (Math.abs(netBalance) < 1) {
    return (
      <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t('daily_focus.balanced')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('daily_focus.balanced_sub')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: light step
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-5">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {t('daily_focus.no_plan')}
          </p>
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
