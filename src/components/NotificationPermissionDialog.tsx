import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, Users, Wallet, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface NotificationPermissionDialogProps {
  open: boolean;
  onAllow: () => Promise<boolean>;
  onDismiss: () => void;
}

export function NotificationPermissionDialog({
  open,
  onAllow,
  onDismiss,
}: NotificationPermissionDialogProps) {
  const { t, i18n } = useTranslation("notifications");
  const isRTL = i18n.language === "ar";
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    try {
      await onAllow();
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Users, text: t("permission.benefit_groups") },
    { icon: Wallet, text: t("permission.benefit_expenses") },
    { icon: MessageSquare, text: t("permission.benefit_messages") },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="sm:max-w-md" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-10 h-10 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            {t("permission.title")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t("permission.description")}
          </DialogDescription>
        </DialogHeader>

        {/* Benefits list */}
        <div className="space-y-3 py-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <benefit.icon className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground">{benefit.text}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={handleAllow} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className={isRTL ? "mr-2" : "ml-2"}>{t("permission.loading")}</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span className={isRTL ? "mr-2" : "ml-2"}>{t("permission.allow_button")}</span>
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={onDismiss} disabled={loading} className="w-full text-muted-foreground">
            <X className="w-4 h-4" />
            <span className={isRTL ? "mr-2" : "ml-2"}>{t("permission.skip_button")}</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          {t("permission.privacy_note")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
