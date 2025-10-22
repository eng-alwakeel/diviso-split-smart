import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Users, Crown, Gift, Calendar, Trash2, Plus, RefreshCw, Bug } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useSubscriptionDebug } from "@/hooks/useSubscriptionDebug";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export function DevSubscriptionTester() {
  const { 
    subscription, 
    devSetSubscription, 
    devResetToFree, 
    devAddDays,
    refresh,
    forceRefresh,
    daysLeft: computedDaysLeft,
    isTrialActive: computedIsTrialActive
  } = useSubscription();
  const { rawSubscription, isExpired, daysUntilExpiry, refresh: refreshDebug } = useSubscriptionDebug();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Log environment and state on mount
  useEffect(() => {
    console.log('🛠️ Dev Mode:', import.meta.env.DEV);
    console.log('🛠️ Environment:', import.meta.env.MODE);
    console.log('📊 Current Subscription (computed):', subscription);
    console.log('📊 Raw Subscription (database):', rawSubscription);
    console.log('📊 Is Expired:', isExpired);
    console.log('📊 Days Until Expiry:', daysUntilExpiry);
    console.log('📊 Computed Days Left:', computedDaysLeft);
  }, [subscription, rawSubscription, isExpired, daysUntilExpiry, computedDaysLeft]);

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const handleSetSubscription = async (
    plan: 'personal' | 'family' | 'lifetime',
    status: 'trialing' | 'active' | 'expired' | 'canceled',
    days: number
  ) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log('🔧 Dev Tool: Setting subscription', { plan, status, days });
    
    try {
      const result = await devSetSubscription(plan, status, days);
      console.log('✅ Dev Tool: Result', result);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      toast({
        title: "تم التحديث! 🎉",
        description: `تم تعيين الباقة إلى ${plan} - ${status}`,
      });
      
      await refresh();
      refreshDebug();
    } catch (error) {
      console.error('❌ Dev Tool Error:', error);
      toast({
        title: "خطأ",
        description: `حدث خطأ: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetToFree = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log('🔧 Dev Tool: Resetting to free');
    
    try {
      const result = await devResetToFree();
      console.log('✅ Dev Tool: Result', result);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      toast({
        title: "تم الإعادة! ✨",
        description: "تم إعادة الحساب إلى المجاني",
      });
      
      await refresh();
      refreshDebug();
    } catch (error) {
      console.error('❌ Dev Tool Error:', error);
      toast({
        title: "خطأ",
        description: `حدث خطأ: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddDays = async (days: number) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log('🔧 Dev Tool: Adding days', { days });
    
    try {
      const result = await devAddDays(days);
      console.log('✅ Dev Tool: Result', result);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      toast({
        title: "تمت الإضافة! 📅",
        description: `تمت إضافة ${days} يوم للاشتراك الحالي`,
      });
      
      await refresh();
      refreshDebug();
    } catch (error) {
      console.error('❌ Dev Tool Error:', error);
      toast({
        title: "خطأ",
        description: `حدث خطأ: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForceRefresh = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log('🔄 Dev Tool: Force refreshing all data');
    
    try {
      await forceRefresh();
      refreshDebug();
      
      toast({
        title: "تم التحديث! 🔄",
        description: "تم تحديث جميع البيانات من قاعدة البيانات",
      });
    } catch (error) {
      console.error('❌ Force Refresh Error:', error);
      toast({
        title: "خطأ",
        description: `حدث خطأ: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
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
        {/* Force Refresh Button */}
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleForceRefresh}
            disabled={isProcessing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            تحديث شامل
          </Button>
        </div>

        {/* Debug Info Section */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Bug className="w-4 h-4" />
            معلومات التشخيص (Debug Info)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Raw Database Data */}
            <div className="space-y-2">
              <p className="font-semibold text-blue-600 dark:text-blue-400">البيانات من قاعدة البيانات:</p>
              {rawSubscription ? (
                <div className="space-y-1 bg-background/50 p-2 rounded">
                  <p>الباقة: <span className="font-mono">{rawSubscription.plan}</span></p>
                  <p>الحالة: <span className="font-mono">{rawSubscription.status}</span></p>
                  <p>ينتهي: <span className="font-mono">{new Date(rawSubscription.expires_at).toLocaleString('ar-SA')}</span></p>
                  <p>أيام متبقية: <span className={`font-mono ${daysUntilExpiry < 0 ? 'text-red-600' : 'text-green-600'}`}>{daysUntilExpiry}</span></p>
                  <p>منتهي؟: <span className={`font-mono ${isExpired ? 'text-red-600' : 'text-green-600'}`}>{isExpired ? 'نعم' : 'لا'}</span></p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">لا يوجد اشتراك</p>
              )}
            </div>

            {/* Computed Data */}
            <div className="space-y-2">
              <p className="font-semibold text-blue-600 dark:text-blue-400">البيانات المحسوبة (Computed):</p>
              {subscription ? (
                <div className="space-y-1 bg-background/50 p-2 rounded">
                  <p>الباقة: <span className="font-mono">{subscription.plan}</span></p>
                  <p>الحالة: <span className="font-mono">{subscription.status}</span></p>
                  <p>أيام متبقية: <span className="font-mono">{computedDaysLeft}</span></p>
                  <p>تجربة نشطة؟: <span className={`font-mono ${computedIsTrialActive ? 'text-green-600' : 'text-red-600'}`}>{computedIsTrialActive ? 'نعم' : 'لا'}</span></p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">مجاني (Free)</p>
              )}
            </div>
          </div>

          {/* Data Mismatch Warning */}
          {rawSubscription && !subscription && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded p-2">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                ⚠️ <strong>تناقض في البيانات:</strong> يوجد اشتراك في قاعدة البيانات ولكن التطبيق يعتبره منتهي/غير نشط
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Current Status */}
        <div className="bg-background/80 border border-border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            {subscription ? getPlanIcon(subscription.plan) : <Gift className="w-4 h-4" />}
            الحالة الحالية (ما يراه المستخدم)
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
              disabled={isProcessing}
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
              disabled={isProcessing}
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
              disabled={isProcessing}
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
              disabled={isProcessing}
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
              disabled={isProcessing}
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
              disabled={isProcessing}
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
              disabled={isProcessing}
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
              disabled={isProcessing}
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
                disabled={isProcessing}
              >
                <Plus className="w-3 h-3 ml-1" />
                +7 أيام
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddDays(30)}
                disabled={isProcessing}
              >
                <Plus className="w-3 h-3 ml-1" />
                +30 يوم
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddDays(90)}
                disabled={isProcessing}
              >
                <Plus className="w-3 h-3 ml-1" />
                +90 يوم
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddDays(-7)}
                disabled={isProcessing}
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
