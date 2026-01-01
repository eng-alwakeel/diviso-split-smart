import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuotaHandler } from "@/hooks/useQuotaHandler";
import { useGroupInvites } from "@/hooks/useGroupInvites";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { InviteContactsTab } from "@/components/group/invite-tabs/InviteContactsTab";
import { InviteTrackingTab } from "@/components/group/invite-tabs/InviteTrackingTab";
import { 
  ArrowRight, 
  Copy, 
  Link, 
  RefreshCw, 
  Users, 
  Clock, 
  Share2,
  QrCode,
  Contact,
  ClipboardList
} from "lucide-react";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { useTranslation } from "react-i18next";

const isUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const GroupInvite = () => {
  const { id: rawId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleQuotaError } = useQuotaHandler();
  const { t } = useTranslation(['groups']);

  const [group, setGroup] = useState<any>(null);
  const [senderName, setSenderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [link, setLink] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkInfo, setLinkInfo] = useState<{
    maxUses: number;
    currentUses: number;
    expiresAt: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("link");
  const [existingMembers, setExistingMembers] = useState<string[]>([]);

  const id = rawId && rawId !== ":id" && isUUID(rawId) ? rawId : undefined;
  const { invites, loading: invitesLoading, fetchInvites } = useGroupInvites(id);

  const disabledReason = useMemo(() => {
    if (!id) return "لا يوجد معرف مجموعة.";
    if (!isUUID(id)) return "هذه مجموعة تجريبية، افتح مجموعة حقيقية لتفعيل الدعوات.";
    return null;
  }, [id]);

  // Fetch group data and sender info
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        navigate('/dashboard');
        return;
      }

      try {
        // Fetch group
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single();

        if (groupError || !groupData) {
          toast({ title: "المجموعة غير موجودة", variant: "destructive" });
          navigate('/dashboard');
          return;
        }

        setGroup(groupData);

        // Fetch current user name
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, name')
            .eq('id', user.id)
            .single();
          
          setSenderName(profile?.display_name || profile?.name || "");
        }

        // Fetch existing members
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', id);
        
        setExistingMembers(members?.map(m => m.user_id).filter(Boolean) || []);

      } catch (error) {
        console.error("Error fetching group data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, toast]);

  const generateLink = async () => {
    if (disabledReason) {
      toast({ title: "لا يمكن إنشاء الدعوة", description: disabledReason, variant: "destructive" });
      return;
    }
    
    setLinkLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('create_group_join_token', {
        p_group_id: id,
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
      
      const maxUsesText = tokenData.max_uses === -1 ? "غير محدود" : `${tokenData.max_uses} مستخدمين`;
      const expiresAt = new Date(tokenData.expires_at);
      const hoursLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
      
      toast({ 
        title: "تم إنشاء رابط الدعوة", 
        description: `العدد المسموح: ${maxUsesText}، صالح لـ ${hoursLeft} ساعة`
      });
    } catch (error: any) {
      console.error("Create token error:", error);
      
      if (!handleQuotaError(error)) {
        toast({
          title: "تعذر إنشاء رابط الدعوة",
          description: error.message || "تحقق من أنك مدير للمجموعة ومسجل دخول.",
          variant: "destructive",
        });
      }
    } finally {
      setLinkLoading(false);
    }
  };

  const getInviteMessage = () => {
    const groupNameDisplay = group?.name || "المجموعة";
    const senderDisplay = senderName || "صديقك";
    
    return `👋 مرحباً!

انضم إلى مجموعة "${groupNameDisplay}"
الدعوة من: ${senderDisplay}

🔗 رابط الانضمام:
${link}

📱 حمّل تطبيق ديفيسو لتقسيم المصاريف بذكاء بين الأصدقاء والعائلة`;
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast({ title: "تم النسخ", description: "تم نسخ رابط الدعوة إلى الحافظة." });
  };

  const shareLink = async () => {
    if (!link) return;
    
    const shareMessage = getInviteMessage();
    
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: `دعوة للانضمام لـ ${group?.name || 'المجموعة'}`,
          text: shareMessage,
          url: link,
          dialogTitle: 'شارك رابط الدعوة'
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `دعوة للانضمام لـ ${group?.name || 'المجموعة'}`,
          text: shareMessage,
          url: link
        });
      } else {
        await copyLink();
        return;
      }
      
      toast({ title: "تمت المشاركة", description: "تم فتح نافذة المشاركة" });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Share error:", error);
        await copyLink();
      }
    }
  };

  const handleInviteSent = () => {
    fetchInvites();
    toast({ title: "تم إرسال الدعوة بنجاح" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-background pb-24">
      <SEO title={`دعوة أعضاء - ${group?.name || ''}`} noIndex={true} />
      <AppHeader />

      <div className="page-container space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/group/${id}`)}
          className="mb-2"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للمجموعة
        </Button>

        {/* Header Card */}
        <Card className="bg-gradient-card border-border/50 shadow-elevated">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">دعوة أعضاء جدد</h1>
                <p className="text-lg text-primary mt-1">مجموعة "{group?.name}"</p>
                {senderName && (
                  <p className="text-sm text-muted-foreground mt-2">
                    الدعوة من: <span className="font-medium text-foreground">{senderName}</span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              <span className="hidden sm:inline">الرابط</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Contact className="w-4 h-4" />
              <span className="hidden sm:inline">جهات الاتصال</span>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">المتابعة</span>
            </TabsTrigger>
          </TabsList>

          {/* Link Tab */}
          <TabsContent value="link" className="space-y-4">
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
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
                      disabled={!!disabledReason || linkLoading}
                    >
                      {linkLoading ? (
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
                    </div>

                    {/* Invite Message Preview */}
                    <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                      <Label className="text-sm mb-2 block">نص رسالة الدعوة:</Label>
                      <p className="text-sm whitespace-pre-line text-muted-foreground">
                        {getInviteMessage()}
                      </p>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center pt-4">
                      <QRCodeDisplay 
                        value={link} 
                        size={200}
                        className="bg-white p-4 rounded-xl"
                      />
                    </div>

                    <Button 
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={generateLink}
                      disabled={linkLoading}
                    >
                      <RefreshCw className={`w-3 h-3 ml-1 ${linkLoading ? 'animate-spin' : ''}`} />
                      إنشاء رابط جديد
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <InviteContactsTab
                  groupId={id}
                  groupName={group?.name}
                  inviteLink={link}
                  existingMembers={existingMembers}
                  onInviteSent={handleInviteSent}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <InviteTrackingTab
                  invites={invites || []}
                  loading={invitesLoading}
                  onInviteAction={fetchInvites}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default GroupInvite;
