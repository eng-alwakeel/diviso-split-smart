import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, MessageCircle } from "lucide-react";
import { TripSummaryCard } from "./TripSummaryCard";
import { openWhatsAppDirect } from "@/lib/native";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface TripSummarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  totalExpenses: number;
  currency: string;
  memberCount: number;
  expenseCount: number;
  settlementCount: number;
  diceCount: number;
  topPayer?: { name: string; amount: number };
  fastestSettler?: { name: string };
  duration?: string;
}

export const TripSummarySheet = ({
  open,
  onOpenChange,
  groupName,
  totalExpenses,
  currency,
  memberCount,
  expenseCount,
  settlementCount,
  diceCount,
  topPayer,
  fastestSettler,
  duration,
}: TripSummarySheetProps) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const summaryData = {
    groupName, totalExpenses, currency, memberCount,
    expenseCount, settlementCount, diceCount, topPayer, fastestSettler, duration,
  };

  const buildShareText = () => {
    let text = `🎉 ملخص رحلة "${groupName}"\n\n`;
    text += `💰 إجمالي المصاريف: ${totalExpenses.toLocaleString()} ${currency}\n`;
    text += `👥 الأعضاء: ${memberCount}\n`;
    text += `📊 عدد العمليات: ${expenseCount}\n`;
    text += `✅ التسويات: ${settlementCount}\n`;
    if (topPayer) text += `\n🏆 أكثر مساهمة: ${topPayer.name} (${topPayer.amount.toLocaleString()} ${currency})\n`;
    if (fastestSettler) text += `🟢 أسرع سداد: ${fastestSettler.name}\n`;
    text += `\n— Diviso | قسّم بذكاء\nhttps://diviso-split-smart.lovable.app`;
    return text;
  };

  const handleShareWhatsApp = () => {
    openWhatsAppDirect("", buildShareText());
  };

  const handleExportImage = async () => {
    setExporting(true);
    try {
      const el = document.getElementById("trip-summary-card");
      if (!el) return;
      const canvas = await html2canvas(el, { backgroundColor: "#1a1a2e", scale: 2 });
      const link = document.createElement("a");
      link.download = `${groupName}-summary.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "تم تصدير الملخص كصورة 📸" });
    } catch {
      toast({ title: "تعذر التصدير", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🎉 ملخص الرحلة</DialogTitle>
        </DialogHeader>

        <TripSummaryCard data={summaryData} />

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 text-xs" onClick={handleShareWhatsApp}>
            <MessageCircle className="w-3.5 h-3.5 me-1 text-green-600" />
            مشاركة واتساب
          </Button>
          <Button variant="outline" className="flex-1 text-xs" onClick={handleExportImage} disabled={exporting}>
            <Download className="w-3.5 h-3.5 me-1" />
            {exporting ? "جاري..." : "تصدير صورة"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
