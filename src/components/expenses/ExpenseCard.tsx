import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, DollarSign, Users, MapPin, MessageSquare, Receipt, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { MyExpense } from "@/hooks/useMyExpenses";
import { useExpenseActions } from "@/hooks/useExpenseActions";
import { EditExpenseDialog } from "@/components/group/EditExpenseDialog";

interface ExpenseCardProps {
  expense: MyExpense;
  onViewDetails?: (expense: MyExpense) => void;
  currentUserId?: string;
  onExpenseDeleted?: () => void;
}

export const ExpenseCard = ({ expense, onViewDetails, currentUserId, onExpenseDeleted }: ExpenseCardProps) => {
  const { t, i18n } = useTranslation('expenses');
  const { deleteExpense, deleting } = useExpenseActions();
  const isArabic = i18n.language === 'ar';
  const dateLocale = isArabic ? ar : enUS;
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success border-success/20 hover:bg-success/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20 hover:bg-muted/20';
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
  const canEdit = (expense.created_by === currentUserId || isPayer) && 
                  (expense.status === 'pending' || expense.status === 'rejected');
  const canDelete = canEdit;

  const handleDelete = async () => {
    const success = await deleteExpense(expense.id);
    if (success && onExpenseDeleted) {
      onExpenseDeleted();
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-card hover:border-primary/30 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-3 sm:p-4">
        {/* Header: Status badge on its own row for mobile */}
        <div className="flex justify-end mb-2">
          <Badge variant="outline" className={`${getStatusColor(expense.status)} whitespace-nowrap text-xs`}>
            {getStatusText(expense.status)}
          </Badge>
        </div>
        
        {/* Main content row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0">
            {expense.category_icon ? (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-base sm:text-lg">{expense.category_icon}</span>
              </div>
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm sm:text-base line-clamp-2">
              {expense.description || expense.note_ar || t('card.no_description')}
            </h3>
            
            {/* Group and category on separate lines for mobile */}
            <div className="flex flex-col gap-0.5 mt-1 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{expense.group_name}</span>
              </div>
              {expense.category_name && (
                <span className="truncate text-xs text-muted-foreground/80 ps-4">
                  {expense.category_name}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>
                {format(new Date(expense.spent_at), 'dd MMM yyyy', { locale: dateLocale })}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {/* Amount and members row - improved for mobile */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium whitespace-nowrap">
                {expense.amount.toLocaleString()} {expense.currency}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
              <Users className="h-3 w-3 shrink-0" />
              <span className="whitespace-nowrap">{expense.splits.length} {t('card.members')}</span>
            </div>
          </div>

          {/* User's financial involvement */}
          <div className="bg-gradient-card rounded-lg p-2 sm:p-3 space-y-1 border border-border/30">
            {isPayer && (
              <div className="flex justify-between gap-2 text-xs sm:text-sm">
                <span className="text-muted-foreground shrink-0">{t('card.paid')}</span>
                <span className="font-medium text-primary whitespace-nowrap">
                  +{expense.amount.toLocaleString()} {expense.currency}
                </span>
              </div>
            )}
            
            {shareAmount > 0 && (
              <div className="flex justify-between gap-2 text-xs sm:text-sm">
                <span className="text-muted-foreground shrink-0">{t('card.your_share')}</span>
                <span className="font-medium text-destructive whitespace-nowrap">
                  -{shareAmount.toLocaleString()} {expense.currency}
                </span>
              </div>
            )}
            
            {isPayer && shareAmount > 0 && (
              <div className="flex justify-between gap-2 text-xs sm:text-sm border-t border-border pt-1">
                <span className="text-muted-foreground shrink-0">{t('card.net')}</span>
                <span className={`font-medium whitespace-nowrap ${
                  (expense.amount - shareAmount) > 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {(expense.amount - shareAmount) > 0 ? '+' : ''}
                  {(expense.amount - shareAmount).toLocaleString()} {expense.currency}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(expense)}
              className="flex-1"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              {t('card.view_details')}
            </Button>
            
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="text-primary hover:bg-primary/10"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    disabled={deleting}
                  >
                    <Trash2 className="h-3 w-3" />
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
        </div>
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
          if (onExpenseDeleted) onExpenseDeleted(); // Refresh the list
        }}
      />
    </Card>
  );
};