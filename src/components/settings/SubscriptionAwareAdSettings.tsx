import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdTracking } from '@/hooks/useAdTracking';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { Info, Eye, EyeOff, Crown, Zap } from 'lucide-react';
import { toast } from 'sonner';

export const SubscriptionAwareAdSettings = () => {
  const { preferences, updateAdPreferences, canDisableAds } = useAdTracking();
  const { subscription } = useSubscription();
  const navigate = useNavigate();

  const handleToggleAds = async (enabled: boolean) => {
    const success = await updateAdPreferences({ show_ads: enabled });
    
    if (!success && !enabled) {
      toast.error('المشتركون فقط يمكنهم إيقاف الإعلانات');
      return;
    }
    
    if (success) {
      toast.success(enabled ? 'تم تفعيل الإعلانات' : 'تم إيقاف الإعلانات');
    } else {
      toast.error('حدث خطأ في تحديث الإعدادات');
    }
  };

  const handleUpgradeClick = () => {
    navigate('/pricing-protected');
  };

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            إعدادات الإعلانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            جارٍ تحميل الإعدادات...
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPaidSubscriber = canDisableAds();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {preferences.show_ads ? (
            <Eye className="h-5 w-5" />
          ) : (
            <EyeOff className="h-5 w-5" />
          )}
          إعدادات الإعلانات
          {isPaidSubscriber && (
            <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <Crown className="h-3 w-3 mr-1" />
              مشترك
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isPaidSubscriber ? (
          // Free User - Cannot disable ads
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 rounded-lg border border-primary/20">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-medium text-foreground">
                    الإعلانات تدعم التطبيق المجاني
                  </p>
                  <p className="text-sm text-muted-foreground">
                    نعرض إعلانات ذات صلة لدعم استمرارية الخدمة المجانية. للتحكم الكامل في الإعلانات، انضم للباقة المدفوعة.
                  </p>
                  <Button 
                    onClick={handleUpgradeClick}
                    className="w-full mt-3"
                    size="sm"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    ترقية للباقة المدفوعة
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between opacity-60">
              <div className="flex-1">
                <Label className="text-base font-medium">
                  عرض الإعلانات
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  مطلوب للمستخدمين المجانيين
                </p>
              </div>
              <Switch
                checked={true}
                disabled={true}
              />
            </div>
          </div>
        ) : (
          // Paid User - Full control
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Crown className="h-4 w-4" />
                <span className="text-sm font-medium">
                  كمشترك، يمكنك التحكم الكامل في الإعلانات
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="show-ads" className="text-base font-medium">
                  عرض الإعلانات
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  يمكنك إيقاف الإعلانات كمشترك مدفوع
                </p>
              </div>
              <Switch
                id="show-ads"
                checked={preferences.show_ads}
                onCheckedChange={handleToggleAds}
              />
            </div>
          </div>
        )}

        {/* Information Card */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-medium">كيف نجعل الإعلانات أفضل لك؟</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• نحلل استخدامك للتطبيق تلقائياً</li>
                <li>• نعرض إعلانات ذات صلة بأنشطتك المالية</li>
                <li>• نقلل عدد الإعلانات للمستخدمين النشطين</li>
                <li>• نحسن التوقيت ليكون مناسباً لك</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div className="text-xs text-muted-foreground">
          {preferences.show_ads ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              الإعلانات مفعلة - نظام ذكي يتعلم من تفضيلاتك
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              الإعلانات معطلة - تستمتع بتجربة خالية من الإعلانات
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};