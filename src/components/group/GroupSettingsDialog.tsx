import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, ExternalLink, LogOut, Pencil, Trash2 } from "lucide-react";

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
  const { toast } = useToast();
  const [name, setName] = useState<string>(groupName ?? "");
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteGroup = async () => {
    if (!groupId || !isOwner) return;

    // التحقق من عدم وجود مصاريف
    const { count: expenseCount } = await supabase
      .from("expenses")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId);

    if (expenseCount && expenseCount > 0) {
      toast({ 
        title: "لا يمكن حذف المجموعة", 
        description: "يجب حذف جميع المصاريف أولاً", 
        variant: "destructive" 
      });
      return;
    }

    // التحقق من عدم وجود أعضاء آخرين (المالك فقط)
    const { count: memberCount } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId);

    if (memberCount && memberCount > 1) {
      toast({ 
        title: "لا يمكن حذف المجموعة", 
        description: "يجب إزالة جميع الأعضاء أولاً", 
        variant: "destructive" 
      });
      return;
    }

    // تأكيد مزدوج
    const firstConfirm = window.confirm("هل أنت متأكد من حذف هذه المجموعة؟ هذا الإجراء لا يمكن التراجع عنه.");
    if (!firstConfirm) return;

    const secondConfirm = window.confirm("تأكيد أخير: سيتم حذف المجموعة نهائياً. هل تريد المتابعة؟");
    if (!secondConfirm) return;

    setDeleting(true);

    try {
      // حذف الدعوات المعلقة
      await supabase.from("invites").delete().eq("group_id", groupId);
      
      // حذف رموز الانضمام
      await supabase.from("group_join_tokens").delete().eq("group_id", groupId);
      
      // حذف عضوية المالك
      await supabase.from("group_members").delete().eq("group_id", groupId);
      
      // حذف المجموعة
      const { error } = await supabase.from("groups").delete().eq("id", groupId);

      if (error) {
        console.error("[GroupSettingsDialog] delete error", error);
        toast({ 
          title: "تعذر حذف المجموعة", 
          description: error.message, 
          variant: "destructive" 
        });
        return;
      }

      toast({ title: "تم حذف المجموعة بنجاح" });
      onOpenChange(false);
      onGroupDeleted?.();
    } catch (error) {
      console.error("[GroupSettingsDialog] unexpected error", error);
      toast({ 
        title: "حدث خطأ غير متوقع", 
        description: "حاول مرة أخرى", 
        variant: "destructive" 
      });
    } finally {
      setDeleting(false);
    }
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

          <div className="pt-2 space-y-3">
            {isOwner ? (
              <Button 
                variant="destructive" 
                onClick={handleDeleteGroup} 
                disabled={deleting} 
                className="w-full"
              >
                <Trash2 className="w-4 h-4 ml-2" /> 
                {deleting ? "جاري الحذف..." : "حذف المجموعة"}
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleLeave} disabled={leaving} className="w-full">
                <LogOut className="w-4 h-4 ml-2" /> مغادرة المجموعة
              </Button>
            )}
            
            {isOwner && (
              <p className="text-xs text-muted-foreground">
                يمكن حذف المجموعة فقط إذا كانت فارغة (بدون أعضاء أو مصاريف)
              </p>
            )}
          </div>
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
};
