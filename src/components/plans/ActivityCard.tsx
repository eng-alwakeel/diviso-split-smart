import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MoreVertical, Vote, Receipt, Lock, Unlock, Trash2,
  Pencil, Users, Sparkles, DollarSign,
} from "lucide-react";
import type { PlanDayActivity } from "@/hooks/usePlanItinerary";

interface ActivityCardProps {
  activity: PlanDayActivity;
  isAdmin: boolean;
  onEdit: (activity: PlanDayActivity) => void;
  onConvertToVote: (activity: PlanDayActivity) => void;
  onLinkExpense: (activity: PlanDayActivity) => void;
  onToggleLock: (activity: PlanDayActivity) => void;
  onDelete: (activityId: string) => void;
}

const statusVariant: Record<string, "secondary" | "info" | "success"> = {
  idea: "secondary",
  proposed: "info",
  locked: "success",
};

const timeSlotOrder = ["morning", "afternoon", "evening", "any"];

export function ActivityCard({
  activity,
  isAdmin,
  onEdit,
  onConvertToVote,
  onLinkExpense,
  onToggleLock,
  onDelete,
}: ActivityCardProps) {
  const { t } = useTranslation("plans");

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{activity.title}</span>
          <Badge variant={statusVariant[activity.status] || "secondary"} className="text-[10px] px-1.5 py-0">
            {t(`itinerary.activity_status.${activity.status}`)}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {t(`itinerary.time_slots.${activity.time_slot}`)}
          </Badge>
          {activity.created_by === "ai" && (
            <Sparkles className="w-3 h-3 text-primary" />
          )}
        </div>

        {activity.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
          {activity.estimated_cost != null && (
            <span className="flex items-center gap-0.5">
              <DollarSign className="w-3 h-3" />
              {activity.estimated_cost} {activity.currency}
            </span>
          )}
          {activity.participant_scope === "custom" && (
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              {t("itinerary.add_activity_dialog.custom")}
            </span>
          )}
          {activity.linked_vote_id && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
              <Vote className="w-2.5 h-2.5" />
              {t("itinerary.activity_actions.convert_to_vote")}
            </Badge>
          )}
          {activity.linked_expense_id && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
              <Receipt className="w-2.5 h-2.5" />
              {t("itinerary.activity_actions.link_expense")}
            </Badge>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onEdit(activity)}>
            <Pencil className="w-3.5 h-3.5 ltr:mr-2 rtl:ml-2" />
            {t("itinerary.activity_actions.edit")}
          </DropdownMenuItem>
          {!activity.linked_vote_id && (
            <DropdownMenuItem onClick={() => onConvertToVote(activity)}>
              <Vote className="w-3.5 h-3.5 ltr:mr-2 rtl:ml-2" />
              {t("itinerary.activity_actions.convert_to_vote")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onLinkExpense(activity)}>
            <Receipt className="w-3.5 h-3.5 ltr:mr-2 rtl:ml-2" />
            {t("itinerary.activity_actions.link_expense")}
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleLock(activity)}>
                {activity.status === "locked" ? (
                  <Unlock className="w-3.5 h-3.5 ltr:mr-2 rtl:ml-2" />
                ) : (
                  <Lock className="w-3.5 h-3.5 ltr:mr-2 rtl:ml-2" />
                )}
                {activity.status === "locked"
                  ? t("itinerary.activity_actions.unlock")
                  : t("itinerary.activity_actions.lock")}
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5 ltr:mr-2 rtl:ml-2" />
                    {t("itinerary.activity_actions.delete")}
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("itinerary.activity_actions.delete_confirm")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("itinerary.activity_actions.delete_confirm_desc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("create.back")}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(activity.id)}>
                      {t("itinerary.activity_actions.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
