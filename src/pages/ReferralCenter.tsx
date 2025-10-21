import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  ArrowRight, 
  Gift, 
  Copy, 
  Share2, 
  Users, 
  Calendar,
  Crown,
  Phone,
  CheckCircle,
  Clock,
  Link as LinkIcon,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Bell,
  UsersRound
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useReferrals } from "@/hooks/useReferrals";
import { useReferralRewards } from "@/hooks/useReferralRewards";
import { useReferralTiers } from "@/hooks/useReferralTiers";
import { useReferralAnalytics } from "@/hooks/useReferralAnalytics";
import { useReferralSecurity } from "@/hooks/useReferralSecurity";
import { ReferralTierCard } from "@/components/referral/ReferralTierCard";
import { ReferralAnalyticsChart } from "@/components/referral/ReferralAnalyticsChart";
import { BulkReferralDialog } from "@/components/referral/BulkReferralDialog";
import { EnhancedReferralHistory } from "@/components/referral/EnhancedReferralHistory";
import { ReferralNotifications } from "@/components/referral/ReferralNotifications";
import { ShareOptionsDialog } from "@/components/referral/ShareOptionsDialog";
import { SocialShareButtons } from "@/components/referral/SocialShareButtons";
import { FixedStatsAdBanner } from "@/components/ads/FixedStatsAdBanner";
import { UnifiedAdLayout } from "@/components/ads/UnifiedAdLayout";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const ReferralCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [newReferralPhone, setNewReferralPhone] = useState("");
  const [newReferralName, setNewReferralName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // استخدام البيانات الحقيقية
  const { 
    referrals, 
    referralCode, 
    loading: referralsLoading, 
    sendReferralInvite: sendInvite,
    getReferralLink,
    getSuccessRate
  } = useReferrals();

  const { 
    rewards,
    totalDaysEarned,
    remainingDays,
    loading: rewardsLoading,
    applyRewardToSubscription,
    canApplyRewards
  } = useReferralRewards();

  // الهوكس الجديدة
  const { userTier, loading: tiersLoading, getProgressToNextTier } = useReferralTiers();
  const { summary, getChartData, loading: analyticsLoading } = useReferralAnalytics();
  const { checkSpamProtection } = useReferralSecurity();

  // وظائف النسخ والمشاركة
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ!",
      description: "تم نسخ الرابط إلى الحافظة",
    });
  };

  // إرسال دعوة إحالة محدثة مع حماية spam
  const handleSendReferralInvite = async () => {
    if (!newReferralPhone.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الجوال",
        variant: "destructive"
      });
      return;
    }

    // فحص الحماية ضد spam
    try {
      const securityCheck = await checkSpamProtection(newReferralPhone);
      if (!securityCheck.is_allowed) {
        toast({
          title: "تحذير أمني",
          description: securityCheck.reason || "تم تجاوز الحد المسموح للإرسال",
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      console.error("Security check failed:", error);
    }

    setIsSending(true);
    try {
      const result = await sendInvite(newReferralPhone, newReferralName);
      
      if (result.success) {
        toast({
          title: "تم إرسال الدعوة!",
          description: `تم إرسال دعوة إلى ${newReferralPhone} بنجاح`,
        });
        setNewReferralPhone("");
        setNewReferralName("");
      } else if (result.error === "sms_failed") {
        toast({
          title: "تم حفظ الدعوة",
          description: "تم حفظ الدعوة ولكن فشل إرسال الرسالة النصية",
          variant: "destructive"
        });
        setNewReferralPhone("");
        setNewReferralName("");
      } else {
        console.error("Referral invite failed:", result.error);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // تطبيق المكافآت على الاشتراك
  const handleApplyRewards = async () => {
    if (!canApplyRewards()) {
      toast({
        title: "لا توجد مكافآت",
        description: "لا توجد مكافآت متاحة للتطبيق حالياً",
        variant: "destructive"
      });
      return;
    }

    try {
      // أخذ أول مكافأة غير مطبقة
      const firstUnusedReward = rewards.find(r => !r.applied_to_subscription);
      if (firstUnusedReward) {
        const result = await applyRewardToSubscription(firstUnusedReward.id);
        if (result.success) {
          toast({
            title: "تم تطبيق المكافأة!",
            description: "تم إضافة الأيام المجانية لاشتراكك بنجاح",
          });
        }
      }
    } catch (error) {
      toast({
        title: "خطأ في التطبيق",
        description: "حدث خطأ أثناء تطبيق المكافأة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  // تحديد شارة الحالة
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "joined":
        return <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">مكتمل</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-orange-300 text-orange-600">في الانتظار</Badge>;
      case "expired":
        return <Badge variant="destructive">منتهي الصلاحية</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ar });
    } catch {
      return dateString;
    }
  };

  // حساب الإحصائيات
  const totalReferrals = referrals.length;
  const successfulReferrals = referrals.filter(r => r.status === 'joined').length;
  const successRate = totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0;
  const referralLink = getReferralLink();

  // حالة التحميل
  if (referralsLoading || rewardsLoading) {
    return (
      <div className="min-h-screen bg-dark-background">
        <AppHeader />
        <div className="page-container">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-dark-background">
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="referral_center"
        showTopBanner={true}
        showBottomBanner={true}
      >
        <div className="page-container space-y-6">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للوحة التحكم
          </Button>
          <h1 className="text-3xl font-bold mb-2">مركز الإحالة المتقدم</h1>
          <p className="text-muted-foreground">إدارة شاملة للإحالات مع إحصائيات متقدمة ونظام مستويات</p>
        </div>

        {/* التبويبات الجديدة - محسنة للمحمول */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-8">
          <TabsList className={`${
            isMobile 
              ? "flex w-full overflow-x-auto scrollbar-hide gap-2 p-2 h-auto justify-start" 
              : "grid w-full grid-cols-5 h-12"
          } bg-muted`}>
            <TabsTrigger 
              value="dashboard" 
              className={`${
                isMobile 
                  ? "flex flex-col items-center gap-1 min-w-fit px-4 py-3 text-xs" 
                  : "flex items-center gap-2"
              } whitespace-nowrap shrink-0`}
            >
              <Crown className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
              {isMobile ? "لوحة" : "لوحة التحكم"}
            </TabsTrigger>
            <TabsTrigger 
              value="send" 
              className={`${
                isMobile 
                  ? "flex flex-col items-center gap-1 min-w-fit px-4 py-3 text-xs" 
                  : "flex items-center gap-2"
              } whitespace-nowrap shrink-0`}
            >
              <Phone className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
              {isMobile ? "إرسال" : "إرسال دعوات"}
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className={`${
                isMobile 
                  ? "flex flex-col items-center gap-1 min-w-fit px-4 py-3 text-xs" 
                  : "flex items-center gap-2"
              } whitespace-nowrap shrink-0`}
            >
              <Users className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
              {isMobile ? "السجل" : "سجل الإحالات"}
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className={`${
                isMobile 
                  ? "flex flex-col items-center gap-1 min-w-fit px-4 py-3 text-xs" 
                  : "flex items-center gap-2"
              } whitespace-nowrap shrink-0`}
            >
              <BarChart3 className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
              {isMobile ? "التحليل" : "التحليلات"}
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className={`${
                isMobile 
                  ? "flex flex-col items-center gap-1 min-w-fit px-4 py-3 text-xs" 
                  : "flex items-center gap-2"
              } whitespace-nowrap shrink-0`}
            >
              <Bell className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
              {isMobile ? "الإشعارات" : "الإشعارات"}
            </TabsTrigger>
          </TabsList>

          {/* تبويب لوحة التحكم */}
          <TabsContent value="dashboard" className={isMobile ? "space-y-6" : "space-y-8"}>
            <div className={isMobile ? "space-y-6" : "grid lg:grid-cols-3 gap-8"}>
              {/* إحصائيات سريعة */}
              <div className={isMobile ? "" : "lg:col-span-2"}>
                <div className={`grid gap-4 mb-6 ${
                  isMobile ? "grid-cols-2" : "md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                }`}>
                  <Card className="shadow-card hover:shadow-xl transition-all duration-300">
                    <CardContent className={isMobile ? "p-4 text-center" : "p-6 text-center"}>
                      <div className={`${isMobile ? "w-8 h-8 mb-2" : "w-12 h-12 mb-3"} bg-primary/10 rounded-xl flex items-center justify-center mx-auto`}>
                        <Users className={isMobile ? "w-4 h-4 text-primary" : "w-6 h-6 text-primary"} />
                      </div>
                      <p className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-primary`}>{totalReferrals}</p>
                      <p className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>إجمالي الإحالات</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card hover:shadow-xl transition-all duration-300">
                    <CardContent className={isMobile ? "p-4 text-center" : "p-6 text-center"}>
                      <div className={`${isMobile ? "w-8 h-8 mb-2" : "w-12 h-12 mb-3"} bg-primary/10 rounded-xl flex items-center justify-center mx-auto`}>
                        <CheckCircle className={isMobile ? "w-4 h-4 text-primary" : "w-6 h-6 text-primary"} />
                      </div>
                      <p className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-primary`}>{successfulReferrals}</p>
                      <p className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>إحالات مكتملة</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card hover:shadow-xl transition-all duration-300">
                    <CardContent className={isMobile ? "p-4 text-center" : "p-6 text-center"}>
                      <div className={`${isMobile ? "w-8 h-8 mb-2" : "w-12 h-12 mb-3"} bg-primary/10 rounded-xl flex items-center justify-center mx-auto`}>
                        <Gift className={isMobile ? "w-4 h-4 text-primary" : "w-6 h-6 text-primary"} />
                      </div>
                      <p className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-primary`}>{totalDaysEarned}</p>
                      <p className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>أيام مكتسبة</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card hover:shadow-xl transition-all duration-300">
                    <CardContent className={isMobile ? "p-4 text-center" : "p-6 text-center"}>
                      <div className={`${isMobile ? "w-8 h-8 mb-2" : "w-12 h-12 mb-3"} bg-primary/10 rounded-xl flex items-center justify-center mx-auto`}>
                        <Calendar className={isMobile ? "w-4 h-4 text-primary" : "w-6 h-6 text-primary"} />
                      </div>
                      <p className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-primary`}>{remainingDays}</p>
                      <p className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>أيام متبقية</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Fixed Ad Banner Below Stats */}
                <FixedStatsAdBanner placement="referral_stats" />

                {/* بطاقة المستوى */}
                {userTier && !tiersLoading && (
                  <div className={isMobile ? "mt-6" : "mt-8"}>
                    <ReferralTierCard 
                      userTier={userTier} 
                      progress={getProgressToNextTier()} 
                    />
                  </div>
                )}
              </div>

              {/* الحالة الحالية والمكافآت */}
              <div className={isMobile ? "space-y-4" : "space-y-6"}>
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      حالتك الحالية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">{remainingDays}</p>
                      <p className="text-sm text-muted-foreground">أيام مجانية متبقية</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground mb-1">الأيام المكتسبة إجمالياً</p>
                      <p className="text-xl font-bold">{totalDaysEarned} يوم</p>
                    </div>
                    {canApplyRewards() && (
                      <Button 
                        onClick={handleApplyRewards}
                        variant="hero"
                        className="w-full"
                      >
                        <Gift className="w-4 h-4 ml-2" />
                        تطبيق المكافآت على الاشتراك
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* كود الإحالة */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5" />
                      كود الإحالة الخاص بك
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!referralCode ? (
                      <div className="text-center py-4">
                        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">جاري تحميل كود الإحالة...</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground mb-2">الكود الخاص بك</p>
                          <p className="text-2xl font-bold tracking-wider">{referralCode}</p>
                        </div>
                        
                        <Tabs defaultValue="link" className="w-full">
                          <TabsList className={`grid w-full grid-cols-2 ${isMobile ? "h-12" : ""}`}>
                            <TabsTrigger value="link" className={isMobile ? "text-sm" : ""}>رابط نصي</TabsTrigger>
                            <TabsTrigger value="qr" className={isMobile ? "text-sm" : ""}>رمز QR</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="link" className="space-y-3 mt-4">
                            <div className="flex gap-2">
                              <Input
                                value={referralLink}
                                readOnly
                                className="text-left text-xs"
                                dir="ltr"
                              />
                            <Button
                              variant="outline"
                              size={isMobile ? "default" : "sm"}
                              onClick={() => copyToClipboard(referralLink)}
                              className={isMobile ? "px-4" : ""}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                className={isMobile ? "h-12" : ""}
                                onClick={() => copyToClipboard(referralLink)}
                              >
                                <Copy className="w-4 h-4 ml-2" />
                                نسخ
                              </Button>
                              <Button
                                variant="default"
                                className={isMobile ? "h-12" : ""}
                                onClick={() => setShowShareDialog(true)}
                              >
                                <Share2 className="w-4 h-4 ml-2" />
                                مشاركة
                              </Button>
                            </div>

                            <div className="pt-3 border-t">
                              <p className="text-xs text-muted-foreground mb-3">مشاركة سريعة:</p>
                              <SocialShareButtons
                                referralLink={referralLink}
                                referralCode={referralCode || ''}
                                layout="grid"
                                showLabels={false}
                                platforms={['whatsapp', 'telegram', 'twitter', 'snapchat']}
                              />
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="qr" className="mt-4 flex justify-center">
                            <QRCodeDisplay value={referralLink} size={isMobile ? 150 : 180} />
                          </TabsContent>
                        </Tabs>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* تبويب إرسال الدعوات */}
          <TabsContent value="send" className={isMobile ? "space-y-6" : "space-y-8"}>
            <div className={isMobile ? "space-y-6" : "grid md:grid-cols-2 gap-8"}>
              {/* إرسال دعوة فردية */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    إرسال دعوة فردية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <Input
                      placeholder="الاسم (اختياري)"
                      value={newReferralName}
                      onChange={(e) => setNewReferralName(e.target.value)}
                      className={isMobile ? "h-12 text-base" : ""}
                    />
                    <div className={isMobile ? "space-y-3" : "flex gap-3"}>
                      <Input
                        placeholder="05xxxxxxxx"
                        value={newReferralPhone}
                        onChange={(e) => setNewReferralPhone(e.target.value)}
                        className={`text-left ${isMobile ? "h-12 text-base" : ""}`}
                        dir="ltr"
                      />
                      <Button 
                        onClick={handleSendReferralInvite} 
                        variant="hero"
                        disabled={isSending}
                        className={isMobile ? "w-full h-12 text-base" : ""}
                      >
                        {isSending ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                            {isMobile ? "جاري الإرسال..." : "جاري الإرسال"}
                          </>
                        ) : (
                          "إرسال دعوة"
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    سيتم إرسال رسالة نصية تحتوي على رابط التسجيل الخاص بك
                  </p>
                </CardContent>
              </Card>

              {/* إرسال دعوات جماعية */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UsersRound className="w-5 h-5" />
                    إرسال دعوات جماعية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    أرسل عدة دعوات في مرة واحدة لتوفير الوقت والجهد
                  </p>
                  <Button 
                    onClick={() => setShowBulkDialog(true)}
                    variant="outline"
                    className={`w-full ${isMobile ? "h-12 text-base" : ""}`}
                  >
                    <UsersRound className="w-4 h-4 ml-2" />
                    بدء الإرسال الجماعي
                  </Button>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">
                      يمكنك إرسال عدة دعوات دفعة واحدة عبر إدخال قائمة بأرقام الهواتف
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* كيف يعمل البرنامج */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>كيف يعمل البرنامج؟</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "md:grid-cols-3"}`}>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <h3 className="font-semibold mb-2">ادع صديقك</h3>
                    <p className="text-sm text-muted-foreground">استخدم رابطك الخاص أو كود الإحالة</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <h3 className="font-semibold mb-2">التسجيل والاستخدام</h3>
                    <p className="text-sm text-muted-foreground">يسجل صديقك ويبدأ استخدام التطبيق</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <h3 className="font-semibold mb-2">احصل على المكافأة</h3>
                    <p className="text-sm text-muted-foreground">تحصل على أيام مجانية فوراً!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب سجل الإحالات */}
          <TabsContent value="history">
            <EnhancedReferralHistory referrals={referrals} loading={referralsLoading} />
          </TabsContent>

          {/* تبويب التحليلات */}
          <TabsContent value="analytics">
            {analyticsLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-48" />
              </div>
            ) : (
              <ReferralAnalyticsChart 
                chartData={getChartData()} 
                summary={summary} 
              />
            )}
          </TabsContent>

          {/* تبويب الإشعارات */}
          <TabsContent value="notifications">
            <ReferralNotifications />
          </TabsContent>
        </Tabs>

        {/* Dialog للإرسال الجماعي */}
        {showBulkDialog && (
          <BulkReferralDialog
            sendReferralInvite={async (phone: string, name?: string) => {
              const result = await sendInvite(phone, name);
              return { success: result.success, error: result.error };
            }}
            onInviteSent={() => {
              setShowBulkDialog(false);
            }}
          />
        )}

        {/* Dialog خيارات المشاركة المتقدمة */}
        <ShareOptionsDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          referralLink={referralLink}
          referralCode={referralCode || ''}
        />
        </div>
      </UnifiedAdLayout>
      
      <div className="h-32 lg:hidden" />
      <BottomNav />
    </div>
  );
};

export default ReferralCenter;