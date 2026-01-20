import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, ExternalLink, LogOut, Pencil, Trash2, Archive } from "lucide-react";
import { useGroupArchive } from "@/hooks/useGroupArchive";
import { useGroupNotifications } from "@/hooks/useGroupNotifications";
import { ArchiveGroupDialog } from "./ArchiveGroupDialog";
import { DeleteGroupDialog } from "./DeleteGroupDialog";
import { LeaveGroupDialog } from "./LeaveGroupDialog";
import { useTranslation } from "react-i18next";

interface GroupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  groupName?: string | null;
  isOwner: boolean;
  canAdmin: boolean;
  onOpenInvite: () => void;
  onRenamed?: (newName: string) => void;
  onLeftGroup?: () => void;
  onGroupDeleted?: () => void;
}

export const GroupSettingsDialog = ({
  open,
  onOpenChange,
  groupId,
  groupName,
  isOwner,
  canAdmin,
  onOpenInvite,
  onRenamed,
  onLeftGroup,
  onGroupDeleted,
}: GroupSettingsDialogProps) => {
  const { t } = useTranslation(["groups", "common"]);
  const { toast } = useToast();
  const [name, setName] = useState<string>(groupName ?? "");
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const { archiveGroup, isArchiving } = useGroupArchive();
  const { notifyMemberLeft, notifyGroupDeleted } = useGroupNotifications();

  useEffect(() => {
    if (open) setName(groupName ?? "");
  }, [open, groupName]);

  const handleCopyId = async () => {
    if (!groupId) return;
    await navigator.clipboard.writeText(groupId);
    toast({ title: t("messages.copied", "تم النسخ"), description: t("common:copied_to_clipboard", "تم نسخ معرف المجموعة.") });
  };

  const handleRename = async () => {
    if (!groupId) return;
    if (!canAdmin) {
      toast({ title: t("common:insufficient_permissions", "صلاحيات غير كافية"), description: t("settings.only_admin_rename", "فقط المالك/المدير يمكنه تغيير الاسم."), variant: "destructive" });
      return;
    }
    const newName = name.trim();
    if (!newName || newName === groupName) return;

    setSaving(true);
    const { error } = await supabase
      .from("groups")
      .update({ name: newName })
      .eq("id", groupId);
    setSaving(false);

    if (error) {
      console.error("[GroupSettingsDialog] rename error", error);
      toast({ title: t("settings.rename_failed", "تعذر حفظ الاسم"), description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: t("settings.renamed", "تم تحديث اسم المجموعة") });
    onRenamed?.(newName);
    onOpenChange(false);
  };

  const handleLeave = async () => {
    if (!groupId) return;
    if (isOwner) {
      toast({ title: t("settings.owner_cannot_leave", "لا يمكن للمالك مغادرة المجموعة"), description: t("settings.assign_owner_first", "عيّن مالكاً آخر أولاً."), variant: "destructive" });
      return;
    }

    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      toast({ title: t("common:login_required", "تسجيل الدخول مطلوب"), variant: "destructive" });
      return;
    }

    setLeaving(true);
    
    // Notify other members before leaving
    await notifyMemberLeft(groupId, groupName || "", uid);
    
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", uid);
    setLeaving(false);

    if (error) {
      console.error("[GroupSettingsDialog] leave error", error);
      toast({ title: t("settings.leave_failed", "تعذر مغادرة المجموعة"), description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: t("settings.left", "تمت مغادرة المجموعة") });
    setLeaveDialogOpen(false);
    onOpenChange(false);
    onLeftGroup?.();
  };

  const handleArchive = () => {
    if (!groupId) return;
    archiveGroup(groupId);
    setArchiveDialogOpen(false);
    onOpenChange(false);
  };

  const handleDeleteGroup = async () => {
    if (!groupId || !isOwner) return;

    setDeleting(true);

    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: t("common:login_required", "تسجيل الدخول مطلوب"), variant: "destructive" });
        setDeleting(false);
        return;
      }

      // Notify members before deletion
      await notifyGroupDeleted(groupId, groupName || "", user.id);

      // حذف المجموعة مباشرة - قاعدة البيانات ستحذف السجلات المرتبطة تلقائياً (ON DELETE CASCADE)
      const { error } = await supabase.from("groups").delete().eq("id", groupId);

      if (error) {
        console.error("[GroupSettingsDialog] delete error", error);
        toast({ 
          title: t("delete.failed", "تعذر حذف المجموعة"), 
          description: error.message, 
          variant: "destructive" 
        });
        setDeleting(false);
        return;
      }

      toast({ title: t("delete.success", "تم حذف المجموعة بنجاح") });
      setDeleteDialogOpen(false);
      onOpenChange(false);
      onGroupDeleted?.();
    } catch (error) {
      console.error("[GroupSettingsDialog] unexpected error", error);
      toast({ 
        title: t("common:unexpected_error", "حدث خطأ غير متوقع"), 
        description: t("common:try_again", "حاول مرة أخرى"), 
        variant: "destructive" 
      });
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("settings.title", "إعدادات المجموعة")}</DialogTitle>
            <DialogDescription>{t("settings.description", "تعديل الاسم، إرسال دعوات أو مغادرة المجموعة.")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="groupName">{t("group_name", "اسم المجموعة")}</Label>
              <div className="flex gap-2">
                <Input
                  id="groupName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("group_name_placeholder", "اسم المجموعة")}
                  disabled={!canAdmin}
                />
                <Button onClick={handleRename} disabled={!canAdmin || saving || name.trim() === (groupName ?? "") }>
                  <Pencil className="w-4 h-4 ml-2" /> {t("common:save", "حفظ")}
                </Button>
              </div>
              {!canAdmin && (
                <p className="text-xs text-muted-foreground">{t("settings.only_admin_rename", "فقط المالك/المدير يمكنه تعديل الاسم.")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("invite.title", "دعوات الأعضاء")}</Label>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { onOpenInvite(); onOpenChange(false); }}>
                  <ExternalLink className="w-4 h-4 ml-2" /> {t("invite.by_link", "إنشاء رابط دعوة")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("settings.group_id", "معرّف المجموعة")}</Label>
              <div className="flex gap-2">
                <Input value={groupId ?? ""} readOnly />
                <Button variant="outline" onClick={handleCopyId}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="pt-2 space-y-3 border-t">
              {/* Archive Button - for owner and admin */}
              {canAdmin && (
                <Button 
                  variant="outline" 
                  onClick={() => setArchiveDialogOpen(true)} 
                  className="w-full"
                >
                  <Archive className="w-4 h-4 ml-2" /> 
                  {t("settings.archive", "أرشفة المجموعة")}
                </Button>
              )}

              {isOwner ? (
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteDialogOpen(true)} 
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 ml-2" /> 
                  {t("settings.delete", "حذف المجموعة")}
                </Button>
              ) : (
                <Button variant="destructive" onClick={() => setLeaveDialogOpen(true)} disabled={leaving} className="w-full">
                  <LogOut className="w-4 h-4 ml-2" /> {t("settings.leave", "مغادرة المجموعة")}
                </Button>
              )}
            </div>
          </div>

          <DialogFooter />
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <ArchiveGroupDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        groupName={groupName || ""}
        isArchived={false}
        isLoading={isArchiving}
        onConfirm={handleArchive}
      />

      {/* Delete Confirmation Dialog */}
      {groupId && (
        <DeleteGroupDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          groupName={groupName || ""}
          onConfirm={handleDeleteGroup}
          isDeleting={deleting}
        />
      )}

      {/* Leave Confirmation Dialog */}
      <LeaveGroupDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        groupName={groupName || ""}
        onConfirm={handleLeave}
        isLeaving={leaving}
      />
    </>
  );
};
