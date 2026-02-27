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
import { KnownPeopleTab } from "@/components/group/invite-tabs/KnownPeopleTab";
import { usePendingGroupInvites } from "@/hooks/usePendingGroupInvites";
import { useGroupInviteActions } from "@/hooks/useGroupInviteActions";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Link, 
  Users, 
  UserCheck,
  History,
  QrCode,
  Clock,
  XCircle,
  Loader2
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
  const [activeTab, setActiveTab] = useState("known");
  const [inviteLink, setInviteLink] = useState("");
  const { pendingInvites, isLoading: pendingLoading, invalidate } = usePendingGroupInvites(groupId);
  const { cancelInvite, loading: actionLoading } = useGroupInviteActions();

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
    invalidate();
    
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

  const handleCancelInvite = async (inviteId: string) => {
    const result = await cancelInvite(inviteId);
    if (result.success) {
      invalidate();
    }
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
          <TabsList className="grid w-full grid-cols-3 gap-1">
            <TabsTrigger value="known" className="flex items-center gap-1 text-[10px] sm:text-xs px-1 sm:px-2">
              <UserCheck className="w-3 h-3 shrink-0" />
              <span className="truncate">{t("known_people.tab_label")}</span>
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-1 text-[10px] sm:text-xs px-1 sm:px-2">
              <Link className="w-3 h-3 shrink-0" />
              <span className="truncate">رابط</span>
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
                  onMemberAdded={() => {
                    handleInviteSent();
                  }}
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

          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="w-4 h-4" />
                  متابعة الدعوات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PendingInvitesList
                  invites={pendingInvites}
                  loading={pendingLoading}
                  actionLoading={actionLoading}
                  onCancel={handleCancelInvite}
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

// --- Inline sub-component for pending invites list ---

import type { PendingGroupInvite } from "@/hooks/usePendingGroupInvites";

function PendingInvitesList({
  invites,
  loading,
  actionLoading,
  onCancel,
}: {
  invites: PendingGroupInvite[];
  loading: boolean;
  actionLoading: boolean;
  onCancel: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-2">لا توجد دعوات معلقة</h3>
        <p className="text-sm text-muted-foreground">
          استخدم تبويب "أشخاص تعرفهم" لإرسال دعوات
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={invite.invited_user_avatar || undefined} />
              <AvatarFallback className="text-xs">
                {invite.invited_user_name?.slice(0, 2) || "؟"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{invite.invited_user_name}</p>
              <Badge variant="outline" className="mt-1 text-[10px] gap-1">
                <Clock className="w-3 h-3" />
                قيد الانتظار
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive shrink-0"
            disabled={actionLoading}
            onClick={() => onCancel(invite.id)}
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
