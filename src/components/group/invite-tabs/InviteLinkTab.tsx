import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuotaHandler } from "@/hooks/useQuotaHandler";
import { Copy, Link, RefreshCw, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [linkInfo, setLinkInfo] = useState<{
    maxUses: number;
    currentUses: number;
    expiresAt: string;
  } | null>(null);

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
    
    try {
      const { data, error } = await supabase.rpc('create_group_join_token', {
        p_group_id: groupId,
        p_role: 'member',
        p_link_type: 'general'
      });

      if (error) throw error;

      const tokenData = data[0];
      const url = `${window.location.origin}/i/${tokenData.token}`;
      setLink(url);
      setLinkInfo({
        maxUses: tokenData.max_uses,
        currentUses: 0,
        expiresAt: tokenData.expires_at
      });
      onLinkGenerated(url);
      
      const maxUsesText = tokenData.max_uses === -1 ? "غير محدود" : `${tokenData.max_uses} مستخدمين`;
      const expiresAt = new Date(tokenData.expires_at);
      const hoursLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
      
      toast({ 
        title: "تم إنشاء رابط الدعوة", 
        description: `العدد المسموح: ${maxUsesText}، صالح لـ ${hoursLeft} ساعة`
      });
    } catch (error: any) {
      console.error("[InviteLinkTab] create token error:", error);
      
      if (!handleQuotaError(error)) {
        toast({
          title: "تعذر إنشاء رابط الدعوة",
          description: error.message || "تحقق من أنك مدير للمجموعة ومسجل دخول.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
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

      {link && linkInfo && (
        <div className="p-3 bg-accent/10 rounded-lg border border-accent/20 space-y-2">
          <p className="text-sm text-accent font-medium mb-2">✅ الرابط جاهز للمشاركة</p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {linkInfo.maxUses === -1 ? "غير محدود" : `${linkInfo.currentUses}/${linkInfo.maxUses}`}
            </Badge>
            
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {(() => {
                const expiresAt = new Date(linkInfo.expiresAt);
                const hoursLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
                return `${hoursLeft} ساعة متبقية`;
              })()}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground">
            يمكن للأعضاء الجدد استخدام هذا الرابط أو رمز QR للانضمام للمجموعة
          </p>
        </div>
      )}
    </div>
  );
};