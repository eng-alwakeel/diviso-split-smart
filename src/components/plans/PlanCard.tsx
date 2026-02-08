import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Coffee, Home, Zap, MapPin, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plan } from "@/hooks/usePlans";
import { format } from "date-fns";

const typeIcons: Record<string, React.ElementType> = {
  trip: Plane,
  outing: Coffee,
  shared_housing: Home,
  activity: Zap,
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  planning: "bg-primary/10 text-primary",
  locked: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  canceled: "bg-destructive/10 text-destructive",
};

export function PlanCard({ plan }: { plan: Plan }) {
  const navigate = useNavigate();
  const { t } = useTranslation('plans');
  const Icon = typeIcons[plan.plan_type] || Zap;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border border-border"
      onClick={() => navigate(`/plan/${plan.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">{plan.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(`plan_types.${plan.plan_type}`)}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className={`shrink-0 text-xs ${statusColors[plan.status] || ''}`}>
            {t(`status.${plan.status}`)}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          {plan.destination && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {plan.destination}
            </span>
          )}
          {plan.start_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(plan.start_date), 'dd/MM')}
              {plan.end_date && ` - ${format(new Date(plan.end_date), 'dd/MM')}`}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {plan.member_count || 1}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
