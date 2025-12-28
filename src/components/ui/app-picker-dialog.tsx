import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, MessageCircle, Send } from "lucide-react";
import { openSMSApp, openWhatsAppDirect, openTelegramShare } from "@/lib/native";
import { useTranslation } from "react-i18next";

export type InviteSource = 'sms' | 'whatsapp' | 'telegram';

interface AppPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  message: string;
  contactName?: string;
  onSent?: (source: InviteSource) => void;
}

export const AppPickerDialog = ({
  open,
  onOpenChange,
  phone,
  message,
  contactName,
  onSent
}: AppPickerDialogProps) => {
  const { t } = useTranslation('groups');

  const handleSMS = () => {
    openSMSApp(phone, message);
    onSent?.('sms');
    onOpenChange(false);
  };

  const handleWhatsApp = () => {
    openWhatsAppDirect(phone, message);
    onSent?.('whatsapp');
    onOpenChange(false);
  };

  const handleTelegram = () => {
    openTelegramShare(message);
    onSent?.('telegram');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{t('contacts_invite.choose_app')}</DialogTitle>
          <DialogDescription className="text-center">
            {contactName 
              ? t('contacts_invite.sending_to', { name: contactName }) 
              : t('contacts_invite.choose_app_default')}
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
            <span className="text-sm font-medium">{t('contacts_invite.whatsapp')}</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-primary/10 hover:border-primary"
            onClick={handleTelegram}
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium">{t('contacts_invite.telegram')}</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {t('contacts_invite.app_will_open')}
        </p>
      </DialogContent>
    </Dialog>
  );
};
