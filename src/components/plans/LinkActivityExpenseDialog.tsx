import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlanExpenses } from "@/hooks/usePlanExpenses";
import { Plus, Link2, Receipt, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { PlanDayActivity, PlanDay } from "@/hooks/usePlanItinerary";

interface LinkActivityExpenseDialogProps {
  activity: PlanDayActivity | null;
  day: PlanDay | null;
  planId: string;
  groupId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLink: (activityId: string, expenseId: string) => Promise<void>;
}

export function LinkActivityExpenseDialog({
  activity, day, planId, groupId, open, onOpenChange, onLink,
}: LinkActivityExpenseDialogProps) {
  const { t } = useTranslation("plans");
  const navigate = useNavigate();
  const { expenses } = usePlanExpenses(planId);
  const [linking, setLinking] = useState(false);

  if (!activity) return null;

  const handleCreateNew = () => {
    const params = new URLSearchParams();
    if (groupId) params.set("groupId", groupId);
    params.set("planId", planId);
    if (activity.title) params.set("title", activity.title);
    if (activity.estimated_cost != null) params.set("amount", String(activity.estimated_cost));
    if (day?.date) params.set("date", day.date);
    navigate(`/add-expense?${params.toString()}`);
    onOpenChange(false);
  };

  const handleLinkExisting = async (expenseId: string) => {
    setLinking(true);
    try {
      await onLink(activity.id, expenseId);
      onOpenChange(false);
    } finally {
      setLinking(false);
    }
  };

  // Filter expenses not already linked to an activity
  const availableExpenses = expenses.filter((e) => e.id !== activity.linked_expense_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("itinerary.link_expense_dialog.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {groupId && (
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleCreateNew}>
              <Plus className="w-4 h-4" />
              {t("itinerary.link_expense_dialog.create_new")}
            </Button>
          )}

          {availableExpenses.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                {t("itinerary.link_expense_dialog.link_existing")}
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {availableExpenses.map((exp) => (
                  <button
                    key={exp.id}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-accent/10 transition-colors text-start"
                    onClick={() => handleLinkExisting(exp.id)}
                    disabled={linking}
                  >
                    <Receipt className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{exp.description || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {exp.amount} {exp.currency} · {format(new Date(exp.spent_at), "dd/MM")}
                      </p>
                    </div>
                    {linking && <Loader2 className="w-3 h-3 animate-spin" />}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              {t("itinerary.link_expense_dialog.no_plan_expenses")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
