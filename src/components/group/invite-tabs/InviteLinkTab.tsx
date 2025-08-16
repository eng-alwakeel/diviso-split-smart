import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuotaHandler } from "@/hooks/useQuotaHandler";
import { Copy, Link, RefreshCw } from "lucide-react";

interface InviteLinkTabProps {
  groupId: string | undefined;
  onLinkGenerated: (link: string) => void;
}

const isUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export const InviteLinkTab = ({ groupId, onLinkGenerated }: InviteLinkTabProps) => {
  const { toast } = useToast();
  const { handleQuotaError } = useQuotaHandler();
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  const disabledReason = useMemo(() => {
    if (!groupId) return "لا يوجد معرف مجموعة.";
    if (!isUUID(groupId)) return "هذه مجموعة تجريبية، افتح مجموعة حقيقية لتفعيل الدعوات.";
    return null;
  }, [groupId]);

  const generateLink = async () => {
    if (disabledReason) {
      toast({ title: "لا يمكن إنشاء الدعوة", description: disabledReason, variant: "destructive" });
      return;
    }
    
    setLoading(true);
    console.log("[InviteLinkTab] creating token for group:", groupId);
    
    const { data, error } = await supabase
      .from("group_join_tokens")
      .insert({ group_id: groupId })
      .select("token")
      .single();

    setLoading(false);

    if (error) {
      console.error("[InviteLinkTab] insert token error:", error);
      
      if (!handleQuotaError(error)) {
        toast({
          title: "تعذر إنشاء رابط الدعوة",
          description: error.message || "تحقق من أنك مدير للمجموعة ومسجل دخول.",
          variant: "destructive",
        });
      }
      return;
    }

    const token = data?.token as string;
    const url = `${window.location.origin}/i/${token}`;
    setLink(url);
    onLinkGenerated(url);
    
    toast({ 
      title: "تم إنشاء رابط الدعوة", 
      description: "انسخ الرابط أو استخدم رمز QR لمشاركته." 
    });
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast({ title: "تم النسخ", description: "تم نسخ رابط الدعوة إلى الحافظة." });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>معرف المجموعة</Label>
        <Input value={groupId || ""} readOnly />
        {disabledReason && (
          <p className="text-xs text-destructive mt-1">{disabledReason}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button 
          className="flex items-center gap-2" 
          onClick={generateLink} 
          disabled={!!disabledReason || loading}
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Link className="w-4 h-4" />
          )}
          إنشاء رابط دعوة
        </Button>
      </div>

      <div className="space-y-2">
        <Label>الرابط المُنشأ</Label>
        <div className="flex gap-2">
          <Input 
            value={link} 
            readOnly 
            placeholder="سيظهر الرابط هنا بعد الإنشاء" 
          />
          <Button 
            variant="outline" 
            onClick={copyLink} 
            disabled={!link} 
            className="shrink-0"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {link && (
        <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
          <p className="text-sm text-accent font-medium mb-1">✅ الرابط جاهز للمشاركة</p>
          <p className="text-xs text-muted-foreground">
            يمكن للأعضاء الجدد استخدام هذا الرابط أو رمز QR للانضمام للمجموعة
          </p>
        </div>
      )}
    </div>
  );
};