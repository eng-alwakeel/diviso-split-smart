import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { InviteLinkTab } from "@/components/group/invite-tabs/InviteLinkTab";
import { InvitePhoneTab } from "@/components/group/invite-tabs/InvitePhoneTab";
import { InviteEmailTab } from "@/components/group/invite-tabs/InviteEmailTab";
import { InviteContactsTab } from "@/components/group/invite-tabs/InviteContactsTab";
import { InviteTrackingTab } from "@/components/group/invite-tabs/InviteTrackingTab";
import { useGroupInvites } from "@/hooks/useGroupInvites";
import { 
  Link, 
  Smartphone, 
  Mail, 
  Users, 
  History,
  QrCode
} from "lucide-react";

interface InviteManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string | undefined;
  groupName?: string;
  existingMembers?: string[];
}

export const InviteManagementDialog = ({ 
  open, 
  onOpenChange, 
  groupId, 
  groupName, 
  existingMembers = [] 
}: InviteManagementDialogProps) => {
  const { toast } = useToast();
  const { invites, loading, fetchInvites } = useGroupInvites(groupId);
  const [activeTab, setActiveTab] = useState("link");
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    if (open && groupId) {
      fetchInvites();
    }
  }, [open, groupId, fetchInvites]);

  useEffect(() => {
    if (!open) {
      setInviteLink("");
      setActiveTab("link");
    }
  }, [open]);

  const handleLinkGenerated = (link: string) => {
    setInviteLink(link);
  };

  const handleInviteSent = async () => {
    fetchInvites(); // Refresh invite list
    
    // Update onboarding task - first invite sent
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('complete_onboarding_task', {
          p_task_name: 'invite',
          p_user_id: user.id
        });
      }
    } catch (error) {
      console.error('Error updating onboarding task:', error);
    }
    
    toast({
      title: "تم إرسال الدعوة",
      description: "تم إرسال الدعوة بنجاح وإضافتها للمتابعة",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            إدارة دعوات المجموعة
          </DialogTitle>
          <DialogDescription>
            دعوة أعضاء جدد وإدارة الدعوات المرسلة لمجموعة "{groupName}"
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="link" className="flex items-center gap-1 text-xs">
              <Link className="w-3 h-3" />
              رابط
            </TabsTrigger>
            <TabsTrigger value="phone" className="flex items-center gap-1 text-xs">
              <Smartphone className="w-3 h-3" />
              جوال
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1 text-xs">
              <Mail className="w-3 h-3" />
              إيميل
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-1 text-xs">
              <Users className="w-3 h-3" />
              جهات
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-1 text-xs">
              <History className="w-3 h-3" />
              المتابعة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  دعوة بالرابط
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InviteLinkTab
                  groupId={groupId}
                  onLinkGenerated={handleLinkGenerated}
                />
                
                {inviteLink && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4" />
                        <span className="font-medium">رمز QR للدعوة</span>
                      </div>
                      <div className="flex justify-center">
                        <QRCodeDisplay 
                          value={inviteLink} 
                          size={200}
                          className="border rounded-lg p-4 bg-background"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        يمكن للأعضاء مسح هذا الرمز للانضمام مباشرة
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phone" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  دعوة برقم الجوال
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InvitePhoneTab
                  groupId={groupId}
                  groupName={groupName}
                  inviteLink={inviteLink}
                  onInviteSent={handleInviteSent}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  دعوة بالبريد الإلكتروني
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InviteEmailTab
                  groupId={groupId}
                  groupName={groupName}
                  inviteLink={inviteLink}
                  onInviteSent={handleInviteSent}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  دعوة من جهات الاتصال
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InviteContactsTab
                  groupId={groupId}
                  groupName={groupName}
                  existingMembers={existingMembers}
                  onInviteSent={handleInviteSent}
                  inviteLink={inviteLink}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  متابعة الدعوات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InviteTrackingTab
                  invites={invites}
                  loading={loading}
                  onInviteAction={fetchInvites}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};