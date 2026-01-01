import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminUserActions } from "@/hooks/useAdminUserActions";
import { Loader2, Plus, Minus } from "lucide-react";

interface ManageCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  operation: 'grant' | 'deduct';
}

export function ManageCreditsDialog({ open, onOpenChange, userId, userName, operation }: ManageCreditsDialogProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const { manageCredits } = useAdminUserActions();

  const handleSubmit = async () => {
    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!reason.trim()) return;

    await manageCredits.mutateAsync({
      userId,
      amount: parsedAmount,
      operation,
      reason: reason.trim()
    });
    
    setAmount("");
    setReason("");
    onOpenChange(false);
  };

  const isGrant = operation === 'grant';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isGrant ? <Plus className="h-5 w-5 text-green-600" /> : <Minus className="h-5 w-5 text-orange-600" />}
            {isGrant ? "منح نقاط" : "سحب نقاط"}
          </DialogTitle>
          <DialogDescription>
            {isGrant ? "منح نقاط لـ" : "سحب نقاط من"} {userName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">عدد النقاط</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="أدخل عدد النقاط"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">السبب</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="أدخل سبب العملية (مطلوب)"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={manageCredits.isPending || !amount || !reason.trim()}
            variant={isGrant ? "default" : "destructive"}
          >
            {manageCredits.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {isGrant ? "منح النقاط" : "سحب النقاط"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
