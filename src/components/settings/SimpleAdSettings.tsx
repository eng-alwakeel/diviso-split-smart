import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAdTracking } from '@/hooks/useAdTracking';
import { Info, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export const SimpleAdSettings = () => {
  const { preferences, updateAdPreferences } = useAdTracking();

  const handleToggleAds = async (enabled: boolean) => {
    try {
      await updateAdPreferences({ show_ads: enabled });
      toast.success(enabled ? 'تم تفعيل الإعلانات' : 'تم إيقاف الإعلانات');
    } catch (error) {
      toast.error('حدث خطأ في تحديث الإعدادات');
    }
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
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Simple Ad Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor="show-ads" className="text-base font-medium">
              عرض الإعلانات
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              اعرض إعلانات ذات صلة لدعم التطبيق المجاني
            </p>
          </div>
          <Switch
            id="show-ads"
            checked={preferences.show_ads}
            onCheckedChange={handleToggleAds}
          />
        </div>

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
              الإعلانات معطلة - لن تظهر أي إعلانات
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};