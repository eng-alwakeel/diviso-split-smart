import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  TestTube,
  Loader2,
  Check,
  X,
  Hotel,
  Smartphone,
  Car,
  MapPin,
  Utensils,
  Plane,
  Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AffiliatePartner {
  id: string;
  name: string;
  name_ar: string | null;
  api_endpoint: string | null;
  api_key_env_name: string | null;
  partner_type: string;
  commission_rate: number;
  logo_url: string | null;
  is_active: boolean;
  config: any;
  created_at: string;
}

const partnerTypeIcons: Record<string, any> = {
  hotels: Hotel,
  esim: Smartphone,
  car_rental: Car,
  activities: MapPin,
  restaurants: Utensils,
  flights: Plane,
  general: Package
};

const partnerTypeLabels: Record<string, { en: string; ar: string }> = {
  hotels: { en: 'Hotels', ar: 'فنادق' },
  esim: { en: 'eSIM', ar: 'شرائح إنترنت' },
  car_rental: { en: 'Car Rental', ar: 'تأجير سيارات' },
  activities: { en: 'Activities', ar: 'أنشطة' },
  restaurants: { en: 'Restaurants', ar: 'مطاعم' },
  flights: { en: 'Flights', ar: 'رحلات طيران' },
  general: { en: 'General', ar: 'عام' }
};

