import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Download, X, ExternalLink } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { IosInstallSheet } from "./IosInstallSheet";

interface PwaInstallPromptProps {
  variant?: "primary" | "ghost";
  title: string;
  subtitle?: string;
}

export function PwaInstallPrompt({ variant = "primary", title, subtitle }: PwaInstallPromptProps) {
  const { t } = useTranslation("install");
  const {
    isIOS,
    isSafariOnIOS,
    isInAppBrowser,
    shouldShow,
    canPrompt,
    triggerInstall,
    dismiss,
  } = usePwaInstall();

  const [showIosSheet, setShowIosSheet] = useState(false);

  if (!shouldShow) return null;

  const handleInstall = async () => {
    if (canPrompt) {
      await triggerInstall();
      return;
    }
    if (isIOS) {
      setShowIosSheet(true);
      return;
    }
  };

  const showInAppWarning = isIOS && isInAppBrowser && !isSafariOnIOS;

  return (
    <>
      <div className="unified-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">{title}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label={t("prompt.dismissLabel")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showInAppWarning && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-warning/10 border border-warning/20 p-3">
            <ExternalLink className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80">
              <Trans
                i18nKey="prompt.inAppWarning"
                ns="install"
                components={{ bold: <span className="font-bold text-primary" /> }}
              />
            </p>
          </div>
        )}

        <div className="mt-3">
          <Button
            onClick={handleInstall}
            variant={variant === "ghost" ? "outline" : "default"}
            size="sm"
            className="w-full"
          >
            <Download className="w-4 h-4 me-2" />
            {t("prompt.installButton")}
          </Button>
        </div>
      </div>

      <IosInstallSheet open={showIosSheet} onOpenChange={setShowIosSheet} />
    </>
  );
}
