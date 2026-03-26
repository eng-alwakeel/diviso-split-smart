import { Badge } from "@/components/ui/badge";
import { Check, Lock, Pencil, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { icon: Pencil, variant: 'secondary' },
  planning: { icon: Play, variant: 'outline' },
  locked: { icon: Lock, variant: 'default' },
  done: { icon: Check, variant: 'default' },
  canceled: { icon: Pencil, variant: 'destructive' },
};

interface PlanStatusBarProps {
  currentStatus: string;
}

export function PlanStatusBar({ currentStatus }: PlanStatusBarProps) {
  const { t } = useTranslation('plans');
  const config = statusConfig[currentStatus] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="text-xs gap-1">
      <Icon className="w-3 h-3" />
      {t(`status.${currentStatus}`)}
    </Badge>
  );
}
