import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Wand2, Trash2 } from "lucide-react";

export interface MemberRow {
  user_id: string;
  role: "owner" | "admin" | "member";
}

export interface ProfileRow {
  id: string;
  display_name?: string | null;
  name?: string | null;
}

export interface BalanceRow {
  user_id: string;
  net_balance: number | null;
}

interface RowState {
  to_user_id: string;
  amount: string; // keep as string for input, cast on submit
  note?: string;
}

interface GroupSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  currentUserId: string | null;
  members: MemberRow[];
  profiles: Record<string, ProfileRow>;
  balances: BalanceRow[];
  initialToUserId?: string;
  initialAmount?: number;
  onCreated?: () => void;
}

const formatName = (id: string, profiles: Record<string, ProfileRow>) => {
  const p = profiles[id];
  return (p?.display_name || p?.name || `${id.slice(0, 4)}...`);
};

export const GroupSettlementDialog = ({
  open,
  onOpenChange,
  groupId,
  currentUserId,
  members,
  profiles,
  balances,
  initialToUserId,
  initialAmount,
  onCreated,
}: GroupSettlementDialogProps) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<RowState[]>([{ to_user_id: initialToUserId || "", amount: initialAmount?.toString() || "", note: "" }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRows([{ to_user_id: initialToUserId || "", amount: initialAmount?.toString() || "", note: "" }]);
    }
  }, [open, initialToUserId, initialAmount]);

  const myNet = useMemo(() => {
    if (!currentUserId) return 0;
    return Number(balances.find(b => b.user_id === currentUserId)?.net_balance ?? 0);
  }, [balances, currentUserId]);

  const creditors = useMemo(() => {
    // users with positive net_balance
    return balances.filter(b => (Number(b.net_balance ?? 0) > 0) && b.user_id !== currentUserId);
  }, [balances, currentUserId]);

  const canSubmit = !!groupId && !!currentUserId && rows.every(r => r.to_user_id && Number(r.amount) > 0 && r.to_user_id !== currentUserId);

  const addRow = () => setRows(prev => [...prev, { to_user_id: "", amount: "", note: "" }]);
  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));

  const applySuggestions = () => {
    if (!currentUserId) return;
    const debt = Math.max(0, -myNet); // if I owe money
    if (debt <= 0) {
      toast({ title: "لا يوجد عليك دين", description: "رصيدك غير سالب، لا حاجة للتسوية.", variant: "default" });
      return;
    }
    let remaining = debt;
    const suggestions: RowState[] = [];
    for (const c of creditors) {
      if (remaining <= 0) break;
      const give = Math.min(remaining, Number(c.net_balance ?? 0));
      if (give > 0) {
        suggestions.push({ to_user_id: c.user_id, amount: give.toString(), note: "" });
        remaining -= give;
      }
    }
    if (suggestions.length === 0) {
      toast({ title: "لا يوجد دائنون", description: "لا يوجد أعضاء مستحق لهم حالياً.", variant: "default" });
      return;
    }
    setRows(suggestions);
  };

  const handleSubmit = async () => {
    try {
      if (!canSubmit) return;
      setSubmitting(true);
      const payload = rows.map(r => ({
        group_id: groupId!,
        from_user_id: currentUserId!,
        to_user_id: r.to_user_id,
        amount: Number(r.amount),
        note: r.note && r.note.trim() ? r.note.trim() : null,
        created_by: currentUserId!,
      }));
      const { error } = await supabase.from("settlements").insert(payload);
      if (error) {
        throw error;
      }
      toast({ title: "تمت إضافة التسوية", description: "تم تسجيل التحويلات بنجاح." });
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      console.error("[GroupSettlementDialog] insert error", err);
      toast({ title: "تعذر إضافة التسوية", description: err?.message || "حدث خطأ غير متوقع", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إضافة تسوية</DialogTitle>
          <DialogDescription>
            سجّل تحويلات بينك وبين الأعضاء لسداد الديون. يمكنك إضافة أكثر من سطر في نفس العملية.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Helper summary */}
          <div className="rounded-xl border border-border/50 bg-card/80 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>رصيدك الحالي:</span>
              <span className="font-semibold text-accent">{myNet >= 0 ? "+" : ""}{myNet.toLocaleString()} ر.س</span>
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end rounded-xl border border-border/50 p-3">
                <div className="sm:col-span-5 space-y-2">
                  <Label>إلى</Label>
                  <Select value={row.to_user_id} onValueChange={(v) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, to_user_id: v } : r))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العضو المستلم" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.filter(m => m.user_id !== currentUserId).map(m => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {formatName(m.user_id, profiles)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-4 space-y-2">
                  <Label>المبلغ</Label>
                  <Input inputMode="decimal" type="number" min="0" step="0.01" value={row.amount} onChange={(e) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, amount: e.target.value } : r))} placeholder="0.00" />
                </div>
                <div className="sm:col-span-3 space-y-2">
                  <Label>ملاحظة (اختياري)</Label>
                  <Input value={row.note || ""} onChange={(e) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, note: e.target.value } : r))} placeholder="مثال: تحويل بنكي" />
                </div>
                {rows.length > 1 && (
                  <div className="sm:col-span-12 flex justify-end">
                    <Button variant="outline" size="icon" onClick={() => removeRow(idx)} aria-label="حذف السطر">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={addRow} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                إضافة سطر
              </Button>
              <Button variant="secondary" onClick={applySuggestions} className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                اقتراح تلقائي
              </Button>
            </div>
            <Button variant="hero" onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {submitting ? "جارٍ الحفظ..." : "حفظ التسوية"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupSettlementDialog;
