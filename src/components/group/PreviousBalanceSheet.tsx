import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Scale } from "lucide-react";

interface MemberOption {
  user_id: string;
  name: string;
}

interface PreviousBalanceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  currentUserId: string;
  members: MemberOption[];
  currency: string;
  onCreated?: () => void;
}

export const PreviousBalanceSheet = ({
  open,
  onOpenChange,
  groupId,
  currentUserId,
  members,
  currency,
  onCreated,
}: PreviousBalanceSheetProps) => {
  const { toast } = useToast();
  const [fromUserId, setFromUserId] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = fromUserId && toUserId && fromUserId !== toUserId && Number(amount) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // Insert as a legacy_balance settlement
      const { data: settlement, error: sErr } = await supabase.from("settlements").insert({
        group_id: groupId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount: Number(amount),
        note: description || "رصيد سابق",
        created_by: currentUserId,
        settlement_type: "legacy_balance",
        status: "confirmed",
      }).select("id").single();

      if (sErr) throw sErr;

      // Post chat message
      await supabase.from("messages").insert({
        group_id: groupId,
        sender_id: currentUserId,
        content: `💰 رصيد سابق — ${members.find(m => m.user_id === fromUserId)?.name} مدين لـ ${members.find(m => m.user_id === toUserId)?.name} بـ ${Number(amount).toLocaleString()} ${currency}`,
        message_type: "settlement_announcement",
        settlement_id: settlement.id,
      });

      toast({ title: "تم إضافة الرصيد السابق" });
      onOpenChange(false);
      setFromUserId("");
      setToUserId("");
      setAmount("");
      setDescription("");
      onCreated?.();
    } catch (err: any) {
      toast({ title: "تعذر الإضافة", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            إضافة رصيد سابق
          </DialogTitle>
          <DialogDescription>
            سجّل ديون سابقة بين الأعضاء (قبل استخدام Diviso)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>المدين (عليه مبلغ)</Label>
            <Select value={fromUserId} onValueChange={setFromUserId}>
              <SelectTrigger><SelectValue placeholder="اختر المدين" /></SelectTrigger>
              <SelectContent className="z-[1100]">
                {members.map(m => (
                  <SelectItem key={m.user_id} value={m.user_id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>الدائن (له مبلغ)</Label>
            <Select value={toUserId} onValueChange={setToUserId}>
              <SelectTrigger><SelectValue placeholder="اختر الدائن" /></SelectTrigger>
              <SelectContent>
                {members.filter(m => m.user_id !== fromUserId).map(m => (
                  <SelectItem key={m.user_id} value={m.user_id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>المبلغ ({currency})</Label>
            <Input type="number" inputMode="decimal" min="0" step="0.01"
              value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <Label>وصف (اختياري)</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="مثال: ديون رحلة العام الماضي" />
          </div>
        </div>

        <Button variant="hero" onClick={handleSubmit} disabled={!canSubmit || submitting} className="w-full">
          {submitting ? "جاري الحفظ..." : "إضافة الرصيد السابق"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
