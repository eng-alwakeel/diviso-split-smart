import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, MessageCircle, Send } from "lucide-react";
import { openSMSApp, openWhatsAppDirect, openTelegramShare } from "@/lib/native";

interface AppPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  message: string;
  contactName?: string;
  onSent?: () => void;
}

export const AppPickerDialog = ({
  open,
  onOpenChange,
  phone,
  message,
  contactName,
  onSent
}: AppPickerDialogProps) => {
  const handleSMS = () => {
    openSMSApp(phone, message);
    onSent?.();
    onOpenChange(false);
  };

  const handleWhatsApp = () => {
    openWhatsAppDirect(phone, message);
    onSent?.();
    onOpenChange(false);
  };

  const handleTelegram = () => {
    openTelegramShare(message);
    onSent?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">اختر طريقة الإرسال</DialogTitle>
          <DialogDescription className="text-center">
            {contactName ? `إرسال دعوة إلى ${contactName}` : 'اختر التطبيق لإرسال الدعوة'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-4">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-primary/10 hover:border-primary"
            onClick={handleSMS}
          >
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium">SMS</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-primary/10 hover:border-primary"
            onClick={handleWhatsApp}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-sm font-medium">واتساب</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-primary/10 hover:border-primary"
            onClick={handleTelegram}
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium">تليجرام</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          سيتم فتح التطبيق مع رسالة جاهزة للإرسال
        </p>
      </DialogContent>
    </Dialog>
  );
};
