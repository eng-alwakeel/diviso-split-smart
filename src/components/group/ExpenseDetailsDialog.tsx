import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, Calendar, User, FileText, CheckCircle, XCircle, Users, CreditCard } from "lucide-react";
import { RejectExpenseDialog } from "./RejectExpenseDialog";

interface ExpenseRow {
  id: string;
  description: string | null;
  amount: number;
  spent_at: string | null;
  payer_id: string | null;
  status: "pending" | "approved" | "rejected";
  currency: string;
  note_ar: string | null;
  category_id: string | null;
  created_at: string;
}

interface ExpenseSplit {
  member_id: string;
  share_amount: number;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  name: string | null;
  avatar_url: string | null;
}

interface ExpenseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: ExpenseRow | null;
  profiles: Record<string, ProfileRow>;
  canApprove: boolean;
  onApprove: (expenseId: string, action: "approve" | "reject") => void;
}

export const ExpenseDetailsDialog = ({
  open,
  onOpenChange,
  expense,
  profiles,
  canApprove,
  onApprove,
}: ExpenseDetailsDialogProps) => {
  const { toast } = useToast();
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    if (open && expense) {
      fetchExpenseSplits();
    }
  }, [open, expense]);

  const fetchExpenseSplits = async () => {
    if (!expense) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("expense_splits")
        .select("member_id, share_amount")
        .eq("expense_id", expense.id);

      if (error) throw error;
      setSplits(data || []);
    } catch (error: any) {
      console.error("[ExpenseDetailsDialog] fetch splits error:", error);
      toast({
        title: "خطأ في تحميل التفاصيل",
        description: "تعذر تحميل تفاصيل تقسيم المصروف",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: "approve" | "reject") => {
    if (!expense) return;
    onApprove(expense.id, action);
    onOpenChange(false);
  };

  if (!expense) return null;

  const payerProfile = expense.payer_id ? profiles[expense.payer_id] : null;
  const payerName = payerProfile?.display_name || payerProfile?.name || "عضو";
  const totalSplitAmount = splits.reduce((sum, split) => sum + Number(split.share_amount), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-accent" />
            تفاصيل المصروف
          </DialogTitle>
          <DialogDescription>
            مراجعة تفاصيل المصروف وطريقة التقسيم قبل اتخاذ القرار
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {expense.description || "مصروف"}
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(expense.spent_at || expense.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>دفع بواسطة {payerName}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-accent">
                    {Number(expense.amount).toLocaleString()}
                    <span className="text-lg font-medium text-muted-foreground mr-1">
                      {expense.currency || "SAR"}
                    </span>
                  </div>
                  <Badge variant={expense.status === "pending" ? "secondary" : expense.status === "approved" ? "default" : "destructive"}>
                    {expense.status === "pending" ? "في انتظار الموافقة" : 
                     expense.status === "approved" ? "مُعتمد" : "مرفوض"}
                  </Badge>
                </div>
              </div>

              {expense.note_ar && (
                <div className="border-t pt-3">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">ملاحظات:</p>
                      <p className="text-sm text-muted-foreground">{expense.note_ar}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Splits */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-accent" />
                <h4 className="text-lg font-semibold">تقسيم المصروف</h4>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">جاري تحميل التفاصيل...</p>
              ) : splits.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد تفاصيل تقسيم متاحة</p>
              ) : (
                <div className="space-y-3">
                  {splits.map((split) => {
                    const memberProfile = profiles[split.member_id];
                    const memberName = memberProfile?.display_name || memberProfile?.name || "عضو";
                    const splitPercentage = totalSplitAmount > 0 ? (Number(split.share_amount) / totalSplitAmount * 100) : 0;

                    return (
                      <div key={split.member_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={memberProfile?.avatar_url || ""} />
                            <AvatarFallback className="bg-accent/20 text-accent">
                              {memberName.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{memberName}</p>
                            <p className="text-xs text-muted-foreground">
                              {splitPercentage.toFixed(1)}% من إجمالي المصروف
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-accent">
                            {Number(split.share_amount).toLocaleString()}
                            <span className="text-sm font-normal text-muted-foreground mr-1">
                              {expense.currency || "SAR"}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Total verification */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">إجمالي التقسيم:</span>
                      <span className={`font-medium ${Math.abs(totalSplitAmount - Number(expense.amount)) < 0.01 ? 'text-accent' : 'text-destructive'}`}>
                        {totalSplitAmount.toLocaleString()} {expense.currency || "SAR"}
                      </span>
                    </div>
                    {Math.abs(totalSplitAmount - Number(expense.amount)) >= 0.01 && (
                      <p className="text-xs text-destructive mt-1">
                        ⚠️ إجمالي التقسيم لا يطابق مبلغ المصروف
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons for Pending Expenses */}
          {expense.status === "pending" && canApprove && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => handleAction("approve")}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                size="lg"
              >
                <CheckCircle className="w-5 h-5 ml-2" />
                اعتماد المصروف
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                <XCircle className="w-5 h-5 ml-2" />
                رفض المصروف
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Reject Expense Dialog */}
      <RejectExpenseDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        expenseId={expense?.id || null}
        expenseDescription={expense?.description || "مصروف"}
        onRejected={() => {
          onOpenChange(false);
          // Trigger parent refresh by calling onApprove with a refresh signal
          onApprove(expense.id, "reject");
        }}
      />
    </Dialog>
  );
};