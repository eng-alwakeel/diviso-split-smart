import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle } from "lucide-react";
import { openWhatsAppDirect } from "@/lib/native";

interface Debtor {
  user_id: string;
  name: string;
  phone?: string | null;
  amount: number;
}

interface RequestPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debtors: Debtor[];
  currency: string;
  groupName: string;
}

export const RequestPaymentDialog = ({
  open,
  onOpenChange,
  debtors,
  currency,
  groupName,
}: RequestPaymentDialogProps) => {

  const buildMessage = (debtor: Debtor) => {
    return `مرحباً ${debtor.name} 👋\n\nتذكير ودّي بأن عليك مبلغ ${debtor.amount.toLocaleString()} ${currency} في مجموعة "${groupName}" على تطبيق Diviso.\n\nيمكنك تسوية المبلغ من التطبيق مباشرة:\nhttps://diviso-split-smart.lovable.app\n\nشكراً لك! 🙏`;
  };

  const handleWhatsApp = (debtor: Debtor) => {
    if (!debtor.phone) return;
    openWhatsAppDirect(debtor.phone, buildMessage(debtor));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            طلب سداد من المدينين
          </DialogTitle>
          <DialogDescription>
            أرسل طلب سداد عبر واتساب للأعضاء المدينين
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {debtors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا يوجد مدينون حالياً 🎉</p>
          ) : (
            debtors.map((debtor) => (
              <div
                key={debtor.user_id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card/50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{debtor.name}</p>
                  <p className="text-xs text-destructive font-medium">
                    عليه {debtor.amount.toLocaleString()} {currency}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-xs"
                  onClick={() => handleWhatsApp(debtor)}
                  disabled={!debtor.phone}
                  title={!debtor.phone ? "لا يوجد رقم هاتف" : "إرسال طلب واتساب"}
                >
                  <MessageCircle className="w-3.5 h-3.5 me-1 text-green-600" />
                  واتساب
                </Button>
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          سيتم فتح تطبيق واتساب برسالة جاهزة
        </p>
      </DialogContent>
    </Dialog>
  );
};
