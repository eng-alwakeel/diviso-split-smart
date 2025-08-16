import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, MessageSquare, Zap } from "lucide-react";

interface InvitePhoneTabProps {
  groupId: string | undefined;
  groupName?: string;
  inviteLink: string;
  onInviteSent: () => void;
}

export const InvitePhoneTab = ({ 
  groupId, 
  groupName, 
  inviteLink,
  onInviteSent 
}: InvitePhoneTabProps) => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smartInviteLoading, setSmartInviteLoading] = useState(false);

  const sendSMSInvite = async () => {
    if (!phoneNumber.trim() || !inviteLink || !groupName) {
      toast({
        title: "معلومات ناقصة",
        description: "تأكد من إنشاء رابط الدعوة أولاً",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-invite', {
        body: {
          phone: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
          groupName,
          inviteLink,
          senderName: "المستخدم"
        }
      });

      if (error) throw error;
      
      toast({
        title: "تم إرسال SMS",
        description: `تم إرسال دعوة SMS إلى ${phoneNumber}`,
      });
      
      onInviteSent();
      setPhoneNumber("");
    } catch (error: any) {
      toast({
        title: "خطأ في إرسال SMS",
        description: error.message || "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const sendWhatsAppInvite = () => {
    if (!phoneNumber.trim() || !inviteLink || !groupName) {
      toast({
        title: "معلومات ناقصة",
        description: "تأكد من إنشاء رابط الدعوة أولاً",
        variant: "destructive",
      });
      return;
    }
    
    const message = `مرحباً! تمت دعوتك للانضمام لمجموعة "${groupName}" على تطبيق ديفيزو لتقسيم المصاريف.\n\nانقر على الرابط للانضمام:\n${inviteLink}`;
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "تم فتح واتس اب!",
      description: "تم توجيهك لإرسال الدعوة عبر واتس اب",
    });
    
    onInviteSent();
    setPhoneNumber("");
  };

  const sendSmartInvite = async () => {
    if (!phoneNumber.trim() || !groupId || !groupName) {
      toast({
        title: "معلومات ناقصة",
        description: "تأكد من وجود رقم الجوال ومعرف المجموعة",
        variant: "destructive",
      });
      return;
    }
    
    setSmartInviteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-invite', {
        body: {
          groupId,
          phoneNumber,
          groupName,
          senderName: "صديقك"
        }
      });

      if (error) throw error;

      toast({
        title: data.userExists ? "تم إرسال إشعار داخلي" : "تم إرسال SMS",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });

      if (data.success) {
        onInviteSent();
        setPhoneNumber("");
      }
    } catch (error: any) {
      toast({
        title: "خطأ في إرسال الدعوة",
        description: error.message || "حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setSmartInviteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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
        <p className="text-xs text-muted-foreground">
          أدخل رقم الجوال مع رمز الدولة (مثال: 966501234567)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          variant="outline"
          disabled={!phoneNumber.trim() || smartInviteLoading}
          onClick={sendSmartInvite}
          className="bg-primary/20 border-primary/30 text-primary hover:bg-primary/30"
        >
          <Zap className="w-4 h-4 ml-2" />
          دعوة ذكية (موصى بها)
        </Button>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            disabled={!phoneNumber.trim() || !inviteLink}
            onClick={sendWhatsAppInvite}
            className="bg-green-500 hover:bg-green-600 text-white border-green-500"
          >
            <MessageSquare className="w-4 h-4 ml-2" />
            واتساب
          </Button>
          <Button
            variant="outline"
            disabled={!phoneNumber.trim() || !inviteLink}
            onClick={sendSMSInvite}
            className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
          >
            <Phone className="w-4 h-4 ml-2" />
            SMS
          </Button>
        </div>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg">
        <h4 className="font-medium text-sm mb-2">طرق الدعوة:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li><strong>الدعوة الذكية:</strong> تتحقق من وجود حساب وترسل إشعار داخلي أو SMS</li>
          <li><strong>واتساب:</strong> تفتح واتساب مع رسالة الدعوة جاهزة</li>
          <li><strong>SMS:</strong> ترسل رسالة نصية مباشرة</li>
        </ul>
      </div>
    </div>
  );
};