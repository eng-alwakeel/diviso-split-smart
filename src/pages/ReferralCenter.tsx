import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
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
  AlertCircle
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useReferrals } from "@/hooks/useReferrals";
import { useReferralRewards } from "@/hooks/useReferralRewards";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const ReferralCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newReferralPhone, setNewReferralPhone] = useState("");
  const [newReferralName, setNewReferralName] = useState("");
  const [isSending, setIsSending] = useState(false);

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

  // وظائف النسخ والمشاركة
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ!",
      description: "تم نسخ الرابط إلى الحافظة",
    });
  };

  // إرسال دعوة إحالة حقيقية
  const handleSendReferralInvite = async () => {
    if (!newReferralPhone.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الجوال",
        variant: "destructive"
      });
      return;
    }

    // التحقق من صحة رقم الجوال السعودي
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(newReferralPhone)) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم جوال سعودي صحيح (05xxxxxxxx)",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      await sendInvite(newReferralPhone, newReferralName);
      toast({
        title: "تم إرسال الدعوة!",
        description: `تم إرسال دعوة إلى ${newReferralPhone}`,
      });
      setNewReferralPhone("");
      setNewReferralName("");
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال الدعوة. يرجى المحاولة مرة أخرى.",
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
        <div className="container mx-auto px-4 py-8">
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
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للوحة التحكم
          </Button>
          <h1 className="text-3xl font-bold mb-2">مركز الإحالة</h1>
          <p className="text-muted-foreground">ادع أصدقاءك واحصل على أيام مجانية من الاشتراك</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Stats & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-card border border-border shadow-card hover:shadow-xl transition-all duration-300 rounded-2xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{totalReferrals}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الإحالات</p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border shadow-card hover:shadow-xl transition-all duration-300 rounded-2xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{successfulReferrals}</p>
                  <p className="text-sm text-muted-foreground">إحالات مكتملة</p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border shadow-card hover:shadow-xl transition-all duration-300 rounded-2xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{totalDaysEarned}</p>
                  <p className="text-sm text-muted-foreground">أيام مكتسبة</p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border shadow-card hover:shadow-xl transition-all duration-300 rounded-2xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{remainingDays}</p>
                  <p className="text-sm text-muted-foreground">أيام متبقية</p>
                </CardContent>
              </Card>
            </div>

            {/* Success Rate */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  معدل نجاح الإحالات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>معدل التحويل</span>
                    <span className="font-bold text-secondary">{successRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={successRate} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {successfulReferrals} من أصل {totalReferrals} إحالة تم تفعيلها بنجاح
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Send New Referral */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  إرسال دعوة جديدة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Input
                    placeholder="الاسم (اختياري)"
                    value={newReferralName}
                    onChange={(e) => setNewReferralName(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <Input
                      placeholder="05xxxxxxxx"
                      value={newReferralPhone}
                      onChange={(e) => setNewReferralPhone(e.target.value)}
                      className="text-left"
                      dir="ltr"
                    />
                    <Button 
                      onClick={handleSendReferralInvite} 
                      variant="hero"
                      disabled={isSending}
                    >
                      {isSending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                          جاري الإرسال
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

            {/* Referral History */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>سجل الإحالات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referrals.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">لم تقم بإرسال أي دعوات بعد</p>
                      <p className="text-sm text-muted-foreground">ابدأ بدعوة أصدقائك للحصول على أيام مجانية!</p>
                    </div>
                  ) : (
                    referrals.map((referral) => (
                      <Card key={referral.id} className="bg-card border border-border shadow-card hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                                <Users className="w-8 h-8 text-primary" />
                              </div>
                              <div className="text-foreground">
                                <h3 className="font-bold text-lg">
                                  {referral.invitee_name || "مستخدم جديد"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {referral.invitee_phone}
                                </p>
                                <p className="text-sm font-medium text-muted-foreground">
                                  تاريخ الدعوة: {formatDate(referral.created_at)}
                                  {referral.joined_at && (
                                    <span className="block">تاريخ الانضمام: {formatDate(referral.joined_at)}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-left flex flex-col items-end gap-2">
                              {getStatusBadge(referral.status)}
                              {referral.status === 'joined' && (
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                  +{referral.reward_days} أيام
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Referral Tools */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card className="bg-card border border-border shadow-card">
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

            {/* Referral Code */}
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
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="link">رابط نصي</TabsTrigger>
                        <TabsTrigger value="qr">رمز QR</TabsTrigger>
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
                            size="sm"
                            onClick={() => copyToClipboard(referralLink)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: "انضم إلى Diviso",
                                text: "انضم إلى Diviso لإدارة المصاريف المشتركة بذكاء",
                                url: referralLink
                              });
                            } else {
                              copyToClipboard(referralLink);
                            }
                          }}
                        >
                          <Share2 className="w-4 h-4 ml-2" />
                          مشاركة الرابط
                        </Button>
                      </TabsContent>
                      
                      <TabsContent value="qr" className="mt-4">
                        <QRCodeDisplay value={referralLink} size={180} />
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </CardContent>
            </Card>

            {/* How it Works */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>كيف يعمل البرنامج؟</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      1
                    </div>
                    <p className="text-sm">ادع صديقك باستخدام رابطك الخاص</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      2
                    </div>
                    <p className="text-sm">يسجل صديقك ويبدأ استخدام التطبيق</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      3
                    </div>
                    <p className="text-sm">تحصل على 7 أيام مجانية فوراً!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
      </div>
      <div className="h-16 md:hidden" />
      <BottomNav />
    </div>
  );
};

export default ReferralCenter;