export function AffiliatePartnersManager() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<AffiliatePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<AffiliatePartner | null>(null);
  const [testingPartner, setTestingPartner] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    api_endpoint: '',
    api_key_env_name: '',
    partner_type: 'general',
    commission_rate: 0,
    logo_url: '',
    is_active: true,
    config: '{}'
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('affiliate_partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر تحميل قائمة الشركاء',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (partner?: AffiliatePartner) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({
        name: partner.name,
        name_ar: partner.name_ar || '',
        api_endpoint: partner.api_endpoint || '',
        api_key_env_name: partner.api_key_env_name || '',
        partner_type: partner.partner_type,
        commission_rate: partner.commission_rate || 0,
        logo_url: partner.logo_url || '',
        is_active: partner.is_active,
        config: JSON.stringify(partner.config || {}, null, 2)
      });
    } else {
      setEditingPartner(null);
      setFormData({
        name: '',
        name_ar: '',
        api_endpoint: '',
        api_key_env_name: '',
        partner_type: 'general',
        commission_rate: 0,
        logo_url: '',
        is_active: true,
        config: '{}'
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      let configJson = {};
      try {
        configJson = JSON.parse(formData.config);
      } catch (e) {
        toast({
          title: 'خطأ',
          description: 'صيغة JSON غير صحيحة في الإعدادات',
          variant: 'destructive'
        });
        return;
      }

      const partnerData = {
        name: formData.name,
        name_ar: formData.name_ar || null,
        api_endpoint: formData.api_endpoint || null,
        api_key_env_name: formData.api_key_env_name || null,
        partner_type: formData.partner_type,
        commission_rate: formData.commission_rate,
        logo_url: formData.logo_url || null,
        is_active: formData.is_active,
        config: configJson
      };

      if (editingPartner) {
        const { error } = await supabase
          .from('affiliate_partners')
          .update(partnerData)
          .eq('id', editingPartner.id);

        if (error) throw error;
        toast({ title: 'تم التحديث', description: 'تم تحديث بيانات الشريك بنجاح' });
      } else {
        const { error } = await supabase
          .from('affiliate_partners')
          .insert(partnerData);

        if (error) throw error;
        toast({ title: 'تم الإضافة', description: 'تم إضافة الشريك بنجاح' });
      }

      setDialogOpen(false);
      fetchPartners();
    } catch (error) {
      console.error('Error saving partner:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر حفظ بيانات الشريك',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الشريك؟')) return;

    try {
      const { error } = await supabase
        .from('affiliate_partners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'تم الحذف', description: 'تم حذف الشريك بنجاح' });
      fetchPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر حذف الشريك',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('affiliate_partners')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      fetchPartners();
    } catch (error) {
      console.error('Error toggling partner:', error);
    }
  };

  const handleTestConnection = async (partner: AffiliatePartner) => {
    if (!partner.api_endpoint) {
      toast({
        title: 'لا يوجد API',
        description: 'هذا الشريك ليس لديه نقطة API محددة',
        variant: 'destructive'
      });
      return;
    }

    setTestingPartner(partner.id);
    
    try {
      // Simple connectivity test
      const response = await fetch(partner.api_endpoint, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      toast({
        title: 'اتصال ناجح',
        description: `تم الاتصال بـ ${partner.name} بنجاح`
      });
    } catch (error) {
      toast({
        title: 'فشل الاتصال',
        description: 'تعذر الاتصال بخادم الشريك',
        variant: 'destructive'
      });
    } finally {
      setTestingPartner(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">إدارة شركاء العمولة</CardTitle>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة شريك
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا يوجد شركاء بعد. أضف أول شريك!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشريك</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>العمولة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map(partner => {
                const TypeIcon = partnerTypeIcons[partner.partner_type] || Package;
                return (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {partner.logo_url ? (
                          <img 
                            src={partner.logo_url} 
                            alt={partner.name}
                            className="w-8 h-8 rounded object-contain"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                            <TypeIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{partner.name}</div>
                          {partner.name_ar && (
                            <div className="text-xs text-muted-foreground">{partner.name_ar}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {partnerTypeLabels[partner.partner_type]?.ar || partner.partner_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{partner.commission_rate}%</TableCell>
                    <TableCell>
                      <Switch
                        checked={partner.is_active}
                        onCheckedChange={v => handleToggleActive(partner.id, v)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleTestConnection(partner)}
                          disabled={testingPartner === partner.id}
                        >
                          {testingPartner === partner.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <TestTube className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenDialog(partner)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(partner.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPartner ? 'تعديل الشريك' : 'إضافة شريك جديد'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم (English)</Label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Booking.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم (عربي)</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={e => setFormData(p => ({ ...p, name_ar: e.target.value }))}
                    placeholder="مثال: بوكينج"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>نوع الشريك</Label>
                <Select
                  value={formData.partner_type}
                  onValueChange={v => setFormData(p => ({ ...p, partner_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(partnerTypeLabels).map(([value, labels]) => (
                      <SelectItem key={value} value={value}>
                        {labels.ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>رابط API</Label>
                <Input
                  value={formData.api_endpoint}
                  onChange={e => setFormData(p => ({ ...p, api_endpoint: e.target.value }))}
                  placeholder="https://api.partner.com/v1"
                />
              </div>

              <div className="space-y-2">
                <Label>اسم متغير API Key</Label>
                <Input
                  value={formData.api_key_env_name}
                  onChange={e => setFormData(p => ({ ...p, api_key_env_name: e.target.value }))}
                  placeholder="PARTNER_API_KEY"
                />
                <p className="text-xs text-muted-foreground">
                  اسم المتغير في Supabase Secrets
                </p>
              </div>

              <div className="space-y-2">
                <Label>نسبة العمولة (%)</Label>
                <Input
                  type="number"
                  value={formData.commission_rate}
                  onChange={e => setFormData(p => ({ ...p, commission_rate: parseFloat(e.target.value) || 0 }))}
                  min={0}
                  max={100}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <Label>رابط الشعار</Label>
                <Input
                  value={formData.logo_url}
                  onChange={e => setFormData(p => ({ ...p, logo_url: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label>إعدادات إضافية (JSON)</Label>
                <Textarea
                  value={formData.config}
                  onChange={e => setFormData(p => ({ ...p, config: e.target.value }))}
                  placeholder='{"base_url": "https://..."}'
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>مفعّل</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={v => setFormData(p => ({ ...p, is_active: v }))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  إلغاء
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  {editingPartner ? 'حفظ التغييرات' : 'إضافة الشريك'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
