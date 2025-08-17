import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Calendar, Clock, Gift, Zap, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { QuotaStatus } from "@/components/QuotaStatus";

interface SubscriptionTabProps {
  subscription: any;
  isTrialActive: boolean;
  daysLeft: number;
  totalDaysLeft: number;
  remainingTrialDays: number;
  canStartTrial: boolean;
  canSwitchPlan: boolean;
  freeDaysFromReferrals: number;
  loading: boolean;
  handleStartTrial: (plan: 'personal' | 'family') => Promise<void>;
  handleSwitchPlan: (plan: 'personal' | 'family') => Promise<void>;
  getPlanDisplayName: (plan: string) => string;
  getStatusDisplayName: (status: string) => string;
}

export function SubscriptionTab({
  subscription,
  isTrialActive,
  daysLeft,
  totalDaysLeft,
  remainingTrialDays,
  canStartTrial,
  canSwitchPlan,
  freeDaysFromReferrals,
  loading,
  handleStartTrial,
  handleSwitchPlan,
  getPlanDisplayName,
  getStatusDisplayName
}: SubscriptionTabProps) {
  const navigate = useNavigate();

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMMM yyyy", { locale: ar });
  };

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

                {subscription && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        تاريخ البداية
                      </label>
                      <p className="text-muted-foreground">
                        {formatDate(subscription.started_at)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        تاريخ الانتهاء
                      </label>
                      <p className="text-muted-foreground">
                        {formatDate(subscription.expires_at)}
                      </p>
                    </div>
                  </>
                )}

                {subscription && daysLeft > 0 && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">الأيام المتبقية (الاشتراك الفعلي)</label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-accent">{daysLeft} أيام</p>
                        <span className="text-sm text-muted-foreground">
                          من إجمالي {Math.ceil((new Date(subscription.expires_at).getTime() - new Date(subscription.started_at).getTime()) / (1000 * 60 * 60 * 24))} يوم
                        </span>
                      </div>
                      <Progress value={(daysLeft / 30) * 100} className="h-2" />
                    </div>
                  </div>
                )}
              </div>

              <QuotaStatus />

              {/* Trial Days Remaining Display */}
              {remainingTrialDays > 0 && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Gift className="w-4 h-4 text-green-600" />
                    أيام التجربة المجانية المتبقية
                  </label>
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-green-700 dark:text-green-300">التجربة المجانية الموحدة</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400">
                        {remainingTrialDays} من 7 أيام
                      </Badge>
                    </div>
                    <Progress value={(remainingTrialDays / 7) * 100} className="h-2 mb-2" />
                    <p className="text-xs text-green-600 dark:text-green-400">
                      يمكنك التبديل بين الباقات خلال فترة التجربة المجانية
                    </p>
                  </div>
                </div>
              )}

              {!subscription?.plan || subscription?.plan === 'free' ? (
                canStartTrial ? (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">ابدأ تجربتك المجانية (7 أيام)</h3>
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
                            تجربة مجانية 7 أيام
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
                            تجربة مجانية 7 أيام
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <span className="font-medium text-amber-800 dark:text-amber-400">انتهت فترة التجربة المجانية</span>
                      </div>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                        لقد استنفدت فترة التجربة المجانية المتاحة لك (7 أيام). للاستمرار في استخدام المميزات المتقدمة، يرجى الاشتراك في إحدى الباقات.
                      </p>
                      <Button 
                        onClick={() => navigate('/pricing')}
                        className="w-full"
                        variant="default"
                      >
                        اشترك الآن
                      </Button>
                    </div>
                  </div>
                )
              ) : canSwitchPlan ? (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">تبديل الباقة (ضمن التجربة المجانية)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subscription.plan !== 'personal' && (
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
                            onClick={() => handleSwitchPlan('personal')}
                            className="w-full"
                            variant="outline"
                          >
                            التبديل للباقة الشخصية
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {subscription.plan !== 'family' && (
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
                            onClick={() => handleSwitchPlan('family')}
                            className="w-full"
                            variant="outline"
                          >
                            التبديل للباقة العائلية
                          </Button>
                        </CardContent>
                      </Card>
                    )}
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

      {freeDaysFromReferrals > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 shadow-card rounded-2xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
              <Gift className="w-5 h-5" />
              الأيام المجانية من الإحالات
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              أيام إضافية حصلت عليها من دعوة الأصدقاء
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800 dark:text-green-400">الأيام المتاحة للتطبيق:</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400 border-green-300 dark:border-green-700">
                  {freeDaysFromReferrals} يوم
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800 dark:text-green-400">إجمالي الأيام المتبقية:</span>
                <span className="text-lg font-bold text-green-900 dark:text-green-300">{totalDaysLeft} يوم</span>
              </div>

              <p className="text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                💡 يمكنك تطبيق هذه الأيام المجانية لتمديد اشتراكك الحالي أو المستقبلي من خلال مركز الإحالات
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}