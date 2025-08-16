
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Link, RefreshCw, Phone, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useQuotaHandler } from "@/hooks/useQuotaHandler";

interface InviteByLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string | undefined;
  groupName?: string;
}

const isUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export const InviteByLinkDialog = ({ open, onOpenChange, groupId, groupName }: InviteByLinkDialogProps) => {
  const { toast } = useToast();
  const { handleQuotaError } = useQuotaHandler();
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const disabledReason = useMemo(() => {
    if (!groupId) return "لا يوجد معرف مجموعة.";
    if (!isUUID(groupId)) return "هذه مجموعة تجريبية، افتح مجموعة حقيقية (UUID) لتفعيل الدعوات.";
    return null;
  }, [groupId]);

  useEffect(() => {
    if (!open) {
      setLink("");
      setPhoneNumber("");
    }
  }, [open]);

  const generateLink = async () => {
    if (disabledReason) {
      toast({ title: "لا يمكن إنشاء الدعوة", description: disabledReason, variant: "destructive" });
      return;
    }
    setLoading(true);
    console.log("[InviteByLinkDialog] creating token for group:", groupId);
    const { data, error } = await supabase
      .from("group_join_tokens")
      .insert({ group_id: groupId })
      .select("token")
      .single();

    setLoading(false);

    if (error) {
      console.error("[InviteByLinkDialog] insert token error:", error);
      
      // Handle quota errors
      if (!handleQuotaError(error)) {
        toast({
          title: "تعذر إنشاء رابط الدعوة",
          description: error.message || "تحقق من أنك مدير للمجموعة ومسجل دخول.",
          variant: "destructive",
        });
      }
      return;
    }

    const token = data?.token as string;
    const url = `${window.location.origin}/i/${token}`;
    setLink(url);
    toast({ title: "تم إنشاء رابط الدعوة", description: "انسخ الرابط وشاركه مع الأعضاء." });
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast({ title: "تم النسخ", description: "تم نسخ رابط الدعوة إلى الحافظة." });
  };

  const sendSMSInvite = async () => {
    if (!phoneNumber.trim() || !link || !groupName) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-invite', {
        body: {
          phone: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
          groupName,
          inviteLink: link,
          senderName: "المستخدم"
        }
      });

      if (error) throw error;
      
      toast({
        title: "تم إرسال الدعوة",
        description: `تم إرسال دعوة SMS إلى ${phoneNumber}`,
      });
    } catch (error: any) {
      toast({
        title: "خطأ في إرسال SMS",
        description: error.message || "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const sendWhatsAppInvite = () => {
    if (!phoneNumber.trim() || !link || !groupName) return;
    
    const message = `مرحباً! تمت دعوتك للانضمام لمجموعة "${groupName}" على تطبيق ديفيزو لتقسيم المصاريف.\n\nانقر على الرابط للانضمام:\n${link}`;
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "تم فتح واتس اب!",
      description: "تم توجيهك لإرسال الدعوة عبر واتس اب",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>دعوة عضو جديد</DialogTitle>
          <DialogDescription>أنشئ رابط دعوة لمشاركة الانضمام إلى المجموعة.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>معرف المجموعة</Label>
            <Input value={groupId || ""} readOnly />
            {disabledReason && <p className="text-xs text-destructive mt-1">{disabledReason}</p>}
          </div>

          <div className="flex gap-2">
            <Button className="flex items-center gap-2" onClick={generateLink} disabled={!!disabledReason || loading}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
              إنشاء رابط دعوة
            </Button>
          </div>

          <div className="space-y-2">
            <Label>الرابط</Label>
            <div className="flex gap-2">
              <Input value={link} readOnly placeholder="سيظهر الرابط هنا بعد الإنشاء" />
              <Button variant="outline" onClick={copyLink} disabled={!link} className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {link && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <Label className="text-sm font-medium">إرسال الدعوة مباشرة</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الجوال</Label>
                  <Input
                    id="phone"
                    placeholder="966xxxxxxxxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="text-left"
                    dir="ltr"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={!phoneNumber.trim()}
                    onClick={sendWhatsAppInvite}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white border-green-500"
                  >
                    <MessageSquare className="w-4 h-4 ml-2" />
                    إرسال عبر واتساب
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!phoneNumber.trim()}
                    onClick={sendSMSInvite}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                  >
                    <Phone className="w-4 h-4 ml-2" />
                    إرسال عبر SMS
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
