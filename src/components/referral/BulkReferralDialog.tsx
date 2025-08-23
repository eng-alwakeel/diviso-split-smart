import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Users, Upload } from "lucide-react";

interface BulkReferralDialogProps {
  onInviteSent: () => void;
  sendReferralInvite: (phone: string, name?: string) => Promise<{ success?: boolean; error?: string }>;
}

export function BulkReferralDialog({ onInviteSent, sendReferralInvite }: BulkReferralDialogProps) {
  const [open, setOpen] = useState(false);
  const [phoneList, setPhoneList] = useState("");
  const [batchName, setBatchName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ total: number; success: number; failed: number } | null>(null);

  const parsePhoneList = (text: string) => {
    // تحليل قائمة الأرقام - دعم أشكال مختلفة
    const lines = text.split('\n').filter(line => line.trim());
    const phones: Array<{ phone: string; name?: string }> = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // دعم تنسيق "رقم الهاتف - الاسم" أو "رقم الهاتف,الاسم"
      const parts = trimmed.split(/[-,]/);
      const phone = parts[0]?.trim();
      const name = parts[1]?.trim();
      
      if (phone) {
        phones.push({ phone, name });
      }
    });
    
    return phones;
  };

  const handleBulkInvite = async () => {
    if (!phoneList.trim()) {
      toast.error("يرجى إدخال قائمة بأرقام الهواتف");
      return;
    }

    const phones = parsePhoneList(phoneList);
    if (phones.length === 0) {
      toast.error("لم يتم العثور على أرقام هواتف صحيحة");
      return;
    }

    if (phones.length > 20) {
      toast.error("الحد الأقصى 20 رقم في المرة الواحدة");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults(null);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < phones.length; i++) {
      const { phone, name } = phones[i];
      
      try {
        const result = await sendReferralInvite(phone, name);
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }
        
        // تأخير قصير لتجنب spam
        if (i < phones.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        failedCount++;
      }
      
      setProgress(((i + 1) / phones.length) * 100);
    }

    setResults({
      total: phones.length,
      success: successCount,
      failed: failedCount
    });

    setIsProcessing(false);
    onInviteSent();

    if (successCount > 0) {
      toast.success(`تم إرسال ${successCount} دعوة بنجاح`);
    }
    
    if (failedCount > 0) {
      toast.warning(`فشل في إرسال ${failedCount} دعوة`);
    }
  };

  const resetDialog = () => {
    setPhoneList("");
    setBatchName("");
    setProgress(0);
    setResults(null);
    setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        resetDialog();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          إحالة جماعية
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            إرسال دعوات جماعية
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="batch-name">اسم المجموعة (اختياري)</Label>
            <Input
              id="batch-name"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="مثال: أصدقاء العمل"
              disabled={isProcessing}
            />
          </div>

          <div>
            <Label htmlFor="phone-list">
              قائمة أرقام الهواتف (رقم لكل سطر)
            </Label>
            <Textarea
              id="phone-list"
              value={phoneList}
              onChange={(e) => setPhoneList(e.target.value)}
              placeholder={`مثال:
05xxxxxxxx - أحمد
05xxxxxxxx,فاطمة
05xxxxxxxx`}
              rows={8}
              disabled={isProcessing}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              يمكنك إدخال الاسم بعد الرقم مفصولاً بـ (-) أو (,)
              <br />
              الحد الأقصى: 20 رقم في المرة الواحدة
            </p>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>جاري الإرسال...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {results && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">نتائج الإرسال:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>إجمالي المحاولات:</span>
                  <span className="font-medium">{results.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">نجح:</span>
                  <span className="font-medium text-green-600">{results.success}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">فشل:</span>
                  <span className="font-medium text-red-600">{results.failed}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleBulkInvite}
              disabled={isProcessing || !phoneList.trim()}
              className="flex-1"
            >
              {isProcessing ? "جاري الإرسال..." : "إرسال الدعوات"}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isProcessing}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}