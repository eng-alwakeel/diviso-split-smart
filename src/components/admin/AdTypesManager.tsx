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
import { Settings, Loader2, Gift, Megaphone, Layout, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdType {
  id: string;
  type_key: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  is_enabled: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const adTypeIcons: Record<string, any> = {
  rewarded: Gift,
  sponsored: Megaphone,
  native: Layout,
  banner: Image
};

export function AdTypesManager() {
  const { toast } = useToast();
  const [adTypes, setAdTypes] = useState<AdType[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<AdType | null>(null);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdTypes();
  }, []);

  const fetchAdTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ad_types')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAdTypes((data || []).map(d => ({
        ...d,
        settings: (d.settings || {}) as Record<string, any>
      })));
    } catch (error) {
      console.error('Error fetching ad types:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر تحميل أنواع الإعلانات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, isEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('ad_types')
        .update({ is_enabled: isEnabled })
        .eq('id', id);

      if (error) throw error;
      
      // Log audit
      await supabase.from('admin_audit_log').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'ad_type_toggled',
        details: { type_id: id, is_enabled: isEnabled }
      });
      
      setAdTypes(prev => prev.map(t => t.id === id ? { ...t, is_enabled: isEnabled } : t));
      
      toast({
        title: isEnabled ? 'تم التفعيل' : 'تم الإيقاف',
        description: `تم ${isEnabled ? 'تفعيل' : 'إيقاف'} نوع الإعلان`
      });
    } catch (error) {
      console.error('Error toggling ad type:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر تحديث حالة نوع الإعلان',
        variant: 'destructive'
      });
    }
  };

  const handleOpenSettings = (adType: AdType) => {
    setEditingType(adType);
    setSettings(adType.settings || {});
    setSettingsDialogOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!editingType) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ad_types')
        .update({ settings })
        .eq('id', editingType.id);

      if (error) throw error;
      
      // Log audit
      await supabase.from('admin_audit_log').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'ad_type_settings_updated',
        details: { type_id: editingType.id, settings }
      });
      
      setAdTypes(prev => prev.map(t => t.id === editingType.id ? { ...t, settings } : t));
      setSettingsDialogOpen(false);
      
      toast({
        title: 'تم الحفظ',
        description: 'تم تحديث إعدادات نوع الإعلان'
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

  const renderSettingsFields = (typeKey: string) => {
    switch (typeKey) {
      case 'rewarded':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>المكافأة (UC)</Label>
              <Input
                type="number"
                value={settings.reward_uc || 1}
                onChange={e => setSettings(s => ({ ...s, reward_uc: parseInt(e.target.value) || 1 }))}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>الحد اليومي</Label>
              <Input
                type="number"
                value={settings.daily_cap || 5}
                onChange={e => setSettings(s => ({ ...s, daily_cap: parseInt(e.target.value) || 5 }))}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>وقت الانتظار (ثواني)</Label>
              <Input
                type="number"
                value={settings.cooldown_seconds || 180}
                onChange={e => setSettings(s => ({ ...s, cooldown_seconds: parseInt(e.target.value) || 180 }))}
                min={0}
              />
            </div>
          </div>
        );
      case 'sponsored':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>نص التصنيف (عربي)</Label>
              <Input
                value={settings.label_text || 'إعلان'}
                onChange={e => setSettings(s => ({ ...s, label_text: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>نص التصنيف (English)</Label>
              <Input
                value={settings.label_text_en || 'Ad'}
                onChange={e => setSettings(s => ({ ...s, label_text_en: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>الحد الأقصى للكثافة</Label>
              <Input
                type="number"
                value={settings.max_density || 3}
                onChange={e => setSettings(s => ({ ...s, max_density: parseInt(e.target.value) || 3 }))}
                min={1}
              />
            </div>
          </div>
        );
      case 'native':
      case 'banner':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>حد التكرار</Label>
              <Input
                type="number"
                value={settings.frequency_cap || 10}
                onChange={e => setSettings(s => ({ ...s, frequency_cap: parseInt(e.target.value) || 10 }))}
                min={1}
              />
            </div>
            {typeKey === 'banner' && (
              <div className="space-y-2">
                <Label>فترة التحديث (ثواني)</Label>
                <Input
                  type="number"
                  value={settings.refresh_interval_seconds || 60}
                  onChange={e => setSettings(s => ({ ...s, refresh_interval_seconds: parseInt(e.target.value) || 60 }))}
                  min={30}
                />
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
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
        <CardTitle>إدارة أنواع الإعلانات</CardTitle>
        <CardDescription>تفعيل وإيقاف وتخصيص إعدادات كل نوع إعلان</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>النوع</TableHead>
              <TableHead>الوصف</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإعدادات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adTypes.map(adType => {
              const Icon = adTypeIcons[adType.type_key] || Layout;
              return (
                <TableRow key={adType.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{adType.name_ar}</div>
                        <div className="text-xs text-muted-foreground">{adType.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {adType.description_ar || adType.description || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={adType.is_enabled}
                        onCheckedChange={v => handleToggle(adType.id, v)}
                      />
                      <Badge variant={adType.is_enabled ? 'default' : 'secondary'}>
                        {adType.is_enabled ? 'مفعّل' : 'معطّل'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenSettings(adType)}
                    >
                      <Settings className="w-4 h-4 ml-1" />
                      الإعدادات
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Settings Dialog */}
        <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                إعدادات {editingType?.name_ar}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {editingType && renderSettingsFields(editingType.type_key)}
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
