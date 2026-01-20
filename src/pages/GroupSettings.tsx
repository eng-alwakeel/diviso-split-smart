import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGroupData } from "@/hooks/useGroupData";
import { useGroupArchive } from "@/hooks/useGroupArchive";
import { useGroupNotifications } from "@/hooks/useGroupNotifications";
import { useUsageCredits } from "@/hooks/useUsageCredits";
import { ZeroCreditsPaywall } from "@/components/credits/ZeroCreditsPaywall";
import { ArchiveGroupDialog } from "@/components/group/ArchiveGroupDialog";
import { DeleteGroupDialog } from "@/components/group/DeleteGroupDialog";
import { LeaveGroupDialog } from "@/components/group/LeaveGroupDialog";
import { InviteManagementDialog } from "@/components/group/InviteManagementDialog";
import { useTranslation } from "react-i18next";
import { 
  ArrowRight, 
  Copy, 
  Pencil, 
  Archive, 
  Trash2, 
  LogOut, 
  UserPlus,
  Loader2,
  Coins
} from "lucide-react";

const GroupSettings = () => {
  const navigate = useNavigate();
  const { id: rawId } = useParams();
  const { toast } = useToast();
  const { t } = useTranslation(["groups", "common"]);
  
  // Validate UUID
  const isValidUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  const id = rawId && rawId !== ":id" && isValidUUID(rawId) ? rawId : undefined;
  
  // State
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallAction, setPaywallAction] = useState<string>("update_group_settings");
  const [paywallCredits, setPaywallCredits] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Hooks
  const { loading, group, members, refetch } = useGroupData(id);
  const { archiveGroup, unarchiveGroup, isArchiving } = useGroupArchive();
  const { notifyMemberLeft, notifyGroupDeleted } = useGroupNotifications();
  const { checkCredits, consumeCredits, getActionCost } = useUsageCredits();
  
  // Get current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user?.id ?? null));
  }, []);
  
  // Update name when group loads
  useEffect(() => {
    if (group?.name) {
      setName(group.name);
    }
  }, [group?.name]);
  
  // Redirect if invalid ID
  useEffect(() => {
    if (rawId && (rawId === ":id" || !isValidUUID(rawId))) {
      toast({ title: t("common:invalid_id"), variant: "destructive" });
      navigate('/dashboard');
    }
  }, [rawId, navigate, toast, t]);
  
  // Permissions
  const isOwner = currentUserId != null && group?.owner_id === currentUserId;
  const isAdmin = useMemo(() => {
    if (!currentUserId) return false;
    const me = members.find(m => m.user_id === currentUserId);
    return me ? (me.role === "admin" || me.role === "owner") : false;
  }, [members, currentUserId]);
  const canAdmin = isOwner || isAdmin;
  // Check if group is archived via direct query since GroupRow type may not include archived_at
  const [isArchived, setIsArchived] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    supabase.from("groups").select("archived_at").eq("id", id).single()
      .then(({ data }) => setIsArchived(!!data?.archived_at));
  }, [id]);
  
  // Credit costs
  const renameCost = getActionCost("update_group_settings")?.cost || 1;
  const archiveCost = getActionCost("archive_group")?.cost || 1;
  const deleteCost = getActionCost("delete_group")?.cost || 2;
  const leaveCost = getActionCost("leave_group")?.cost || 1;
  
  const handleCopyId = async () => {
    if (!id) return;
    await navigator.clipboard.writeText(id);
    toast({ title: t("messages.copied") });
  };
  
  const handleRename = async () => {
    if (!id || !canAdmin) return;
    const newName = name.trim();
    if (!newName || newName === group?.name) return;
    
    const creditCheck = await checkCredits("update_group_settings");
    if (!creditCheck.canPerform) {
      if (creditCheck.blocked) {
        setPaywallAction("update_group_settings");
        setPaywallCredits(renameCost);
        setShowPaywall(true);
        return;
      }
      toast({ title: t("common:insufficient_credits"), variant: "destructive" });
      return;
    }
    
    setSaving(true);
    const { error } = await supabase.from("groups").update({ name: newName }).eq("id", id);
    
    if (error) {
      setSaving(false);
      toast({ title: t("settings.rename_failed"), variant: "destructive" });
      return;
    }
    
    await consumeCredits("update_group_settings");
    setSaving(false);
    toast({ title: t("settings.renamed") });
    refetch();
  };
  
  const handleArchive = async () => {
    if (!id) return;
    
    const actionType = isArchived ? "restore_group" : "archive_group";
    const creditCheck = await checkCredits(actionType);
    if (!creditCheck.canPerform) {
      if (creditCheck.blocked) {
        setPaywallAction(actionType);
        setPaywallCredits(archiveCost);
        setShowPaywall(true);
        return;
      }
      toast({ title: t("common:insufficient_credits"), variant: "destructive" });
      return;
    }
    
    if (isArchived) {
      unarchiveGroup(id);
    } else {
      archiveGroup(id);
    }
    
    await consumeCredits(actionType);
    setArchiveDialogOpen(false);
    navigate(`/group/${id}`);
  };
  
  const handleDelete = async () => {
    if (!id || !isOwner || !currentUserId) return;
    
    const creditCheck = await checkCredits("delete_group");
    if (!creditCheck.canPerform) {
      if (creditCheck.blocked) {
        setPaywallAction("delete_group");
        setPaywallCredits(deleteCost);
        setShowPaywall(true);
        return;
      }
      toast({ title: t("common:insufficient_credits"), variant: "destructive" });
      return;
    }
    
    setDeleting(true);
    await notifyGroupDeleted(id, group?.name || "", currentUserId);
    
    const { error } = await supabase.from("groups").delete().eq("id", id);
    
    if (error) {
      setDeleting(false);
      toast({ title: t("delete.failed"), variant: "destructive" });
      return;
    }
    
    await consumeCredits("delete_group");
    toast({ title: t("delete.success") });
    navigate('/my-groups');
  };
  
  const handleLeave = async () => {
    if (!id || !currentUserId || isOwner) return;
    
    const creditCheck = await checkCredits("leave_group");
    if (!creditCheck.canPerform) {
      if (creditCheck.blocked) {
        setPaywallAction("leave_group");
        setPaywallCredits(leaveCost);
        setShowPaywall(true);
        return;
      }
      toast({ title: t("common:insufficient_credits"), variant: "destructive" });
      return;
    }
    
    setLeaving(true);
    await notifyMemberLeft(id, group?.name || "", currentUserId);
    
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", id)
      .eq("user_id", currentUserId);
    
    if (error) {
      setLeaving(false);
      toast({ title: t("settings.leave_failed"), variant: "destructive" });
      return;
    }
    
    await consumeCredits("leave_group");
    toast({ title: t("settings.left") });
    navigate('/my-groups');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-dark-background pb-24">
      <SEO title={t("settings.title")} noIndex />
      <AppHeader />
      
      <div className="page-container space-y-4 pt-4">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/group/${id}`)}
          className="mb-2"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          {t("common:back")}
        </Button>
        
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-sm">{group?.name}</p>
        
        {/* Group Name Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              {t("group_name")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("group_name_placeholder")}
              disabled={!canAdmin}
            />
            <Button 
              onClick={handleRename} 
              disabled={!canAdmin || saving || name.trim() === group?.name}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <>
                  {t("common:save")}
                  <Badge variant="outline" className="mr-2 text-xs">
                    <Coins className="w-3 h-3 ml-1" />
                    {renameCost}
                  </Badge>
                </>
              )}
            </Button>
            {!canAdmin && (
              <p className="text-xs text-muted-foreground">{t("settings.only_admin_rename")}</p>
            )}
          </CardContent>
        </Card>
        
        {/* Invite Members Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              {t("invite.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="secondary" 
              onClick={() => setInviteDialogOpen(true)}
              className="w-full"
            >
              <UserPlus className="w-4 h-4 ml-2" />
              {t("invite.by_link")}
            </Button>
          </CardContent>
        </Card>
        
        {/* Group ID Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("settings.group_id")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={id ?? ""} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopyId}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">{t("settings.danger_zone", "منطقة الخطر")}</CardTitle>
            <CardDescription>{t("settings.danger_description", "إجراءات لا يمكن التراجع عنها")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Archive Button */}
            {canAdmin && (
              <Button 
                variant="outline" 
                onClick={() => setArchiveDialogOpen(true)}
                className="w-full justify-between"
              >
                <span className="flex items-center">
                  <Archive className="w-4 h-4 ml-2" />
                  {isArchived ? t("settings.restore", "استعادة المجموعة") : t("settings.archive")}
                </span>
                <Badge variant="outline" className="text-xs">
                  <Coins className="w-3 h-3 ml-1" />
                  {archiveCost}
                </Badge>
              </Button>
            )}
            
            <Separator />
            
            {/* Delete or Leave */}
            {isOwner ? (
              <Button 
                variant="destructive" 
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleting}
                className="w-full justify-between"
              >
                <span className="flex items-center">
                  {deleting ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 ml-2" />
                  )}
                  {t("settings.delete")}
                </span>
                <Badge variant="outline" className="text-xs bg-destructive/10">
                  <Coins className="w-3 h-3 ml-1" />
                  {deleteCost}
                </Badge>
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={() => setLeaveDialogOpen(true)}
                disabled={leaving}
                className="w-full justify-between"
              >
                <span className="flex items-center">
                  {leaving ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 ml-2" />
                  )}
                  {t("settings.leave")}
                </span>
                <Badge variant="outline" className="text-xs bg-destructive/10">
                  <Coins className="w-3 h-3 ml-1" />
                  {leaveCost}
                </Badge>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      
      <BottomNav />
      
      {/* Dialogs */}
      <InviteManagementDialog 
        open={inviteDialogOpen} 
        onOpenChange={setInviteDialogOpen} 
        groupId={id} 
        groupName={group?.name}
        existingMembers={members.map(m => m.user_id).filter(Boolean)}
      />
      
      <ArchiveGroupDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        groupName={group?.name || ""}
        isArchived={isArchived}
        isLoading={isArchiving}
        onConfirm={handleArchive}
      />
      
      {id && (
        <DeleteGroupDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          groupName={group?.name || ""}
          onConfirm={handleDelete}
          isDeleting={deleting}
        />
      )}
      
      <LeaveGroupDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        groupName={group?.name || ""}
        onConfirm={handleLeave}
        isLeaving={leaving}
      />
      
      <ZeroCreditsPaywall
        open={showPaywall}
        onOpenChange={setShowPaywall}
        actionName={paywallAction}
        requiredCredits={paywallCredits}
      />
    </div>
  );
};

export default GroupSettings;
