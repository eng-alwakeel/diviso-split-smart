
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Link, RefreshCw } from "lucide-react";

interface InviteByLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string | undefined;
}

const isUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export const InviteByLinkDialog = ({ open, onOpenChange, groupId }: InviteByLinkDialogProps) => {
  const { toast } = useToast();
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  const disabledReason = useMemo(() => {
    if (!groupId) return "لا يوجد معرف مجموعة.";
    if (!isUUID(groupId)) return "هذه مجموعة تجريبية، افتح مجموعة حقيقية (UUID) لتفعيل الدعوات.";
    return null;
  }, [groupId]);

  useEffect(() => {
    if (!open) {
      setLink("");
    }
  }, [open]);

  const generateLink = async () => {
    if (disabledReason) {
      toast({ title: "لا يمكن إنشاء الدعوة", description: disabledReason, variant: "destructive" });
      return;
    }
    setLoading(true);
    console.log("[InviteByLinkDialog] creating token for group:", groupId);
    const { data, error } = await supabase
      .from("group_join_tokens")
      .insert({ group_id: groupId })
      .select("token")
      .single();

    setLoading(false);

    if (error) {
      console.error("[InviteByLinkDialog] insert token error:", error);
      toast({
        title: "تعذر إنشاء رابط الدعوة",
        description: error.message || "تحقق من أنك مدير للمجموعة ومسجل دخول.",
        variant: "destructive",
      });
      return;
    }

    const token = data?.token as string;
    const url = `${window.location.origin}/i/${token}`;
    setLink(url);
    toast({ title: "تم إنشاء رابط الدعوة", description: "انسخ الرابط وشاركه مع الأعضاء." });
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast({ title: "تم النسخ", description: "تم نسخ رابط الدعوة إلى الحافظة." });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>دعوة عضو جديد</DialogTitle>
          <DialogDescription>أنشئ رابط دعوة لمشاركة الانضمام إلى المجموعة.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>معرف المجموعة</Label>
            <Input value={groupId || ""} readOnly />
            {disabledReason && <p className="text-xs text-destructive mt-1">{disabledReason}</p>}
          </div>

          <div className="flex gap-2">
            <Button className="flex items-center gap-2" onClick={generateLink} disabled={!!disabledReason || loading}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
              إنشاء رابط دعوة
            </Button>
          </div>

          <div className="space-y-2">
            <Label>الرابط</Label>
            <div className="flex gap-2">
              <Input value={link} readOnly placeholder="سيظهر الرابط هنا بعد الإنشاء" />
              <Button variant="outline" onClick={copyLink} disabled={!link} className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
