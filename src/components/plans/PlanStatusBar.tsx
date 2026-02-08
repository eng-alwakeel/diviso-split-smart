import { Button } from "@/components/ui/button";
import { Check, Lock, Pencil, Play, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const STATUSES = ['draft', 'planning', 'locked', 'done'] as const;

const statusIcons: Record<string, React.ElementType> = {
  draft: Pencil,
  planning: Play,
  locked: Lock,
  done: Check,
};

interface PlanStatusBarProps {
  currentStatus: string;
  isAdmin: boolean;
  onStatusChange: (status: string) => void;
  isUpdating: boolean;
}

export function PlanStatusBar({ currentStatus, isAdmin, onStatusChange, isUpdating }: PlanStatusBarProps) {
  const { t } = useTranslation('plans');

  const currentIdx = STATUSES.indexOf(currentStatus as typeof STATUSES[number]);

  const getNextAction = () => {
    if (currentStatus === 'canceled') return null;
    switch (currentStatus) {
      case 'draft': return { label: t('actions.start_planning'), status: 'planning' };
      case 'planning': return { label: t('actions.lock_plan'), status: 'locked' };
      case 'locked': return { label: t('actions.mark_done'), status: 'done' };
      default: return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <div className="space-y-3">
      {/* Status Steps */}
      <div className="flex items-center justify-between gap-1">
        {STATUSES.map((status, idx) => {
          const Icon = statusIcons[status];
          const isActive = idx <= currentIdx && currentStatus !== 'canceled';
          const isCurrent = status === currentStatus;

          return (
            <div key={status} className="flex items-center gap-1 flex-1">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors shrink-0",
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-muted bg-muted text-muted-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className={cn(
                "text-xs hidden sm:inline",
                isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
              )}>
                {t(`status.${status}`)}
              </span>
              {idx < STATUSES.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 mx-1",
                  idx < currentIdx && currentStatus !== 'canceled' ? "bg-primary/50" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      {isAdmin && currentStatus !== 'done' && currentStatus !== 'canceled' && (
        <div className="flex gap-2">
          {nextAction && (
            <Button
              size="sm"
              onClick={() => onStatusChange(nextAction.status)}
              disabled={isUpdating}
              className="flex-1"
            >
              {nextAction.label}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange('canceled')}
            disabled={isUpdating}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
            {t('actions.cancel_plan')}
          </Button>
        </div>
      )}
    </div>
  );
}
