import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send } from "lucide-react";

interface InviteEmailTabProps {
  groupId: string | undefined;
  groupName?: string;
  inviteLink: string;
  onInviteSent: () => void;
}

export const InviteEmailTab = ({ 
  groupId, 
  groupName, 
  inviteLink,
  onInviteSent 
}: InviteEmailTabProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendEmailInvite = async () => {
    if (!email.trim() || !inviteLink || !groupName) {
      toast({
        title: "معلومات ناقصة",
        description: "تأكد من إدخال البريد الإلكتروني وإنشاء رابط الدعوة",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "بريد إلكتروني غير صالح",
        description: "تأكد من إدخال بريد إلكتروني صحيح",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email-invite', {
        body: {
          email,
          groupName,
          inviteLink,
          customMessage: customMessage.trim() || undefined,
          groupId
        }
      });

      if (error) throw error;
      
      toast({
        title: "تم إرسال الدعوة",
        description: `تم إرسال دعوة بريد إلكتروني إلى ${email}`,
      });
      
      onInviteSent();
      setEmail("");
      setCustomMessage("");
    } catch (error: any) {
      toast({
        title: "خطأ في إرسال البريد الإلكتروني",
        description: error.message || "حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          id="email"
          type="email"
          placeholder="example@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="text-left"
          dir="ltr"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">رسالة مخصصة (اختيارية)</Label>
        <Textarea
          id="message"
          placeholder="أضف رسالة شخصية للدعوة..."
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          سيتم إضافة هذه الرسالة للدعوة مع رابط الانضمام
        </p>
      </div>

      <Button
        onClick={sendEmailInvite}
        disabled={!email.trim() || !inviteLink || loading}
        className="w-full"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            جاري الإرسال...
          </div>
        ) : (
          <>
            <Send className="w-4 h-4 ml-2" />
            إرسال دعوة بريد إلكتروني
          </>
        )}
      </Button>

      <div className="p-3 bg-muted/50 rounded-lg">
        <div className="flex items-start gap-2">
          <Mail className="w-4 h-4 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">معاينة الدعوة:</p>
            <p className="text-xs text-muted-foreground mt-1">
              سيتم إرسال بريد إلكتروني احترافي يحتوي على اسم المجموعة، رابط الانضمام، 
              ورسالتك المخصصة إن وجدت.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};