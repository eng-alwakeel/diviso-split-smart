import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Clock, AlertCircle, X, Wallet } from "lucide-react";
import { ConfirmSettlementDialog } from "./ConfirmSettlementDialog";
import { PayoutMethodsSheet } from "./PayoutMethodsSheet";
import { cn } from "@/lib/utils";

interface SettlementAnnouncementCardProps {
  settlement: {
    id: string;
    from_user_id: string;
    to_user_id: string;
    amount: number;
    created_at: string;
    note?: string;
    status?: string;
  };
  fromName: string;
  toName: string;
  currency: string;
  currentUserId: string | null;
  onConfirmed?: () => void;
}

export const SettlementAnnouncementCard = ({
  settlement,
  fromName,
  toName,
  currency,
  currentUserId,
  onConfirmed,
}: SettlementAnnouncementCardProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [payoutSheetOpen, setPayoutSheetOpen] = useState(false);

  const isRecipient = currentUserId === settlement.to_user_id;
  const status = settlement.status || "pending";

  const statusConfig = {
    pending: {
      icon: Clock,
      label: "بانتظار التأكيد",
      bgClass: "bg-amber-500/5 border-amber-500/20",
      iconClass: "text-amber-500",
      textClass: "text-amber-600",
    },
    confirmed: {
      icon: Check,
      label: "تم التأكيد ✅",
      bgClass: "bg-green-500/5 border-green-500/20",
      iconClass: "text-green-500",
      textClass: "text-green-600",
    },
    disputed: {
      icon: X,
      label: "متنازع عليها",
      bgClass: "bg-destructive/5 border-destructive/20",
      iconClass: "text-destructive",
      textClass: "text-destructive",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <>
      <div className={cn("rounded-xl border p-4 space-y-3 my-2", config.bgClass)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <span className="text-lg">💸</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">
              {fromName} أعلن دفع{" "}
              <span className="text-accent">{settlement.amount.toLocaleString()} {currency}</span>
              {" "}لـ {toName}
            </p>
            {settlement.note && (
              <p className="text-xs text-muted-foreground mt-1">📝 {settlement.note}</p>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <StatusIcon className={cn("w-3.5 h-3.5", config.iconClass)} />
              <span className={cn("text-xs font-medium", config.textClass)}>{config.label}</span>
            </div>
          </div>
        </div>

        {/* Show confirm button only to recipient when pending */}
        {isRecipient && status === "pending" && (
          <Button
            size="sm"
            variant="hero"
            className="w-full text-xs"
            onClick={() => setConfirmOpen(true)}
          >
            <Check className="w-3.5 h-3.5 me-1" />
            تأكيد الاستلام
          </Button>
        )}

        {/* Show payout methods button to the payer */}
        {currentUserId === settlement.from_user_id && status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs gap-1.5"
            onClick={() => setPayoutSheetOpen(true)}
          >
            <Wallet className="w-3.5 h-3.5" />
            طرق الدفع لـ {toName}
          </Button>
        )}
      </div>

      <ConfirmSettlementDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        settlement={settlement}
        fromUserName={fromName}
        currency={currency}
        onConfirmed={() => {
          onConfirmed?.();
        }}
      />

      <PayoutMethodsSheet
        open={payoutSheetOpen}
        onOpenChange={setPayoutSheetOpen}
        userId={settlement.to_user_id}
        userName={toName}
      />
    </>
  );
};
