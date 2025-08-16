import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactsPicker } from "@/components/group/ContactsPicker";
import { ContactInfo } from "@/hooks/useContacts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Contact, Users } from "lucide-react";

interface InviteContactsTabProps {
  groupId: string | undefined;
  groupName?: string;
  existingMembers: string[];
  onInviteSent: () => void;
}

export const InviteContactsTab = ({ 
  groupId, 
  groupName, 
  existingMembers,
  onInviteSent 
}: InviteContactsTabProps) => {
  const { toast } = useToast();
  const [contactsOpen, setContactsOpen] = useState(false);
  const [smartInviteLoading, setSmartInviteLoading] = useState(false);

  const sendSmartInvite = async (phone: string, contactName?: string) => {
    if (!groupId || !groupName) {
      toast({
        title: "معلومات ناقصة",
        description: "تأكد من وجود معرف المجموعة",
        variant: "destructive",
      });
      return;
    }
    
    setSmartInviteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-invite', {
        body: {
          groupId,
          phoneNumber: phone,
          groupName,
          senderName: contactName || "صديقك"
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
        setContactsOpen(false);
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

  const handleContactSelected = (contact: ContactInfo, selectedPhone: string) => {
    sendSmartInvite(selectedPhone, contact.name);
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
            اختر جهة اتصال لإرسال دعوة ذكية إليها
          </p>
        </div>

        <Button
          onClick={() => setContactsOpen(true)}
          disabled={smartInviteLoading}
          className="w-full"
        >
          <Contact className="w-4 h-4 ml-2" />
          اختيار من جهات الاتصال
        </Button>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg">
        <h4 className="font-medium text-sm mb-2">الدعوة الذكية من جهات الاتصال:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• سيتم فحص ما إذا كانت جهة الاتصال لديها حساب مسجل</li>
          <li>• المستخدمون المسجلون: سيحصلون على إشعار داخلي</li>
          <li>• المستخدمون الجدد: سيحصلون على SMS مع رابط التحميل</li>
          <li>• سيتم استبعاد الأعضاء الموجودين بالفعل</li>
        </ul>
      </div>

      <ContactsPicker
        open={contactsOpen}
        onOpenChange={setContactsOpen}
        onContactSelected={handleContactSelected}
        excludeNumbers={existingMembers}
      />
    </div>
  );
};