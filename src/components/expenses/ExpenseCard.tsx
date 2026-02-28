import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Receipt, Trash2, Pencil, Coins, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { MyExpense } from "@/hooks/useMyExpenses";
import { useExpenseActions } from "@/hooks/useExpenseActions";
import { EditExpenseDialog } from "@/components/group/EditExpenseDialog";
import { ZeroCreditsPaywall } from "@/components/credits/ZeroCreditsPaywall";
import { useUsageCredits } from "@/hooks/useUsageCredits";

interface ExpenseCardProps {
  expense: MyExpense;
  onViewDetails?: (expense: MyExpense) => void;
  currentUserId?: string;
  onExpenseDeleted?: () => void;
}

export const ExpenseCard = ({ expense, onViewDetails, currentUserId, onExpenseDeleted }: ExpenseCardProps) => {
  const { t, i18n } = useTranslation('expenses');
  const { deleteExpense, deleting, deleteCost } = useExpenseActions();
  const { balance } = useUsageCredits();
  const isArabic = i18n.language === 'ar';
  const dateLocale = isArabic ? ar : enUS;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'rejected': return 'bg-muted text-muted-foreground border-muted';
      case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return t('status.approved');
      case 'rejected': return t('status.rejected');
      case 'pending': return t('status.pending');
      default: return status;
    }
  };

  const isPayer = expense.payer_id === currentUserId;
  const userSplit = expense.splits.find(split => split.member_id === currentUserId);
  const shareAmount = userSplit?.share_amount || 0;
  const netAmount = isPayer ? expense.amount - shareAmount : -shareAmount;
  const canEdit = (expense.created_by === currentUserId || isPayer) && 
                  (expense.status === 'pending' || expense.status === 'rejected');
  const canDelete = canEdit;

  const handleDelete = async () => {
    const result = await deleteExpense(expense.id);
    if (result.success && onExpenseDeleted) {
      onExpenseDeleted();
    } else if (result.needsPaywall) {
      setShowPaywall(true);
    }
  };

  return (
    <Card 
      className="transition-all duration-200 hover:shadow-card hover:border-primary/30 bg-card/50 backdrop-blur-sm cursor-pointer"
      onClick={() => onViewDetails?.(expense)}
    >
      <CardContent className="p-3">
        {/* Row 1: Badge + Amount + Chevron */}
        <div className="flex items-center justify-between mb-1.5">
          <Badge variant="outline" className={`${getStatusBadgeClass(expense.status)} text-[10px] px-1.5 py-0`}>
            {getStatusText(expense.status)}
          </Badge>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-foreground">
              {expense.amount.toLocaleString()} {expense.currency}
            </span>
            <ChevronLeft className="h-4 w-4 text-muted-foreground rtl:rotate-0 ltr:rotate-180" />
          </div>
        </div>

        {/* Row 2: Icon + Title + Group/Date */}
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 mt-0.5">
            {expense.category_icon ? (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm">{expense.category_icon}</span>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground line-clamp-1">
              {expense.description || expense.note_ar || t('card.no_description')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <span className="truncate">{expense.group_name}</span>
              <span>·</span>
              <Calendar className="h-2.5 w-2.5 shrink-0 inline" />
              <span>{format(new Date(expense.spent_at), 'dd MMM', { locale: dateLocale })}</span>
            </p>
          </div>
        </div>

        {/* Row 3: Your share (single line) */}
        {shareAmount > 0 && (
          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/30 text-xs">
            <span className="text-muted-foreground">{t('card.your_share')}</span>
            <span className={`font-semibold ${netAmount > 0 ? 'text-success' : 'text-destructive'}`}>
              {netAmount > 0 ? '+' : ''}{netAmount.toLocaleString()} {expense.currency}
            </span>
          </div>
        )}

        {/* Action buttons - small, low prominence */}
        {(canEdit || canDelete) && (
          <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-primary opacity-70"
              >
                <Pencil className="h-3 w-3 me-1" />
                {t('card.edit')}
              </Button>
            )}
            
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive opacity-70"
                    disabled={deleting}
                  >
                    <Trash2 className="h-3 w-3 me-1" />
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-destructive/10 border-destructive/20">
                      <Coins className="w-2 h-2 ms-0.5" />
                      {deleteCost}
                    </Badge>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('card.delete_confirm_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('card.delete_confirm_desc')}
                      <br />
                      <strong>{expense.description || expense.note_ar || t('card.no_description')}</strong>
                      <br />
                      {t('details.amount')}: {expense.amount.toLocaleString()} {expense.currency}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {isArabic ? `سيتم خصم ${deleteCost} نقطة` : `${deleteCost} credit will be deducted`}
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleting}
                    >
                      {deleting ? t('card.deleting') : t('card.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Edit Expense Dialog */}
      <EditExpenseDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        expense={{
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          spent_at: expense.spent_at,
          payer_id: expense.payer_id,
          status: expense.status as "pending" | "approved" | "rejected",
          currency: expense.currency,
          note_ar: expense.note_ar
        }}
        onUpdated={() => {
          if (onExpenseDeleted) onExpenseDeleted();
        }}
      />
      
      {/* Zero Credits Paywall */}
      <ZeroCreditsPaywall
        open={showPaywall}
        onOpenChange={setShowPaywall}
        currentBalance={balance?.totalAvailable || 0}
        actionName={isArabic ? "حذف المصروف" : "Delete Expense"}
        requiredCredits={deleteCost}
      />
    </Card>
  );
};
