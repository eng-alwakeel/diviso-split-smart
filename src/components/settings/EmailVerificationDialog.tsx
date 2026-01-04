import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Mail, RefreshCw, Loader2, ExternalLink } from "lucide-react";

interface EmailVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  userName?: string;
  onSuccess: () => void;
  onResend: () => Promise<void>;
}

export function EmailVerificationDialog({
  open,
  onOpenChange,
  email,
  onResend,
}: EmailVerificationDialogProps) {
  const { t } = useTranslation(["settings"]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            {t("settings:email_verification.title")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("settings:email_verification.check_inbox")}
            <br />
            <span className="font-medium text-foreground" dir="ltr">
              {email}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              {t("settings:email_verification.supabase_instructions")}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              <span>{t("settings:email_verification.check_spam")}</span>
            </div>
          </div>

          {/* Close Button */}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {t("settings:email_verification.understood")}
          </Button>

          {/* Resend Button */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await onResend();
                } catch (error) {
                  console.error("Resend error:", error);
                }
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t("settings:email_verification.resend")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
