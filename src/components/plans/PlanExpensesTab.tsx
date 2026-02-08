import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, ArrowRightLeft, Receipt, Wallet } from "lucide-react";
import { usePlanExpenses } from "@/hooks/usePlanExpenses";
import { PlanExpenseCard } from "./PlanExpenseCard";
import { LinkExpenseDialog } from "./LinkExpenseDialog";

interface PlanExpensesTabProps {
  planId: string;
  isAdmin: boolean;
  groupId: string | null;
  budgetValue: number | null;
  budgetCurrency: string;
}

export const PlanExpensesTab = ({
  planId,
  isAdmin,
  groupId,
  budgetValue,
  budgetCurrency,
}: PlanExpensesTabProps) => {
  const { t } = useTranslation('plans');
  const navigate = useNavigate();
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const {
    expenses,
    stats,
    isLoading,
    linkExpense,
    unlinkExpense,
    isLinking,
    isUnlinking,
  } = usePlanExpenses(planId);

  const hasBudget = budgetValue != null && budgetValue > 0;
  const progress = hasBudget ? (stats.totalSpent / budgetValue!) * 100 : 0;

  const getProgressColor = () => {
    if (progress > 100) return "bg-destructive";
    if (progress > 75) return "bg-yellow-500";
    return "bg-primary";
  };

  const handleAddExpense = () => {
    const params = new URLSearchParams();
    params.set('planId', planId);
    if (groupId) params.set('groupId', groupId);
    navigate(`/add-expense?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <Card className="border border-border">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats & Budget */}
      <Card className="border border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{t('expenses_tab.total')}</span>
            </div>
            <span className="text-sm font-bold">
              {stats.totalSpent.toLocaleString()} {budgetCurrency}
            </span>
          </div>

          {hasBudget && (
            <div className="space-y-1.5">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor()}`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {t('expenses_tab.budget_progress', {
                    spent: stats.totalSpent.toLocaleString(),
                    budget: budgetValue!.toLocaleString(),
                    currency: budgetCurrency,
                  })}
                </span>
                {progress > 100 ? (
                  <span className="text-destructive font-medium">
                    {t('expenses_tab.over_budget')}
                  </span>
                ) : (
                  <span>
                    {t('expenses_tab.budget_remaining', {
                      remaining: (budgetValue! - stats.totalSpent).toLocaleString(),
                      currency: budgetCurrency,
                    })}
                  </span>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {t('expenses_tab.count', { count: stats.count })}
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        {groupId && (
          <Button size="sm" onClick={handleAddExpense} className="flex-1">
            <Plus className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
            {t('expenses_tab.add_expense')}
          </Button>
        )}
        {groupId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLinkDialog(true)}
            className="flex-1"
          >
            <ArrowRightLeft className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
            {t('expenses_tab.link_expense')}
          </Button>
        )}
      </div>

      {/* Expense List */}
      {expenses.length === 0 ? (
        <Card className="border border-border">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">{t('expenses_tab.empty')}</p>
            <p className="text-xs mt-1">{t('expenses_tab.empty_desc')}</p>
            {!groupId && (
              <p className="text-xs mt-3 text-muted-foreground/70">
                {t('expenses_tab.needs_group')}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <PlanExpenseCard
              key={expense.id}
              expense={expense}
              isAdmin={isAdmin}
              onUnlink={(id) => unlinkExpense(id)}
              isUnlinking={isUnlinking}
            />
          ))}
        </div>
      )}

      {/* Link Expense Dialog */}
      <LinkExpenseDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        planId={planId}
        groupId={groupId}
        onLink={(expenseId, pId) => linkExpense({ expenseId, planId: pId })}
        isLinking={isLinking}
      />
    </div>
  );
};
