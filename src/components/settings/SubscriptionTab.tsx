import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Calendar, Zap, Crown } from "lucide-react";
import { QuotaStatus } from "@/components/QuotaStatus";
import { useNavigate } from "react-router-dom";

interface SubscriptionTabProps {
  subscription: any;
  isTrialActive: boolean;
  daysLeft: number;
  loading: boolean;
  handleStartTrial: (plan: 'personal' | 'family') => Promise<void>;
  getPlanDisplayName: (plan: string) => string;
  getStatusDisplayName: (status: string) => string;
}

export function SubscriptionTab({
  subscription,
  isTrialActive,
  daysLeft,
  loading,
  handleStartTrial,
  getPlanDisplayName,
  getStatusDisplayName
}: SubscriptionTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="w-5 h-5 text-accent" />
            تفاصيل الاشتراك
          </CardTitle>
          <CardDescription>إدارة اشتراكك والباقات المتاحة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">جاري تحميل معلومات الاشتراك...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">الباقة الحالية</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-accent text-accent">
                      {subscription?.plan ? getPlanDisplayName(subscription.plan) : 'مجاني'}
                    </Badge>
                    {isTrialActive && (
                      <Badge variant="outline" className="border-primary text-primary">
                        تجربة مجانية
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">حالة الاشتراك</label>
                  <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                    {subscription?.status ? getStatusDisplayName(subscription.status) : 'غير محدد'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">تاريخ انتهاء الاشتراك</label>
                  <p className="text-muted-foreground">
                    {subscription?.expiry_date 
                      ? new Date(subscription.expiry_date).toLocaleDateString('ar-SA')
                      : 'غير محدد'
                    }
                  </p>
                </div>

                {isTrialActive && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">الأيام المتبقية</label>
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-accent">{daysLeft} أيام</p>
                      <Progress value={(daysLeft / 30) * 100} className="h-2" />
                    </div>
                  </div>
                )}
              </div>

              <QuotaStatus />

              {!subscription?.plan || subscription?.plan === 'free' ? (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">ابدأ تجربتك المجانية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border border-border/50 hover:border-accent/50 transition-colors">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="w-4 h-4 text-accent" />
                          الباقة الشخصية
                        </CardTitle>
                        <CardDescription>للاستخدام الشخصي</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={() => handleStartTrial('personal')}
                          className="w-full"
                          variant="outline"
                        >
                          <Calendar className="w-4 h-4 ml-2" />
                          تجربة مجانية 30 يوم
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border border-border/50 hover:border-accent/50 transition-colors">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Crown className="w-4 h-4 text-accent" />
                          الباقة العائلية
                        </CardTitle>
                        <CardDescription>للعائلات والمجموعات</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={() => handleStartTrial('family')}
                          className="w-full"
                          variant="outline"
                        >
                          <Calendar className="w-4 h-4 ml-2" />
                          تجربة مجانية 30 يوم
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-border">
                  <Button 
                    onClick={() => navigate('/pricing')}
                    className="w-full"
                  >
                    إدارة الاشتراك
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}