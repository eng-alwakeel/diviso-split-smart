import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ExpenseRow {
  id: string;
  description: string | null;
  amount: number;
  spent_at: string | null;
  payer_id: string | null;
  status: "pending" | "approved" | "rejected";
  currency: string;
  note_ar: string | null;
}

interface RejectionReason {
  rejection_reason: string | null;
  rejected_at: string;
  rejected_by: string;
}

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: ExpenseRow | null;
  onUpdated: () => void;
}

export const EditExpenseDialog = ({
  open,
  onOpenChange,
  expense,
  onUpdated,
}: EditExpenseDialogProps) => {
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<RejectionReason | null>(null);

  useEffect(() => {
    if (open && expense) {
      setDescription(expense.description || "");
      setAmount(expense.amount.toString());
      setNote(expense.note_ar || "");
      
      // Fetch rejection reason if expense is rejected
      if (expense.status === "rejected") {
        supabase
          .from("expense_rejections")
          .select("rejection_reason, rejected_at, rejected_by")
          .eq("expense_id", expense.id)
          .order("rejected_at", { ascending: false })
          .limit(1)
          .maybeSingle()
          .then(({ data }) => {
            setRejectionReason(data);
          });
      }
    }
  }, [open, expense]);

  const handleSubmit = async () => {
    if (!expense) return;
    
    const trimmedDescription = description.trim();
    const parsedAmount = parseFloat(amount);
    
    if (!trimmedDescription || !parsedAmount || parsedAmount <= 0) {
      toast({
        title: "بيانات غير صحيحة",
        description: "يرجى التأكد من إدخال وصف صحيح ومبلغ أكبر من صفر.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          description: trimmedDescription,
          amount: parsedAmount,
          note_ar: note.trim() || null,
          status: "pending", // Reset to pending when resubmitting
          updated_at: new Date().toISOString()
        })
        .eq("id", expense.id);

      if (error) throw error;

      toast({
        title: "تم تحديث المصروف",
        description: expense.status === "rejected" 
          ? "تم إعادة تقديم المصروف للمراجعة."
          : "تم حفظ التغييرات بنجاح."
      });
      
      onOpenChange(false);
      onUpdated();
    } catch (error: any) {
      console.error("[EditExpenseDialog] update error:", error);
      toast({
        title: "تعذر تحديث المصروف",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {expense?.status === "rejected" ? "تعديل وإعادة تقديم المصروف" : "تعديل المصروف"}
          </DialogTitle>
          <DialogDescription>
            {expense?.status === "rejected" 
              ? "يمكنك تعديل المصروف وإعادة تقديمه للمراجعة مرة أخرى."
              : "تعديل تفاصيل المصروف."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Show rejection reason if available */}
          {expense?.status === "rejected" && rejectionReason && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <h4 className="text-sm font-semibold text-destructive mb-2">سبب الرفض:</h4>
              <p className="text-sm text-muted-foreground">
                {rejectionReason.rejection_reason || "لم يتم توضيح سبب الرفض"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                تم الرفض في: {new Date(rejectionReason.rejected_at).toLocaleDateString('ar-SA')}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">الوصف *</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف المصروف"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">ملاحظات (اختياري)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              variant="hero"
            >
              {submitting 
                ? "جاري الحفظ..." 
                : expense?.status === "rejected" 
                  ? "إعادة تقديم" 
                  : "حفظ التغييرات"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};