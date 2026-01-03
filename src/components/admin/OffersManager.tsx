import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Pause,
  Play,
  Star,
  Loader2,
  ExternalLink,
  Tag,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Offer {
  id: string;
  partner_id: string | null;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  city: string | null;
  category: string | null;
  deeplink: string | null;
  coupon_code: string | null;
  image_url: string | null;
  ends_at: string | null;
  status: string;
  tags: string[];
  is_featured: boolean;
  source: string;
  external_id: string | null;
  created_at: string;
  partner?: { name: string } | null;
}

interface Partner {
  id: string;
  name: string;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'نشط', variant: 'default' },
  paused: { label: 'متوقف', variant: 'secondary' },
  expired: { label: 'منتهي', variant: 'destructive' }
};

export function OffersManager() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState({ source: 'all', status: 'all', category: 'all' });

  const [formData, setFormData] = useState({
    partner_id: '',
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    city: '',
    category: '',
    deeplink: '',
    coupon_code: '',
    image_url: '',
    ends_at: '',
    tags: '',
    is_featured: false
  });

  useEffect(() => {
    fetchOffers();
    fetchPartners();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('offers')
        .select('*, partner:affiliate_partners(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers((data || []).map(o => ({ 
        ...o, 
        partner: o.partner as { name: string } | null,
        tags: (o.tags || []) as string[]
      })));
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر تحميل العروض',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    const { data } = await supabase
      .from('affiliate_partners')
      .select('id, name')
      .eq('is_active', true);
    setPartners(data || []);
  };

  const handleOpenDialog = (offer?: Offer) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        partner_id: offer.partner_id || '',
        title: offer.title,
        title_ar: offer.title_ar || '',
        description: offer.description || '',
        description_ar: offer.description_ar || '',
        city: offer.city || '',
        category: offer.category || '',
        deeplink: offer.deeplink || '',
        coupon_code: offer.coupon_code || '',
        image_url: offer.image_url || '',
        ends_at: offer.ends_at ? offer.ends_at.split('T')[0] : '',
        tags: (offer.tags || []).join(', '),
        is_featured: offer.is_featured
      });
    } else {
      setEditingOffer(null);
      setFormData({
        partner_id: '',
        title: '',
        title_ar: '',
        description: '',
        description_ar: '',
        city: '',
        category: '',
        deeplink: '',
        coupon_code: '',
        image_url: '',
        ends_at: '',
        tags: '',
        is_featured: false
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast({ title: 'خطأ', description: 'العنوان مطلوب', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const offerData = {
        partner_id: formData.partner_id || null,
        title: formData.title,
        title_ar: formData.title_ar || null,
        description: formData.description || null,
        description_ar: formData.description_ar || null,
        city: formData.city || null,
        category: formData.category || null,
        deeplink: formData.deeplink || null,
        coupon_code: formData.coupon_code || null,
        image_url: formData.image_url || null,
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        is_featured: formData.is_featured,
        source: 'curated'
      };

      if (editingOffer) {
        const { error } = await supabase
          .from('offers')
          .update(offerData)
          .eq('id', editingOffer.id);

        if (error) throw error;
        toast({ title: 'تم التحديث', description: 'تم تحديث العرض بنجاح' });
      } else {
        const { error } = await supabase
          .from('offers')
          .insert({ ...offerData, status: 'active' });

        if (error) throw error;
        toast({ title: 'تم الإضافة', description: 'تم إضافة العرض بنجاح' });
      }

      setDialogOpen(false);
      fetchOffers();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر حفظ العرض',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (offer: Offer) => {
    const newStatus = offer.status === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: newStatus })
        .eq('id', offer.id);

      if (error) throw error;
      
      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, status: newStatus } : o));
      toast({
        title: newStatus === 'active' ? 'تم التفعيل' : 'تم الإيقاف',
        description: `تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} العرض`
      });
    } catch (error) {
      console.error('Error toggling offer:', error);
    }
  };

  const handleToggleFeatured = async (offer: Offer) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ is_featured: !offer.is_featured })
        .eq('id', offer.id);

      if (error) throw error;
      
      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, is_featured: !o.is_featured } : o));
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const filteredOffers = offers.filter(offer => {
    if (filter.source !== 'all' && offer.source !== filter.source) return false;
    if (filter.status !== 'all' && offer.status !== filter.status) return false;
    if (filter.category !== 'all' && offer.category !== filter.category) return false;
    return true;
  });

  const categories = [...new Set(offers.map(o => o.category).filter(Boolean))];

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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>إدارة العروض</CardTitle>
          <CardDescription>عروض Curated و API مجمعة في مكان واحد</CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة عرض
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={filter.source} onValueChange={v => setFilter(f => ({ ...f, source: v }))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="المصدر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="curated">Curated</SelectItem>
              <SelectItem value="api">API</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter.status} onValueChange={v => setFilter(f => ({ ...f, status: v }))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="paused">متوقف</SelectItem>
              <SelectItem value="expired">منتهي</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter.category} onValueChange={v => setFilter(f => ({ ...f, category: v }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="التصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredOffers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد عروض
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العرض</TableHead>
                <TableHead>المصدر</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>الانتهاء</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffers.map(offer => (
                <TableRow key={offer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {offer.image_url ? (
                        <img
                          src={offer.image_url}
                          alt={offer.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <Tag className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {offer.title_ar || offer.title}
                          {offer.is_featured && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{offer.city}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {offer.source === 'curated' ? 'Curated' : offer.partner?.name || 'API'}
                    </Badge>
                  </TableCell>
                  <TableCell>{offer.category || '-'}</TableCell>
                  <TableCell>
                    {offer.ends_at ? (
                      <span className="text-sm flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(offer.ends_at), 'dd MMM', { locale: ar })}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[offer.status]?.variant || 'secondary'}>
                      {statusLabels[offer.status]?.label || offer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleFeatured(offer)}
                        title={offer.is_featured ? 'إلغاء التمييز' : 'تمييز'}
                      >
                        <Star className={`w-4 h-4 ${offer.is_featured ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleStatus(offer)}
                        title={offer.status === 'active' ? 'إيقاف' : 'تفعيل'}
                      >
                        {offer.status === 'active' ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenDialog(offer)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {offer.deeplink && (
                        <Button
                          size="icon"
                          variant="ghost"
                          asChild
                        >
                          <a href={offer.deeplink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>العنوان (English)</Label>
                  <Input
                    value={formData.title}
                    onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                    placeholder="Offer title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العنوان (عربي)</Label>
                  <Input
                    value={formData.title_ar}
                    onChange={e => setFormData(f => ({ ...f, title_ar: e.target.value }))}
                    placeholder="عنوان العرض"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الشريك (اختياري)</Label>
                <Select
                  value={formData.partner_id}
                  onValueChange={v => setFormData(f => ({ ...f, partner_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الشريك" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون شريك</SelectItem>
                    {partners.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Input
                    value={formData.city}
                    onChange={e => setFormData(f => ({ ...f, city: e.target.value }))}
                    placeholder="الرياض"
                  />
                </div>
                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Input
                    value={formData.category}
                    onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
                    placeholder="مطاعم"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={formData.description_ar}
                  onChange={e => setFormData(f => ({ ...f, description_ar: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>رابط العرض (Deeplink)</Label>
                <Input
                  value={formData.deeplink}
                  onChange={e => setFormData(f => ({ ...f, deeplink: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>كود الخصم</Label>
                  <Input
                    value={formData.coupon_code}
                    onChange={e => setFormData(f => ({ ...f, coupon_code: e.target.value }))}
                    placeholder="SAVE20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الانتهاء</Label>
                  <Input
                    type="date"
                    value={formData.ends_at}
                    onChange={e => setFormData(f => ({ ...f, ends_at: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>رابط الصورة</Label>
                <Input
                  value={formData.image_url}
                  onChange={e => setFormData(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>الوسوم (مفصولة بفاصلة)</Label>
                <Input
                  value={formData.tags}
                  onChange={e => setFormData(f => ({ ...f, tags: e.target.value }))}
                  placeholder="خصم, رمضان, حصري"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>عرض مميز</Label>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={v => setFormData(f => ({ ...f, is_featured: v }))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  إلغاء
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  {editingOffer ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
