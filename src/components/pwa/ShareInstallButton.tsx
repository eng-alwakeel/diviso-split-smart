import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { toast } from "sonner";

const SHARE_URL = "https://diviso.app/install";

const SHARE_PAYLOAD = {
  title: "ثبّت Diviso على جوالك",
  text: "قسّم المصاريف مع أصحابك بسهولة، وافتح التطبيق مباشرة من شاشة الجوال بدون متصفح.",
  url: SHARE_URL,
};

export function ShareInstallButton() {
  const { isInstalled } = usePwaInstall();

  if (isInstalled) return null;

  const handleShare = async () => {
    // Try native share sheet
    if (navigator.share) {
      try {
        await navigator.share(SHARE_PAYLOAD);
        return;
      } catch {
        // User cancelled or error — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      toast.success("تم نسخ رابط التثبيت ✅");
    } catch {
      // Last resort
      window.prompt("انسخ رابط التثبيت:", SHARE_URL);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleShare}
      aria-label="مشاركة رابط تثبيت Diviso"
    >
      <Share2 className="w-4 h-4 me-2" />
      شارك رابط التثبيت
    </Button>
  );
}
