import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ArrowRight, 
  Gift, 
  Copy, 
  Share2, 
  Users, 
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const { 
    referrals, 
    referralCode, 
    loading: referralsLoading, 
    getReferralLink
  } = useReferrals();

  const { 
    totalDaysEarned,
    remainingDays,
    loading: rewardsLoading
  } = useReferralRewards();

  const referralLink = getReferralLink();
  const totalReferrals = referrals.length;
  const successfulReferrals = referrals.filter(r => r.status === 'joined').length;

  // نسخ الرابط
  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "تم النسخ!",
      description: "تم نسخ رابط الإحالة إلى الحافظة",
    });
  };

  // مشاركة عبر نظام الجهاز
  const handleShare = async () => {
    const shareData = {
      title: 'دعوة لتطبيق ديفيسو',
      text: `انضم إلى تطبيق ديفيسو واحصل على 7 أيام مجانية!\n\nاستخدم كود الإحالة: ${referralCode || ''}`,
      url: referralLink
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // fallback: نسخ للحافظة
        handleCopy();
      }
    } catch (error) {
      // المستخدم ألغى المشاركة أو حدث خطأ
      if ((error as Error).name !== 'AbortError') {
        handleCopy();
      }
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

  // حالة التحميل
  if (referralsLoading || rewardsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="page-container">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="page-container space-y-6">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ms-2" />
            العودة
          </Button>
          <h1 className="text-2xl font-bold">مركز الإحالة</h1>
        </div>

        {/* بطاقة الرصيد */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{remainingDays}</p>
                <p className="text-sm text-muted-foreground">يوم مجاني متبقي</p>
              </div>
            </div>
            
            <div className="flex justify-center gap-6 text-center text-sm text-muted-foreground border-t pt-4">
              <div>
                <p className="font-semibold text-foreground">{totalReferrals}</p>
                <p>إحالات</p>
              </div>
              <div className="border-s ps-6">
                <p className="font-semibold text-foreground">{successfulReferrals}</p>
                <p>ناجحة</p>
              </div>
              <div className="border-s ps-6">
                <p className="font-semibold text-foreground">{totalDaysEarned}</p>
                <p>مكتسب</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* كود الإحالة */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">كود الإحالة الخاص بك</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* عرض الكود */}
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold font-mono tracking-wider text-primary">
                {referralCode || '---'}
              </p>
            </div>

            {/* أزرار النسخ والمشاركة */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={handleCopy}
                className="h-12"
              >
                <Copy className="w-4 h-4 ms-2" />
                نسخ الرابط
              </Button>
              <Button 
                onClick={handleShare}
                className="h-12"
              >
                <Share2 className="w-4 h-4 ms-2" />
                مشاركة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* سجل الإحالات - قابل للطي */}
        {referrals.length > 0 && (
          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <Card className="shadow-card">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      سجل الإحالات
                      <Badge variant="secondary" className="ms-2">{referrals.length}</Badge>
                    </div>
                    {isHistoryOpen ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {referrals.slice(0, 10).map((referral) => (
                      <div 
                        key={referral.id} 
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            referral.status === 'joined' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-orange-100 text-orange-600'
                          }`}>
                            {referral.status === 'joined' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {referral.invitee_name || referral.invitee_phone}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(referral.created_at)}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={referral.status === 'joined' ? 'secondary' : 'outline'}
                          className={referral.status === 'joined' 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'border-orange-300 text-orange-600'
                          }
                        >
                          {referral.status === 'joined' ? 'انضم' : 'في الانتظار'}
                        </Badge>
                      </div>
                    ))}
                    
                    {referrals.length > 10 && (
                      <p className="text-center text-sm text-muted-foreground pt-2">
                        +{referrals.length - 10} إحالات أخرى
                      </p>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ReferralCenter;
