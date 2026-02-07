import { useTranslation } from "react-i18next";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { toast } from "sonner";

const SHARE_URL = "https://diviso.app/install";

export function ShareInstallButton() {
  const { t } = useTranslation("install");
  const { isInstalled } = usePwaInstall();

  if (isInstalled) return null;

  const handleShare = async () => {
    const sharePayload = {
      title: t("share.shareTitle"),
      text: t("share.shareText"),
      url: SHARE_URL,
    };

    // Try native share sheet
    if (navigator.share) {
      try {
        await navigator.share(sharePayload);
        return;
      } catch {
        // User cancelled or error — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      toast.success(t("share.copiedToast"));
    } catch {
      // Last resort
      window.prompt(t("share.copyPrompt"), SHARE_URL);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleShare}
      aria-label={t("share.ariaLabel")}
    >
      <Share2 className="w-4 h-4 me-2" />
      {t("share.buttonText")}
    </Button>
  );
}
