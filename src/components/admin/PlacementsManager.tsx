import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Loader2, MapPin, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdPlacement {
  id: string;
  placement_key: string;
  name: string;
  name_ar: string;
  allowed_ad_types: string[];
  is_enabled: boolean;
  max_impressions_per_user_day: number;
  min_interval_seconds: number;
  targeting: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const allAdTypes = [
  { key: 'rewarded', label: 'إعلانات مكافئة' },
  { key: 'sponsored', label: 'بطاقات برعاية' },
  { key: 'native', label: 'Native' },
  { key: 'banner', label: 'بانر' }
];

export function PlacementsManager() {
  const { toast } = useToast();
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState<AdPlacement | null>(null);
  const [formData, setFormData] = useState({
    max_impressions_per_user_day: 10,
    min_interval_seconds: 0,
    allowed_ad_types: [] as string[],
    targeting: {} as Record<string, any>
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ad_placements')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPlacements((data || []).map(d => ({
        ...d,
        targeting: (d.targeting || {}) as Record<string, any>
      })));
    } catch (error) {
      console.error('Error fetching placements:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر تحميل أماكن الإعلانات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, isEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('ad_placements')
        .update({ is_enabled: isEnabled })
        .eq('id', id);

      if (error) throw error;
      
      // Log audit
      await supabase.from('admin_audit_log').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'placement_toggled',
        details: { placement_id: id, is_enabled: isEnabled }
      });
      
      setPlacements(prev => prev.map(p => p.id === id ? { ...p, is_enabled: isEnabled } : p));
      
      toast({
        title: isEnabled ? 'تم التفعيل' : 'تم الإيقاف',
        description: `تم ${isEnabled ? 'تفعيل' : 'إيقاف'} مكان الإعلان`
      });
    } catch (error) {
      console.error('Error toggling placement:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر تحديث حالة مكان الإعلان',
        variant: 'destructive'
      });
    }
  };

  const handleOpenSettings = (placement: AdPlacement) => {
    setEditingPlacement(placement);
    setFormData({
      max_impressions_per_user_day: placement.max_impressions_per_user_day,
      min_interval_seconds: placement.min_interval_seconds,
      allowed_ad_types: placement.allowed_ad_types || [],
      targeting: placement.targeting || {}
    });
    setSettingsDialogOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!editingPlacement) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ad_placements')
        .update({
          max_impressions_per_user_day: formData.max_impressions_per_user_day,
          min_interval_seconds: formData.min_interval_seconds,
          allowed_ad_types: formData.allowed_ad_types,
          targeting: formData.targeting
        })
        .eq('id', editingPlacement.id);

      if (error) throw error;
      
      // Log audit
      await supabase.from('admin_audit_log').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'placement_settings_updated',
        details: { placement_id: editingPlacement.id, ...formData }
      });
      
      setPlacements(prev => prev.map(p => p.id === editingPlacement.id ? { ...p, ...formData } : p));
      setSettingsDialogOpen(false);
      
      toast({
        title: 'تم الحفظ',
        description: 'تم تحديث إعدادات مكان الإعلان'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر حفظ الإعدادات',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdType = (typeKey: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allowed_ad_types: checked
        ? [...prev.allowed_ad_types, typeKey]
        : prev.allowed_ad_types.filter(t => t !== typeKey)
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة أماكن الظهور</CardTitle>
        <CardDescription>تحديد أماكن عرض الإعلانات وحدود الظهور لكل مستخدم</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المكان</TableHead>
              <TableHead>أنواع الإعلانات</TableHead>
              <TableHead>الحد اليومي</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإعدادات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {placements.map(placement => (
              <TableRow key={placement.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">{placement.name_ar}</div>
                      <div className="text-xs text-muted-foreground font-mono">{placement.placement_key}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {placement.allowed_ad_types?.map(type => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    {placement.max_impressions_per_user_day}
                    {placement.min_interval_seconds > 0 && (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {placement.min_interval_seconds}s
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={placement.is_enabled}
                      onCheckedChange={v => handleToggle(placement.id, v)}
                    />
                    <Badge variant={placement.is_enabled ? 'default' : 'secondary'}>
                      {placement.is_enabled ? 'مفعّل' : 'معطّل'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenSettings(placement)}
                  >
                    <Settings className="w-4 h-4 ml-1" />
                    تعديل
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Settings Dialog */}
        <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                إعدادات {editingPlacement?.name_ar}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>الحد الأقصى للعرض يومياً/مستخدم</Label>
                <Input
                  type="number"
                  value={formData.max_impressions_per_user_day}
                  onChange={e => setFormData(f => ({ ...f, max_impressions_per_user_day: parseInt(e.target.value) || 10 }))}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label>الحد الأدنى بين العرضين (ثواني)</Label>
                <Input
                  type="number"
                  value={formData.min_interval_seconds}
                  onChange={e => setFormData(f => ({ ...f, min_interval_seconds: parseInt(e.target.value) || 0 }))}
                  min={0}
                />
              </div>

              <div className="space-y-3">
                <Label>أنواع الإعلانات المسموحة</Label>
                <div className="space-y-2">
                  {allAdTypes.map(type => (
                    <div key={type.key} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={type.key}
                        checked={formData.allowed_ad_types.includes(type.key)}
                        onCheckedChange={checked => handleToggleAdType(type.key, !!checked)}
                      />
                      <label htmlFor={type.key} className="text-sm">{type.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>استهداف - المدن (مفصولة بفاصلة)</Label>
                <Input
                  placeholder="الرياض, جدة, الدمام"
                  value={(formData.targeting.cities || []).join(', ')}
                  onChange={e => setFormData(f => ({
                    ...f,
                    targeting: {
                      ...f.targeting,
                      cities: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                    }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>استهداف - المنصات</Label>
                <div className="flex gap-4">
                  {['ios', 'android', 'web'].map(platform => (
                    <div key={platform} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`platform-${platform}`}
                        checked={(formData.targeting.platforms || ['ios', 'android', 'web']).includes(platform)}
                        onCheckedChange={checked => {
                          const platforms = formData.targeting.platforms || ['ios', 'android', 'web'];
                          setFormData(f => ({
                            ...f,
                            targeting: {
                              ...f.targeting,
                              platforms: checked
                                ? [...platforms, platform]
                                : platforms.filter((p: string) => p !== platform)
                            }
                          }));
                        }}
                      />
                      <label htmlFor={`platform-${platform}`} className="text-sm uppercase">{platform}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                حفظ
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
