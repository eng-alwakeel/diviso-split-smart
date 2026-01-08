import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuotaHandler } from "@/hooks/useQuotaHandler";
import { Copy, Link, RefreshCw, Users, Clock, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { BRAND_CONFIG } from "@/lib/brandConfig";

interface InviteLinkTabProps {
  groupId: string | undefined;
  groupName?: string;
  onLinkGenerated: (link: string) => void;
}

const isUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export const InviteLinkTab = ({ groupId, groupName, onLinkGenerated }: InviteLinkTabProps) => {
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
      const url = `${BRAND_CONFIG.url}/i/${tokenData.token}`;
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

  const shareLink = async () => {
    if (!link) return;
    
    const shareTitle = `انضم لـ ${groupName || 'المجموعة'}`;
    
    try {
      // Native platform (Capacitor)
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: shareTitle,
          text: `انضم إلى "${groupName || 'المجموعة'}" على ديفيسو`,
          url: link,
          dialogTitle: 'شارك رابط الدعوة'
        });
        toast({ title: "تمت المشاركة" });
        return;
      }
      
      // Web Share API - بدون text للتوافقية الأفضل
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          url: link
        });
        toast({ title: "تمت المشاركة" });
        return;
      }
      
      // Fallback
      await copyLink();
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("[InviteLinkTab] share error:", error);
        await copyLink();
      }
    }
  };

  const generateAndShare = async () => {
    if (!link) {
      await generateLink();
    }
    // سيتم مشاركة الرابط بعد إنشائه عبر useEffect
  };

  return (
    <div className="space-y-4">
      {!link ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Share2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">شارك رابط الدعوة</h3>
            <p className="text-sm text-muted-foreground mt-1">
              أنشئ رابط دعوة وشاركه عبر أي تطبيق تفضله
            </p>
          </div>
          
          {disabledReason && (
            <p className="text-xs text-destructive">{disabledReason}</p>
          )}
          
          <Button 
            size="lg"
            className="w-full"
            onClick={generateLink} 
            disabled={!!disabledReason || loading}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Link className="w-4 h-4 ml-2" />
            )}
            إنشاء رابط الدعوة
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label>رابط الدعوة</Label>
            <div className="flex gap-2">
              <Input 
                value={link} 
                readOnly 
                className="text-xs"
              />
              <Button 
                variant="outline" 
                onClick={copyLink} 
                className="shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button 
            size="lg"
            className="w-full bg-primary hover:bg-primary/90"
            onClick={shareLink}
          >
            <Share2 className="w-4 h-4 ml-2" />
            شارك الرابط
          </Button>

          <div className="p-3 bg-accent/10 rounded-lg border border-accent/20 space-y-2">
            <p className="text-sm text-accent font-medium">✅ الرابط جاهز للمشاركة</p>
            
            <div className="flex items-center gap-2 flex-wrap">
              {linkInfo && (
                <>
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
                </>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              شارك الرابط عبر واتساب، تيليجرام، أو أي تطبيق آخر
            </p>
          </div>

          <Button 
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={generateLink}
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 ml-1 ${loading ? 'animate-spin' : ''}`} />
            إنشاء رابط جديد
          </Button>
        </>
      )}
    </div>
  );
};