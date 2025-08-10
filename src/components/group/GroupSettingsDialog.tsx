import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, ExternalLink, LogOut, Pencil } from "lucide-react";

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
}: GroupSettingsDialogProps) => {
  const { toast } = useToast();
  const [name, setName] = useState<string>(groupName ?? "");
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (open) setName(groupName ?? "");
  }, [open, groupName]);

  const handleCopyId = async () => {
    if (!groupId) return;
    await navigator.clipboard.writeText(groupId);
    toast({ title: "تم النسخ", description: "تم نسخ معرف المجموعة." });
  };

  const handleRename = async () => {
    if (!groupId) return;
    if (!canAdmin) {
      toast({ title: "صلاحيات غير كافية", description: "فقط المالك/المدير يمكنه تغيير الاسم.", variant: "destructive" });
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
      toast({ title: "تعذر حفظ الاسم", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "تم تحديث اسم المجموعة" });
    onRenamed?.(newName);
    onOpenChange(false);
  };

  const handleLeave = async () => {
    if (!groupId) return;
    if (isOwner) {
      toast({ title: "لا يمكن للمالك مغادرة المجموعة", description: "عيّن مالكاً آخر أولاً.", variant: "destructive" });
      return;
    }
    const confirm = window.confirm("هل ترغب حقاً في مغادرة هذه المجموعة؟");
    if (!confirm) return;

    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      toast({ title: "تسجيل الدخول مطلوب", variant: "destructive" });
      return;
    }

    setLeaving(true);
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", uid);
    setLeaving(false);

    if (error) {
      console.error("[GroupSettingsDialog] leave error", error);
      toast({ title: "تعذر مغادرة المجموعة", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "تمت مغادرة المجموعة" });
    onOpenChange(false);
    onLeftGroup?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إعدادات المجموعة</DialogTitle>
          <DialogDescription>تعديل الاسم، إرسال دعوات أو مغادرة المجموعة.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="groupName">اسم المجموعة</Label>
            <div className="flex gap-2">
              <Input
                id="groupName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم المجموعة"
                disabled={!canAdmin}
              />
              <Button onClick={handleRename} disabled={!canAdmin || saving || name.trim() === (groupName ?? "") }>
                <Pencil className="w-4 h-4 ml-2" /> حفظ
              </Button>
            </div>
            {!canAdmin && (
              <p className="text-xs text-muted-foreground">فقط المالك/المدير يمكنه تعديل الاسم.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>دعوات الأعضاء</Label>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { onOpenInvite(); onOpenChange(false); }}>
                <ExternalLink className="w-4 h-4 ml-2" /> إنشاء رابط دعوة
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>معرّف المجموعة</Label>
            <div className="flex gap-2">
              <Input value={groupId ?? ""} readOnly />
              <Button variant="outline" onClick={handleCopyId}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="destructive" onClick={handleLeave} disabled={isOwner || leaving} className="w-full">
              <LogOut className="w-4 h-4 ml-2" /> مغادرة المجموعة
            </Button>
            {isOwner && (
              <p className="text-xs text-destructive mt-2">لا يمكن للمالك مغادرة المجموعة. عيّن مالكاً آخر أولاً.</p>
            )}
          </div>
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
};
