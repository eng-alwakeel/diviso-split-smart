import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { InviteLinkTab } from "@/components/group/invite-tabs/InviteLinkTab";
import { InviteContactsTab } from "@/components/group/invite-tabs/InviteContactsTab";
import { InviteTrackingTab } from "@/components/group/invite-tabs/InviteTrackingTab";
import { KnownPeopleTab } from "@/components/group/invite-tabs/KnownPeopleTab";
import { useGroupInvites } from "@/hooks/useGroupInvites";
import { useTranslation } from "react-i18next";
import { 
  Link, 
  Users, 
  UserCheck,
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
  const { t } = useTranslation("groups");
  const { invites, loading, fetchInvites } = useGroupInvites(groupId);
  const [activeTab, setActiveTab] = useState("known");
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    if (open && groupId) {
      fetchInvites();
    }
  }, [open, groupId, fetchInvites]);

  useEffect(() => {
    if (!open) {
      setInviteLink("");
      setActiveTab("known");
    }
  }, [open]);

  const handleLinkGenerated = (link: string) => {
    setInviteLink(link);
  };

  const handleInviteSent = async () => {
    fetchInvites();
    
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
      description: "تم إرسال الدعوة بنجاح",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[85vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            دعوة أعضاء جدد
          </DialogTitle>
          <DialogDescription>
            شارك رابط الدعوة لمجموعة "{groupName}"
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-1">
            <TabsTrigger value="known" className="flex items-center gap-1 text-[10px] sm:text-xs px-1 sm:px-2">
              <UserCheck className="w-3 h-3 shrink-0" />
              <span className="truncate">{t("known_people.tab_label")}</span>
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-1 text-[10px] sm:text-xs px-1 sm:px-2">
              <Link className="w-3 h-3 shrink-0" />
              <span className="truncate">رابط</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-1 text-[10px] sm:text-xs px-1 sm:px-2">
              <Users className="w-3 h-3 shrink-0" />
              <span className="truncate">جهات</span>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-1 text-[10px] sm:text-xs px-1 sm:px-2">
              <History className="w-3 h-3 shrink-0" />
              <span className="truncate">متابعة</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="known" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserCheck className="w-4 h-4" />
                  {t("known_people.title")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{t("known_people.subtitle")}</p>
              </CardHeader>
              <CardContent>
                <KnownPeopleTab
                  groupId={groupId}
                  existingMembers={existingMembers}
                  onMemberAdded={fetchInvites}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <InviteLinkTab
                  groupId={groupId}
                  groupName={groupName}
                  onLinkGenerated={handleLinkGenerated}
                  onInviteSent={handleInviteSent}
                />
                
                {inviteLink && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4" />
                        <span className="font-medium text-sm">رمز QR للدعوة</span>
                      </div>
                      <div className="flex justify-center">
                        <QRCodeDisplay 
                          value={inviteLink} 
                          size={180}
                          showActions={false}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
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
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
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

        <DialogFooter className="mt-4 pt-4 border-t border-border">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground"
          >
            تخطي الآن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};