import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Users, Crown, Gift, Calendar, Trash2, Plus } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

export function DevSubscriptionTester() {
  const { 
    subscription, 
    devSetSubscription, 
    devResetToFree, 
    devAddDays,
    refresh 
  } = useSubscription();
  const { toast } = useToast();

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const handleSetSubscription = async (
    plan: 'personal' | 'family' | 'lifetime',
    status: 'trialing' | 'active' | 'expired' | 'canceled',
    days: number
  ) => {
    const result = await devSetSubscription(plan, status, days);
    
    if (result.error) {
      toast({
        title: "خطأ",
        description: `حدث خطأ: ${result.error}`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "تم التحديث! 🎉",
        description: `تم تعيين الباقة إلى ${plan} - ${status}`,
      });
      await refresh();
    }
  };

  const handleResetToFree = async () => {
    const result = await devResetToFree();
    
    if (result.error) {
      toast({
        title: "خطأ",
        description: `حدث خطأ: ${result.error}`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "تم الإعادة! ✨",
        description: "تم إعادة الحساب إلى المجاني",
      });
      await refresh();
    }
  };

  const handleAddDays = async (days: number) => {
    const result = await devAddDays(days);
    
    if (result.error) {
      toast({
        title: "خطأ",
        description: `حدث خطأ: ${result.error}`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "تمت الإضافة! 📅",
        description: `تمت إضافة ${days} يوم للاشتراك الحالي`,
      });
      await refresh();
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'personal': return <Zap className="w-4 h-4" />;
      case 'family': return <Users className="w-4 h-4" />;
      case 'lifetime': return <Crown className="w-4 h-4" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

  return (
    <Card className="border-4 border-red-500 bg-red-50/50 dark:bg-red-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          أدوات المطور - اختبار الباقات
        </CardTitle>
        <CardDescription className="text-red-600 dark:text-red-300">
          هذه الأدوات متاحة فقط في وضع التطوير ولن تظهر في الإنتاج
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="bg-background/80 border border-border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            {subscription ? getPlanIcon(subscription.plan) : <Gift className="w-4 h-4" />}
            الحالة الحالية
          </h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              الباقة: {subscription?.plan || 'مجاني'}
            </Badge>
            <Badge variant="outline">
              الحالة: {subscription?.status || 'لا يوجد'}
            </Badge>
            {subscription && (
              <Badge variant="outline">
                ينتهي: {new Date(subscription.expires_at).toLocaleDateString('ar-SA')}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">إعداد سريع للباقات:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Free Plan */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToFree}
              className="justify-start"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              مجاني (حذف الاشتراك)
            </Button>

            {/* Personal - Trial */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSetSubscription('personal', 'trialing', 7)}
              className="justify-start"
            >
              <Zap className="w-4 h-4 ml-2" />
              Personal - تجربة (7 أيام)
            </Button>

            {/* Personal - Active */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSetSubscription('personal', 'active', 30)}
              className="justify-start"
            >
              <Zap className="w-4 h-4 ml-2" />
              Personal - نشط (30 يوم)
            </Button>

            {/* Family - Trial */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSetSubscription('family', 'trialing', 7)}
              className="justify-start"
            >
              <Users className="w-4 h-4 ml-2" />
              Family - تجربة (7 أيام)
            </Button>

            {/* Family - Active */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSetSubscription('family', 'active', 30)}
              className="justify-start"
            >
              <Users className="w-4 h-4 ml-2" />
              Family - نشط (30 يوم)
            </Button>

            {/* Lifetime */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSetSubscription('lifetime', 'active', 36500)}
              className="justify-start"
            >
              <Crown className="w-4 h-4 ml-2" />
              Lifetime - مدى الحياة
            </Button>

            {/* Expired */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSetSubscription('personal', 'expired', -1)}
              className="justify-start"
            >
              <AlertTriangle className="w-4 h-4 ml-2" />
              محاكاة اشتراك منتهي
            </Button>

            {/* Canceled */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSetSubscription('personal', 'canceled', 5)}
              className="justify-start"
            >
              <AlertTriangle className="w-4 h-4 ml-2" />
              محاكاة اشتراك ملغي
            </Button>
          </div>
        </div>

        {/* Add Days */}
        {subscription && (
          <div className="space-y-3 pt-3 border-t border-border">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              إضافة أيام للاشتراك الحالي:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddDays(7)}
              >
                <Plus className="w-3 h-3 ml-1" />
                +7 أيام
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddDays(30)}
              >
                <Plus className="w-3 h-3 ml-1" />
                +30 يوم
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddDays(90)}
              >
                <Plus className="w-3 h-3 ml-1" />
                +90 يوم
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddDays(-7)}
              >
                <Plus className="w-3 h-3 ml-1" />
                -7 أيام
              </Button>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            ⚠️ هذه الأدوات للاختبار فقط وستؤثر على قاعدة البيانات. لن تظهر في النسخة المنشورة.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
