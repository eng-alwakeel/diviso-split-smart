import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactsPicker } from "@/components/group/ContactsPicker";
import { AppPickerDialog } from "@/components/ui/app-picker-dialog";
import { ContactInfo } from "@/hooks/useContacts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Contact, Users, Sparkles, MessageSquare } from "lucide-react";

interface InviteContactsTabProps {
  groupId: string | undefined;
  groupName?: string;
  existingMembers: string[];
  onInviteSent: () => void;
  inviteLink?: string;
}

export const InviteContactsTab = ({ 
  groupId, 
  groupName, 
  existingMembers,
  onInviteSent,
  inviteLink
}: InviteContactsTabProps) => {
  const { toast } = useToast();
  const [contactsOpen, setContactsOpen] = useState(false);
  const [appPickerOpen, setAppPickerOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [selectedContactName, setSelectedContactName] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // إنشاء رسالة الدعوة
  const createInviteMessage = () => {
    const appLink = inviteLink || "https://diviso.app";
    return `🎉 مرحباً! أدعوك للانضمام لمجموعة "${groupName}" على تطبيق Diviso لتقسيم المصاريف.

📱 حمّل التطبيق وانضم لنا:
${appLink}

✨ Diviso يساعدك في تتبع وتقسيم المصاريف مع الأصدقاء والعائلة بسهولة!`;
  };

  // إرسال إشعار داخلي للمستخدم المسجل
  const sendInternalNotification = async (userId: string, contactName: string) => {
    if (!groupId || !groupName) {
      toast({
        title: "معلومات ناقصة",
        description: "تأكد من وجود معرف المجموعة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // الحصول على معلومات المرسل
      const { data: { user } } = await supabase.auth.getUser();
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('name, display_name')
        .eq('id', user?.id)
        .single();

      const senderName = senderProfile?.display_name || senderProfile?.name || "صديقك";

      // إرسال إشعار داخلي
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'group_invite',
          payload: {
            title: 'دعوة للانضمام لمجموعة',
            body: `${senderName} يدعوك للانضمام إلى مجموعة "${groupName}"`,
            group_id: groupId,
            group_name: groupName,
            inviter_name: senderName
          }
        });

      if (notifError) throw notifError;

      toast({
        title: "تم إرسال الدعوة! ✅",
        description: `تم إرسال إشعار داخلي إلى ${contactName}`,
      });

      onInviteSent();
    } catch (error: any) {
      console.error('Error sending internal notification:', error);
      toast({
        title: "خطأ في إرسال الإشعار",
        description: error.message || "حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // معالجة اختيار جهة الاتصال
  const handleContactSelected = (
    contact: ContactInfo, 
    phoneNumber: string, 
    isRegistered: boolean, 
    userId?: string
  ) => {
    if (isRegistered && userId) {
      // المستخدم مسجل - إرسال إشعار داخلي
      sendInternalNotification(userId, contact.name);
    } else {
      // المستخدم غير مسجل - فتح قائمة اختيار التطبيق
      setSelectedPhone(phoneNumber);
      setSelectedContactName(contact.name);
      setInviteMessage(createInviteMessage());
      setAppPickerOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
          <Users className="w-8 h-8 text-accent" />
        </div>
        
        <div>
          <h3 className="font-medium">دعوة من جهات الاتصال</h3>
          <p className="text-sm text-muted-foreground mt-1">
            اختر جهة اتصال لإرسال دعوة إليها
          </p>
        </div>

        <Button
          onClick={() => setContactsOpen(true)}
          disabled={loading}
          className="w-full"
        >
          <Contact className="w-4 h-4 ml-2" />
          اختيار من جهات الاتصال
        </Button>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg space-y-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          كيف تعمل الدعوة الذكية؟
        </h4>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-start gap-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary text-xs font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-primary">أصدقاء على Diviso</p>
              <p className="text-muted-foreground">يحصلون على إشعار فوري داخل التطبيق</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2 p-2 bg-accent/5 rounded-lg border border-accent/10">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-accent-foreground text-xs font-bold">2</span>
            </div>
            <div>
              <p className="font-medium">أصدقاء جدد</p>
              <p className="text-muted-foreground">يمكنك إرسال دعوة عبر SMS أو واتساب من جوالك</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
        <MessageSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
        <p className="text-xs text-green-700 dark:text-green-400">
          الدعوات ترسل من رقمك الشخصي - أكثر موثوقية ومجانية!
        </p>
      </div>

      <ContactsPicker
        open={contactsOpen}
        onOpenChange={setContactsOpen}
        onContactSelected={handleContactSelected}
        excludeNumbers={existingMembers}
      />

      <AppPickerDialog
        open={appPickerOpen}
        onOpenChange={setAppPickerOpen}
        phone={selectedPhone}
        message={inviteMessage}
        contactName={selectedContactName}
        onSent={onInviteSent}
      />
    </div>
  );
};
