import { useEffect, useMemo, useState } from "react";
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
import { useTranslation } from "react-i18next";

interface InviteLinkTabProps {
  groupId: string | undefined;
  groupName?: string;
  onLinkGenerated: (link: string) => void;
  onInviteSent?: () => void;
}

const isUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export const InviteLinkTab = ({ groupId, groupName, onLinkGenerated, onInviteSent }: InviteLinkTabProps) => {
  const { toast } = useToast();
  const { handleQuotaError } = useQuotaHandler();
  const { t } = useTranslation(['groups']);
  const [displayLink, setDisplayLink] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [linkInfo, setLinkInfo] = useState<{
    maxUses: number;
    currentUses: number;
    expiresAt: string;
  } | null>(null);

  // جلب اسم المرسل
  useEffect(() => {
    const fetchSenderName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        setSenderName(data?.name || '');
      }
    };
    fetchSenderName();
  }, []);

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
      // Use direct app URL for both display and sharing
      const displayUrl = `${BRAND_CONFIG.url}/i/${tokenData.token}`;
      
      setDisplayLink(displayUrl);
      setShareLink(displayUrl);
      setLinkInfo({
        maxUses: tokenData.max_uses,
        currentUses: 0,
        expiresAt: tokenData.expires_at
      });
      onLinkGenerated(displayUrl);
      
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
    if (!shareLink) return;
    // Copy shareLink (Edge Function URL) for social preview
    await navigator.clipboard.writeText(shareLink);
    toast({ title: "تم النسخ", description: "تم نسخ رابط الدعوة إلى الحافظة." });
    // اعتبار نسخ الرابط كإرسال دعوة لتحديث مهمة الـ onboarding
    onInviteSent?.();
  };

  const shareInviteLink = async () => {
    if (!shareLink) return;
    
    // حساب المدة المتبقية
    const hoursLeft = linkInfo 
      ? Math.ceil((new Date(linkInfo.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))
      : 24;
    
    const shareTitle = `دعوة من ${senderName || 'صديقك'} للانضمام لـ "${groupName || 'المجموعة'}"`;
    const shareText = `👋 ${senderName || 'صديقك'} يدعوك للانضمام لمجموعة "${groupName || 'المجموعة'}" على ديفيسو

⏰ الرابط صالح لمدة ${hoursLeft} ساعة

📱 حمّل ديفيسو لتقسيم المصاريف بذكاء`;

    const fullMessage = `${shareText}\n\n🔗 ${shareLink}`;
    
    try {
      // Native platform (Capacitor)
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: shareTitle,
          text: shareText,
          url: shareLink,
          dialogTitle: 'شارك رابط الدعوة'
        });
        toast({ title: "تمت المشاركة" });
        onInviteSent?.();
        return;
      }
      
      // Web Share API - use shareLink for social preview
      if (navigator.share) {
        const shareData = { title: shareTitle, text: shareText, url: shareLink };
        
        // التحقق من canShare إذا متوفر
        if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
          await navigator.share({ title: shareTitle, url: shareLink });
        } else {
          await navigator.share(shareData);
        }
        toast({ title: "تمت المشاركة" });
        onInviteSent?.();
        return;
      }
      
      // Fallback - copy full message
      await navigator.clipboard.writeText(fullMessage);
      toast({ title: "تم النسخ", description: "تم نسخ رسالة الدعوة" });
      onInviteSent?.();
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("[InviteLinkTab] share error:", error);
        try {
          await navigator.clipboard.writeText(fullMessage);
          toast({ title: "تم النسخ", description: "تم نسخ رسالة الدعوة" });
        } catch {
          toast({ title: "تعذر المشاركة", variant: "destructive" });
        }
      }
    }
  };

  const generateAndShare = async () => {
    if (!displayLink) {
      await generateLink();
    }
    // سيتم مشاركة الرابط بعد إنشائه عبر useEffect
  };

  return (
    <div className="space-y-4">
      {!displayLink ? (
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
                value={displayLink} 
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
            onClick={shareInviteLink}
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