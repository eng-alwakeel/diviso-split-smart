import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactsPicker } from "@/components/group/ContactsPicker";
import { AppPickerDialog, InviteSource } from "@/components/ui/app-picker-dialog";
import { ContactInfo } from "@/hooks/useContacts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Contact, Users, Sparkles, MessageSquare, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Capacitor } from "@capacitor/core";

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
  const { t } = useTranslation('groups');
  const [contactsOpen, setContactsOpen] = useState(false);
  const [appPickerOpen, setAppPickerOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [selectedContactName, setSelectedContactName] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  // تنسيق رقم الهاتف
  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '966' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  // إنشاء سجل دعوة في قاعدة البيانات
  const createInviteRecord = async (phoneNumber: string, isRegistered: boolean, userId?: string): Promise<string | null> => {
    if (!groupId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const formattedPhone = formatPhoneNumber(phoneNumber);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 أيام

      const { data, error } = await supabase
        .from('invites')
        .insert({
          group_id: groupId,
          phone_or_email: formattedPhone,
          status: 'pending',
          created_by: user.id,
          invite_type: isRegistered ? 'notification' : 'phone',
          invite_source: isRegistered ? 'internal' : 'pending',
          expires_at: expiresAt.toISOString(),
          accepted_by: isRegistered ? userId : null
        })
        .select('id, invite_token')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error creating invite record:', error);
      return null;
    }
  };

  // تحديث مصدر الدعوة بعد الإرسال
  const updateInviteSource = async (inviteId: string, source: InviteSource) => {
    try {
      await supabase
        .from('invites')
        .update({ 
          invite_source: source,
          status: 'sent'
        })
        .eq('id', inviteId);
    } catch (error) {
      console.error('Error updating invite source:', error);
    }
  };

  // إنشاء رابط الدعوة الفريد
  const createUniqueInviteLink = async (): Promise<string> => {
    // استخدام رابط الدعوة الموجود مسبقاً
    if (inviteLink) return inviteLink;
    
    // إذا لم يكن هناك رابط، إنشاء token جديد
    if (!groupId) return `${window.location.origin}`;
    
    try {
      const { data, error } = await supabase.rpc('create_group_join_token', {
        p_group_id: groupId
      });
      
      if (error) throw error;
      
      return `${window.location.origin}/i/${data}`;
    } catch (error) {
      console.error('Error creating invite token:', error);
      // Fallback: استخدام رابط الدعوة العام إذا فشل إنشاء التوكن
      return inviteLink || `${window.location.origin}`;
    }
  };

  // إنشاء رسالة الدعوة
  const createInviteMessage = async () => {
    const link = await createUniqueInviteLink();
    return `🎉 مرحباً! أدعوك للانضمام لمجموعة "${groupName}" على تطبيق Diviso لتقسيم المصاريف.

📱 حمّل التطبيق وانضم لنا:
${link}

✨ Diviso يساعدك في تتبع وتقسيم المصاريف مع الأصدقاء والعائلة بسهولة!`;
  };

  // إرسال إشعار داخلي للمستخدم المسجل
  const sendInternalNotification = async (userId: string, contactName: string, phoneNumber: string) => {
    if (!groupId || !groupName) {
      toast({
        title: t('contacts_invite.notification_error'),
        description: t('contacts_invite.notification_error'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // إنشاء سجل الدعوة أولاً
      const inviteId = await createInviteRecord(phoneNumber, true, userId);
      
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
            inviter_name: senderName,
            invite_id: inviteId
          }
        });

      if (notifError) throw notifError;

      // تحديث حالة الدعوة إلى مُرسلة
      if (inviteId) {
        await supabase
          .from('invites')
          .update({ status: 'sent', invite_source: 'internal' })
          .eq('id', inviteId);
      }

      toast({
        title: t('contacts_invite.notification_sent'),
        description: t('contacts_invite.notification_sent_to', { name: contactName }),
      });

      onInviteSent();
    } catch (error: any) {
      console.error('Error sending internal notification:', error);
      toast({
        title: t('contacts_invite.notification_error'),
        description: error.message || t('contacts_invite.notification_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // معالجة اختيار جهة الاتصال
  const handleContactSelected = async (
    contact: ContactInfo, 
    phoneNumber: string, 
    isRegistered: boolean, 
    userId?: string
  ) => {
    if (isRegistered && userId) {
      // المستخدم مسجل - إرسال إشعار داخلي
      sendInternalNotification(userId, contact.name, phoneNumber);
    } else {
      // المستخدم غير مسجل - إنشاء سجل الدعوة ثم فتح قائمة اختيار التطبيق
      setLoading(true);
      const inviteId = await createInviteRecord(phoneNumber, false);
      setPendingInviteId(inviteId);
      setLoading(false);
      
      setSelectedPhone(phoneNumber);
      setSelectedContactName(contact.name);
      const message = await createInviteMessage();
      setInviteMessage(message);
      setAppPickerOpen(true);
    }
  };

  // معالجة إرسال الدعوة عبر التطبيق
  const handleAppSent = async (source: InviteSource) => {
    if (pendingInviteId) {
      await updateInviteSource(pendingInviteId, source);
      toast({
        title: t('contacts_invite.invite_saved'),
        description: t('contacts_invite.invite_saved_desc'),
      });
    }
    setPendingInviteId(null);
    onInviteSent();
  };

  return (
    <div className="space-y-4">
      {/* توضيح للويب */}
      {!isNative && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            {t('contacts_invite.web_notice')}
          </AlertDescription>
        </Alert>
      )}

      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
          <Users className="w-8 h-8 text-accent" />
        </div>
        
        <div>
          <h3 className="font-medium">{t('contacts_invite.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('contacts_invite.subtitle')}
          </p>
        </div>

        <Button
          onClick={() => setContactsOpen(true)}
          disabled={loading}
          className="w-full"
        >
          <Contact className="w-4 h-4 ml-2" />
          {t('contacts_invite.select_contact')}
        </Button>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg space-y-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          {t('contacts_invite.how_it_works')}
        </h4>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-start gap-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary text-xs font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-primary">{t('contacts_invite.registered_friends')}</p>
              <p className="text-muted-foreground">{t('contacts_invite.registered_desc')}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2 p-2 bg-accent/5 rounded-lg border border-accent/10">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-accent-foreground text-xs font-bold">2</span>
            </div>
            <div>
              <p className="font-medium">{t('contacts_invite.new_friends')}</p>
              <p className="text-muted-foreground">{t('contacts_invite.new_friends_desc')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
        <MessageSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
        <p className="text-xs text-green-700 dark:text-green-400">
          {t('contacts_invite.free_message')}
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
        onSent={handleAppSent}
      />
    </div>
  );
};
