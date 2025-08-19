import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Settings, X } from 'lucide-react';
import { useAdTracking } from '@/hooks/useAdTracking';
const AD_CATEGORIES = [{
  id: 'electronics',
  name: 'إلكترونيات'
}, {
  id: 'fashion',
  name: 'أزياء'
}, {
  id: 'home',
  name: 'منزل ومطبخ'
}, {
  id: 'books',
  name: 'كتب'
}, {
  id: 'sports',
  name: 'رياضة'
}, {
  id: 'beauty',
  name: 'جمال وعناية'
}, {
  id: 'automotive',
  name: 'سيارات'
}, {
  id: 'travel',
  name: 'سفر'
}, {
  id: 'food',
  name: 'طعام'
}, {
  id: 'health',
  name: 'صحة'
}, {
  id: 'finance',
  name: 'مالية'
}, {
  id: 'education',
  name: 'تعليم'
}];
export const AdPreferencesDialog: React.FC = () => {
  const {
    preferences,
    updateAdPreferences
  } = useAdTracking();
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [isOpen, setIsOpen] = useState(false);
  const handleSave = async () => {
    if (localPreferences) {
      await updateAdPreferences(localPreferences);
      setIsOpen(false);
    }
  };
  const toggleCategory = (categoryId: string, isBlocked: boolean) => {
    if (!localPreferences) return;
    const blocked = [...localPreferences.blocked_categories];
    const preferred = [...localPreferences.preferred_categories];
    if (isBlocked) {
      // Add to blocked, remove from preferred
      if (!blocked.includes(categoryId)) {
        blocked.push(categoryId);
      }
      const preferredIndex = preferred.indexOf(categoryId);
      if (preferredIndex > -1) {
        preferred.splice(preferredIndex, 1);
      }
    } else {
      // Remove from blocked
      const blockedIndex = blocked.indexOf(categoryId);
      if (blockedIndex > -1) {
        blocked.splice(blockedIndex, 1);
      }
    }
    setLocalPreferences({
      ...localPreferences,
      blocked_categories: blocked,
      preferred_categories: preferred
    });
  };
  const togglePreferred = (categoryId: string) => {
    if (!localPreferences) return;
    const preferred = [...localPreferences.preferred_categories];
    const blocked = [...localPreferences.blocked_categories];

    // Don't allow if blocked
    if (blocked.includes(categoryId)) return;
    const index = preferred.indexOf(categoryId);
    if (index > -1) {
      preferred.splice(index, 1);
    } else {
      preferred.push(categoryId);
    }
    setLocalPreferences({
      ...localPreferences,
      preferred_categories: preferred
    });
  };
  if (!preferences) return null;
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات الإعلانات
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Show Ads Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show_ads" className="text-sm font-medium">
              عرض الإعلانات
            </Label>
            <Switch id="show_ads" checked={localPreferences?.show_ads || false} onCheckedChange={checked => setLocalPreferences(prev => prev ? {
            ...prev,
            show_ads: checked
          } : null)} />
          </div>

          {/* Personalized Ads */}
          <div className="flex items-center justify-between">
            <Label htmlFor="personalized_ads" className="text-sm font-medium">
              إعلانات مخصصة
            </Label>
            <Switch id="personalized_ads" checked={localPreferences?.personalized_ads || false} onCheckedChange={checked => setLocalPreferences(prev => prev ? {
            ...prev,
            personalized_ads: checked
          } : null)} />
          </div>

          {/* Max Ads Per Session */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              الحد الأقصى للإعلانات (كل جلسة): {localPreferences?.max_ads_per_session || 3}
            </Label>
            <Slider value={[localPreferences?.max_ads_per_session || 3]} onValueChange={([value]) => setLocalPreferences(prev => prev ? {
            ...prev,
            max_ads_per_session: value
          } : null)} max={10} min={1} step={1} className="w-full" />
          </div>

          {/* Category Preferences */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">تفضيلات الفئات</Label>
            
            <div className="grid grid-cols-1 gap-2">
              {AD_CATEGORIES.map(category => {
              const isBlocked = localPreferences?.blocked_categories.includes(category.id);
              const isPreferred = localPreferences?.preferred_categories.includes(category.id);
              return <div key={category.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <span className="text-sm">{category.name}</span>
                    <div className="flex items-center gap-2">
                      {isPreferred && <Badge variant="secondary" className="text-xs">مفضل</Badge>}
                      {isBlocked && <Badge variant="destructive" className="text-xs">محجوب</Badge>}
                      
                      <div className="flex items-center gap-1">
                        <Button variant={isPreferred ? "default" : "outline"} size="sm" className="h-6 px-2 text-xs" onClick={() => togglePreferred(category.id)} disabled={isBlocked}>
                          أفضل
                        </Button>
                        
                        <Button variant={isBlocked ? "destructive" : "outline"} size="sm" className="h-6 w-6 p-0" onClick={() => toggleCategory(category.id, !isBlocked)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>;
            })}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>
              حفظ الإعدادات
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};