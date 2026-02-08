import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Unlink } from "lucide-react";
import { format } from "date-fns";
import type { PlanExpense } from "@/hooks/usePlanExpenses";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PlanExpenseCardProps {
  expense: PlanExpense;
  isAdmin: boolean;
  onUnlink: (expenseId: string) => void;
  isUnlinking: boolean;
  onClick?: () => void;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
};

export const PlanExpenseCard = ({
  expense,
  isAdmin,
  onUnlink,
  isUnlinking,
  onClick,
}: PlanExpenseCardProps) => {
  const { t } = useTranslation('plans');
  const { t: tExp } = useTranslation('expenses');

  const payerName =
    expense.payer_profile?.display_name ||
    expense.payer_profile?.name ||
    '';

  return (
    <Card
      className="border border-border cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-3 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {expense.description || tExp('no_description')}
            </p>
            <Badge variant={statusVariant[expense.status] || "outline"} className="text-[10px] shrink-0">
              {tExp(`status.${expense.status}`)}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {payerName && <span className="truncate">{payerName}</span>}
            <span className="flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3" />
              {format(new Date(expense.spent_at), 'dd/MM')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold whitespace-nowrap">
            {Number(expense.amount).toLocaleString()} {expense.currency}
          </span>

          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Unlink className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('expenses_tab.unlink_confirm')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('expenses_tab.unlink_confirm_desc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('create.back')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onUnlink(expense.id)}
                    disabled={isUnlinking}
                  >
                    {t('expenses_tab.unlink_expense')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
