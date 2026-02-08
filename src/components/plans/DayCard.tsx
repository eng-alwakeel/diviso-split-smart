import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ActivityCard } from "./ActivityCard";
import { AddActivityDialog } from "./AddActivityDialog";
import { EditActivityDialog } from "./EditActivityDialog";
import { LinkActivityExpenseDialog } from "./LinkActivityExpenseDialog";
import type { PlanDay, PlanDayActivity, AddActivityData } from "@/hooks/usePlanItinerary";

interface DayCardProps {
  day: PlanDay;
  planId: string;
  groupId: string | null;
  isAdmin: boolean;
  isGenerating: boolean;
  onAddActivity: (dayId: string, data: AddActivityData) => Promise<void>;
  onUpdateActivity: (activityId: string, data: Partial<AddActivityData & { status: string }>) => Promise<void>;
  onDeleteActivity: (activityId: string) => Promise<void>;
  onGenerateSuggestions: (dayId: string) => Promise<void>;
  onConvertToVote: (activity: PlanDayActivity) => Promise<void>;
  onLinkExpense: (activityId: string, expenseId: string) => Promise<void>;
  isAddingActivity: boolean;
  isUpdating: boolean;
}

const timeSlotGroups = ["morning", "afternoon", "evening", "any"] as const;

export function DayCard({
  day, planId, groupId, isAdmin, isGenerating,
  onAddActivity, onUpdateActivity, onDeleteActivity,
  onGenerateSuggestions, onConvertToVote, onLinkExpense,
  isAddingActivity, isUpdating,
}: DayCardProps) {
  const { t } = useTranslation("plans");
  const [showAdd, setShowAdd] = useState(false);
  const [editActivity, setEditActivity] = useState<PlanDayActivity | null>(null);
  const [linkExpenseActivity, setLinkExpenseActivity] = useState<PlanDayActivity | null>(null);

  const handleToggleLock = (activity: PlanDayActivity) => {
    const newStatus = activity.status === "locked" ? "idea" : "locked";
    onUpdateActivity(activity.id, { status: newStatus });
  };

  // Group activities by time_slot
  const groupedActivities = timeSlotGroups.reduce((acc, slot) => {
    const items = day.activities.filter((a) => a.time_slot === slot);
    if (items.length > 0) acc.push({ slot, items });
    return acc;
  }, [] as { slot: string; items: PlanDayActivity[] }[]);

  const hasActivities = day.activities.length > 0;

  return (
    <>
      <Card className="border border-border">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">
                {t("itinerary.day_title", { index: day.day_index })} — {format(new Date(day.date), "dd/MM/yyyy")}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setShowAdd(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                {t("itinerary.add_activity")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => onGenerateSuggestions(day.id)}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isGenerating ? t("itinerary.suggesting") : t("itinerary.suggest_activities")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {!hasActivities && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {t("itinerary.no_activities")}
            </p>
          )}

          {groupedActivities.map(({ slot, items }) => (
            <div key={slot} className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide px-1">
                {t(`itinerary.time_slots.${slot}`)}
              </p>
              {items.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isAdmin={isAdmin}
                  onEdit={setEditActivity}
                  onConvertToVote={onConvertToVote}
                  onLinkExpense={setLinkExpenseActivity}
                  onToggleLock={handleToggleLock}
                  onDelete={onDeleteActivity}
                />
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      <AddActivityDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onSave={(data) => onAddActivity(day.id, data)}
        isSaving={isAddingActivity}
      />

      <EditActivityDialog
        activity={editActivity}
        open={!!editActivity}
        onOpenChange={(open) => !open && setEditActivity(null)}
        onSave={(data) => editActivity ? onUpdateActivity(editActivity.id, data) : Promise.resolve()}
        isSaving={isUpdating}
      />

      <LinkActivityExpenseDialog
        activity={linkExpenseActivity}
        day={day}
        planId={planId}
        groupId={groupId}
        open={!!linkExpenseActivity}
        onOpenChange={(open) => !open && setLinkExpenseActivity(null)}
        onLink={onLinkExpense}
      />
    </>
  );
}
