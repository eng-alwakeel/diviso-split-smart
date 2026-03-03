import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle, Wallet } from "lucide-react";
import { openWhatsAppDirect } from "@/lib/native";
import { useUserPayoutMethods, getMethodLabel } from "@/hooks/usePayoutMethods";
import { PayoutMethodsSheet } from "./PayoutMethodsSheet";

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
  /** The current user (creditor) whose payout methods to include */
  currentUserId?: string | null;
  currentUserName?: string;
}

export const RequestPaymentDialog = ({
  open,
  onOpenChange,
  debtors,
  currency,
  groupName,
  currentUserId,
  currentUserName = '',
}: RequestPaymentDialogProps) => {
  const { data: myPayoutMethods = [] } = useUserPayoutMethods(open ? currentUserId : null);
  const [payoutSheetOpen, setPayoutSheetOpen] = useState(false);
  const [selectedDebtorId, setSelectedDebtorId] = useState<string | null>(null);

  const defaultMethod = myPayoutMethods.find(m => m.is_default) || myPayoutMethods[0];

  const buildMessage = (debtor: Debtor) => {
    let msg = `مرحباً ${debtor.name} 👋\n\nبحسب حسابات مجموعة "${groupName}" في Diviso،\nالمبلغ المستحق عليك: ${debtor.amount.toLocaleString()} ${currency}.\n`;

    if (currentUserName) {
      msg += `ادفع لـ: ${currentUserName}\n`;
    }

    if (defaultMethod) {
      msg += `\n💳 طريقة الدفع المفضلة:\n${getMethodLabel(defaultMethod.method_type)}: ${defaultMethod.label}\nرقم الحساب: ${defaultMethod.account_value}\n`;
      if (defaultMethod.account_name) {
        msg += `اسم المستفيد: ${defaultMethod.account_name}\n`;
      }
      if (defaultMethod.note) {
        msg += `ملاحظة: ${defaultMethod.note}\n`;
      }
    } else {
      msg += `\nيمكنك معرفة طريقة الدفع من داخل التطبيق.\n`;
    }

    msg += `\nيمكنك تسوية المبلغ من التطبيق مباشرة:\nhttps://diviso-split-smart.lovable.app\n\nشكراً لك! 🙏`;
    return msg;
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

        {/* Payout method info */}
        {defaultMethod ? (
          <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 text-xs space-y-1">
            <p className="font-medium text-accent">💳 سيتم تضمين طريقة الدفع في الرسالة:</p>
            <p className="text-muted-foreground">{defaultMethod.label} — {defaultMethod.account_value.slice(-4)}****</p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
            💡 أضف طريقة استلام في الإعدادات لتضمينها تلقائياً في رسائل الطلب
          </div>
        )}

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
          سيتم فتح تطبيق واتساب برسالة جاهزة تتضمن طريقة الدفع
        </p>
      </DialogContent>
    </Dialog>
  );
};
