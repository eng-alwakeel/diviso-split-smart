import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertCircle } from "lucide-react";
import { useSettlementActions } from "@/hooks/useSettlementActions";

interface Settlement {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  created_at: string;
  note?: string;
  status?: string;
}

interface ConfirmSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: Settlement | null;
  fromUserName: string;
  currency: string;
  onConfirmed: () => void;
}

export const ConfirmSettlementDialog = ({
  open,
  onOpenChange,
  settlement,
  fromUserName,
  currency,
  onConfirmed
}: ConfirmSettlementDialogProps) => {
  const { t } = useTranslation('groups');
  const { confirmSettlement, disputeSettlement, loading } = useSettlementActions();
  const [showDispute, setShowDispute] = useState(false);

  if (!settlement) return null;

  const handleConfirm = async () => {
    const success = await confirmSettlement(settlement.id);
    if (success) {
      onConfirmed();
      onOpenChange(false);
    }
  };

  const handleDispute = async () => {
    const success = await disputeSettlement(settlement.id);
    if (success) {
      onConfirmed();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="w-5 h-5 text-accent" />
            {t('settlements_tab.confirm_receipt')}
          </DialogTitle>
          <DialogDescription>
            {t('settlements_tab.confirm_receipt_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Settlement Details */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t('settlements_tab.from')}
              </span>
              <span className="font-medium">{fromUserName}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t('settlements_tab.amount')}
              </span>
              <span className="text-xl font-bold text-accent">
                {settlement.amount.toLocaleString()} {currency}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t('settlements_tab.date')}
              </span>
              <span className="text-sm">
                {new Date(settlement.created_at).toLocaleDateString('ar-SA')}
              </span>
            </div>

            {settlement.note && (
              <div className="pt-2 border-t border-border/30">
                <span className="text-sm text-muted-foreground block mb-1">
                  {t('settlements_tab.note')}
                </span>
                <span className="text-sm">{settlement.note}</span>
              </div>
            )}
          </div>

          {showDispute && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">
                  {t('settlements_tab.dispute_warning')}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!showDispute ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowDispute(true)}
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                {t('settlements_tab.dispute')}
              </Button>
              <Button onClick={handleConfirm} disabled={loading}>
                <Check className="w-4 h-4 mr-2" />
                {t('settlements_tab.confirm')}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setShowDispute(false)}
                disabled={loading}
              >
                {t('common:cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDispute}
                disabled={loading}
              >
                {t('settlements_tab.confirm_dispute')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
