import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Loader2, Pencil } from "lucide-react";
import { DayCard } from "./DayCard";
import { usePlanItinerary } from "@/hooks/usePlanItinerary";

interface PlanItineraryTabProps {
  planId: string;
  isAdmin: boolean;
  hasDates: boolean;
  groupId: string | null;
}

export function PlanItineraryTab({ planId, isAdmin, hasDates, groupId }: PlanItineraryTabProps) {
  const { t } = useTranslation("plans");
  const navigate = useNavigate();

  const {
    days, isLoading, ensureDays,
    addActivity, isAddingActivity,
    updateActivity, isUpdating,
    deleteActivity,
    generateSuggestions, isGenerating,
    convertToVote,
    linkExpense,
  } = usePlanItinerary(planId);

  // Ensure days exist when tab loads and dates are available
  useEffect(() => {
    if (hasDates && days.length === 0 && !isLoading) {
      ensureDays().catch(() => {});
    }
  }, [hasDates, days.length, isLoading]);

  if (!hasDates) {
    return (
      <Card className="border border-border">
        <CardContent className="p-8 text-center space-y-4">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("itinerary.no_dates")}</p>
          <Button variant="outline" size="sm" onClick={() => navigate(`/plans`)}>
            <Pencil className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            {t("itinerary.edit_plan")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {days.map((day) => (
        <DayCard
          key={day.id}
          day={day}
          planId={planId}
          groupId={groupId}
          isAdmin={isAdmin}
          isGenerating={isGenerating}
          onAddActivity={(dayId, data) => addActivity({ dayId, data })}
          onUpdateActivity={(activityId, data) => updateActivity({ activityId, data })}
          onDeleteActivity={deleteActivity}
          onGenerateSuggestions={(dayId) => generateSuggestions({ dayId })}
          onConvertToVote={async (a) => { await convertToVote(a); }}
          onLinkExpense={(activityId, expenseId) => linkExpense({ activityId, expenseId })}
          isAddingActivity={isAddingActivity}
          isUpdating={isUpdating}
        />
      ))}
    </div>
  );
}
