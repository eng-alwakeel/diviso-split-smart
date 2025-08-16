import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RejectExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: string | null;
  expenseDescription: string;
  onRejected: () => void;
}

export const RejectExpenseDialog = ({
  open,
  onOpenChange,
  expenseId,
  expenseDescription,
  onRejected,
}: RejectExpenseDialogProps) => {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReject = async () => {
    if (!expenseId) return;

    setSubmitting(true);
    
    try {
      // First, update the expense status to rejected
      const { error: updateError } = await supabase
        .from("expenses")
        .update({ status: "rejected" })
        .eq("id", expenseId);

      if (updateError) throw updateError;

      // Then, record the rejection reason if provided
      if (reason.trim()) {
        const { data: session } = await supabase.auth.getSession();
        if (session.session?.user?.id) {
          const { error: reasonError } = await supabase
            .from("expense_rejections")
            .insert({
              expense_id: expenseId,
              rejected_by: session.session.user.id,
              rejection_reason: reason.trim()
            });

          if (reasonError) {
            console.error("Failed to save rejection reason:", reasonError);
            // Don't fail the whole operation if reason saving fails
          }
        }
      }

      toast({
        title: "تم رفض المصروف",
        description: "تم إشعار صاحب المصروف بالرفض."
      });
      
      onOpenChange(false);
      onRejected();
      setReason(""); // Reset form
    } catch (error: any) {
      console.error("[RejectExpenseDialog] reject error:", error);
      toast({
        title: "تعذر رفض المصروف",
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
          <DialogTitle>رفض المصروف</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من رفض مصروف "{expenseDescription}"؟
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">سبب الرفض (اختياري)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب سبب رفض هذا المصروف..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              سيتم إرسال هذا السبب لصاحب المصروف لمساعدته في تصحيح الأخطاء.
            </p>
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
              onClick={handleReject}
              disabled={submitting}
              variant="destructive"
            >
              {submitting ? "جاري الرفض..." : "رفض المصروف"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};