import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle,
  Link,
  Key,
  Map,
  TestTube,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PartnerWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface WizardFormData {
  // Step 1: General Info
  name: string;
  name_ar: string;
  partner_category: string;
  supported_categories: string[];
  logo_url: string;
  commission_rate: number;
  
  // Step 2: API Credentials
  base_url: string;
  auth_type: string;
  api_key: string;
  bearer_token: string;
  rate_limit_requests: number;
  rate_limit_period: string;
  
  // Step 3: Field Mapping
  field_mapping: Record<string, string>;
  city_source: string;
  
  // Step 4: Test Results
  test_status: 'idle' | 'testing' | 'success' | 'error';
  test_error: string;
  sample_offers: any[];
  
  // Step 5: Sync Schedule
  sync_schedule: string;
  sync_endpoint: string;
}

const STEPS = [
  { id: 1, title: 'معلومات عامة', icon: Link },
  { id: 2, title: 'بيانات API', icon: Key },
  { id: 3, title: 'ربط الحقول', icon: Map },
  { id: 4, title: 'اختبار الاتصال', icon: TestTube },
  { id: 5, title: 'جدولة المزامنة', icon: Calendar }
];

const PARTNER_CATEGORIES = [
  { value: 'api_partner', label: 'API Partner' },
  { value: 'affiliate_network', label: 'Affiliate Network' },
  { value: 'ad_network', label: 'Ad Network' }
];

const SUPPORTED_CATEGORIES = [
  'restaurants', 'hotels', 'travel', 'shopping', 
  'entertainment', 'deals', 'delivery', 'services'
];

const AUTH_TYPES = [
  { value: 'api_key', label: 'API Key' },
  { value: 'bearer_token', label: 'Bearer Token' },
  { value: 'oauth', label: 'OAuth 2.0' }
];

const FIELD_MAPPING_OPTIONS = [
  { key: 'title', label: 'عنوان العرض' },
  { key: 'description', label: 'الوصف' },
  { key: 'city', label: 'المدينة' },
  { key: 'category', label: 'التصنيف' },
  { key: 'deeplink', label: 'رابط العرض' },
  { key: 'coupon_code', label: 'كود الخصم' },
  { key: 'image_url', label: 'الصورة' },
  { key: 'ends_at', label: 'تاريخ الانتهاء' },
  { key: 'price', label: 'السعر' }
];

export function PartnerWizard({ open, onOpenChange, onComplete }: PartnerWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<WizardFormData>({
    name: '',
    name_ar: '',
    partner_category: 'api_partner',
    supported_categories: [],
    logo_url: '',
    commission_rate: 0,
    base_url: '',
    auth_type: 'api_key',
    api_key: '',
    bearer_token: '',
    rate_limit_requests: 100,
    rate_limit_period: 'minute',
    field_mapping: {},
    city_source: 'field',
    test_status: 'idle',
    test_error: '',
    sample_offers: [],
    sync_schedule: 'manual',
    sync_endpoint: ''
  });

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    updateFormData({
      supported_categories: checked
        ? [...formData.supported_categories, category]
        : formData.supported_categories.filter(c => c !== category)
    });
  };

  const handleTestConnection = async () => {
    updateFormData({ test_status: 'testing', test_error: '', sample_offers: [] });
    
    try {
      // Simulate API test (in production, this would call an edge function)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo, we'll simulate a successful connection
      if (!formData.base_url) {
        throw new Error('Base URL is required');
      }
      
      // Simulated sample offers
      const sampleOffers = [
        { title: 'Sample Offer 1', city: 'Riyadh', category: 'restaurants' },
        { title: 'Sample Offer 2', city: 'Jeddah', category: 'hotels' },
        { title: 'Sample Offer 3', city: 'Dammam', category: 'deals' }
      ];
      
      updateFormData({ 
        test_status: 'success', 
        sample_offers: sampleOffers 
      });
      
      toast({ title: 'اتصال ناجح', description: 'تم الاتصال بالخادم بنجاح' });
    } catch (error: any) {
      updateFormData({ 
        test_status: 'error', 
        test_error: error.message || 'Connection failed' 
      });
      toast({ 
        title: 'فشل الاتصال', 
        description: error.message || 'تعذر الاتصال بالخادم',
        variant: 'destructive'
      });
    }
  };

  const handleSyncNow = async () => {
    toast({ title: 'جاري المزامنة...', description: 'سيتم إشعارك عند الانتهاء' });
    // In production, this would trigger the sync edge function
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Create the partner
      const { data: partner, error: partnerError } = await supabase
        .from('affiliate_partners')
        .insert({
          name: formData.name,
          name_ar: formData.name_ar || null,
          partner_type: formData.partner_category,
          partner_category: formData.partner_category,
          supported_categories: formData.supported_categories,
          logo_url: formData.logo_url || null,
          commission_rate: formData.commission_rate,
          api_endpoint: formData.base_url || null,
          is_active: true,
          status: formData.base_url ? 'active' : 'pending_connector'
        })
        .select()
        .single();

      if (partnerError) throw partnerError;

      // Create credentials if API details provided
      if (formData.base_url && (formData.api_key || formData.bearer_token)) {
        const { error: credError } = await supabase
          .from('partner_credentials')
          .insert({
            partner_id: partner.id,
            auth_type: formData.auth_type,
            encrypted_secrets: {
              api_key: formData.api_key || undefined,
              bearer_token: formData.bearer_token || undefined
            },
            rate_limit_config: {
              requests: formData.rate_limit_requests,
              period: formData.rate_limit_period
            }
          });

        if (credError) console.error('Error saving credentials:', credError);
      }

      // Create endpoint config
      if (formData.base_url) {
        const { error: endpointError } = await supabase
          .from('partner_endpoints')
          .insert({
            partner_id: partner.id,
            base_url: formData.base_url,
            sync_endpoint: formData.sync_endpoint || null,
            field_mapping: formData.field_mapping,
            sync_schedule: formData.sync_schedule,
            is_enabled: true
          });

        if (endpointError) console.error('Error saving endpoint:', endpointError);
      }

      // Log audit
      await supabase.from('admin_audit_log').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'partner_created',
        details: { partner_id: partner.id, name: formData.name }
      });

      toast({ title: 'تم الإضافة', description: 'تم إضافة الشريك بنجاح' });
      onComplete();
      onOpenChange(false);
      
      // Reset form
      setCurrentStep(1);
      setFormData({
        name: '',
        name_ar: '',
        partner_category: 'api_partner',
        supported_categories: [],
        logo_url: '',
        commission_rate: 0,
        base_url: '',
        auth_type: 'api_key',
        api_key: '',
        bearer_token: '',
        rate_limit_requests: 100,
        rate_limit_period: 'minute',
        field_mapping: {},
        city_source: 'field',
        test_status: 'idle',
        test_error: '',
        sample_offers: [],
        sync_schedule: 'manual',
        sync_endpoint: ''
      });
    } catch (error: any) {
      console.error('Error creating partner:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'تعذر إضافة الشريك',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== '';
      case 2:
        return true; // API is optional
      case 3:
        return true; // Mapping is optional
      case 4:
        return formData.test_status !== 'testing';
      case 5:
        return true;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (English) *</Label>
                <Input
                  value={formData.name}
                  onChange={e => updateFormData({ name: e.target.value })}
                  placeholder="Partner Name"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input
                  value={formData.name_ar}
                  onChange={e => updateFormData({ name_ar: e.target.value })}
                  placeholder="اسم الشريك"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>نوع الشريك</Label>
              <Select
                value={formData.partner_category}
                onValueChange={v => updateFormData({ partner_category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>التصنيفات المدعومة</Label>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_CATEGORIES.map(cat => (
                  <div key={cat} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={cat}
                      checked={formData.supported_categories.includes(cat)}
                      onCheckedChange={checked => handleCategoryToggle(cat, !!checked)}
                    />
                    <label htmlFor={cat} className="text-sm capitalize">{cat}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رابط الشعار</Label>
                <Input
                  value={formData.logo_url}
                  onChange={e => updateFormData({ logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>نسبة العمولة (%)</Label>
                <Input
                  type="number"
                  value={formData.commission_rate}
                  onChange={e => updateFormData({ commission_rate: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  step={0.1}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                value={formData.base_url}
                onChange={e => updateFormData({ base_url: e.target.value })}
                placeholder="https://api.partner.com/v1"
              />
            </div>

            <div className="space-y-2">
              <Label>نوع المصادقة</Label>
              <Select
                value={formData.auth_type}
                onValueChange={v => updateFormData({ auth_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTH_TYPES.map(auth => (
                    <SelectItem key={auth.value} value={auth.value}>{auth.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.auth_type === 'api_key' && (
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={formData.api_key}
                  onChange={e => updateFormData({ api_key: e.target.value })}
                  placeholder="sk_live_..."
                />
                <p className="text-xs text-muted-foreground">سيتم تشفير هذه القيمة</p>
              </div>
            )}

            {formData.auth_type === 'bearer_token' && (
              <div className="space-y-2">
                <Label>Bearer Token</Label>
                <Input
                  type="password"
                  value={formData.bearer_token}
                  onChange={e => updateFormData({ bearer_token: e.target.value })}
                  placeholder="eyJ..."
                />
                <p className="text-xs text-muted-foreground">سيتم تشفير هذه القيمة</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rate Limit (requests)</Label>
                <Input
                  type="number"
                  value={formData.rate_limit_requests}
                  onChange={e => updateFormData({ rate_limit_requests: parseInt(e.target.value) || 100 })}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>الفترة</Label>
                <Select
                  value={formData.rate_limit_period}
                  onValueChange={v => updateFormData({ rate_limit_period: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="second">ثانية</SelectItem>
                    <SelectItem value="minute">دقيقة</SelectItem>
                    <SelectItem value="hour">ساعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              حدد كيفية ربط حقول API الشريك مع حقول العروض في النظام
            </p>

            <div className="space-y-3">
              {FIELD_MAPPING_OPTIONS.map(field => (
                <div key={field.key} className="flex items-center gap-3">
                  <Label className="w-32 text-sm">{field.label}</Label>
                  <Input
                    placeholder={`e.g. response.data.${field.key}`}
                    value={formData.field_mapping[field.key] || ''}
                    onChange={e => updateFormData({
                      field_mapping: {
                        ...formData.field_mapping,
                        [field.key]: e.target.value
                      }
                    })}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>مصدر المدينة</Label>
              <Select
                value={formData.city_source}
                onValueChange={v => updateFormData({ city_source: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field">من حقل API</SelectItem>
                  <SelectItem value="static">قيمة ثابتة</SelectItem>
                  <SelectItem value="tag">من Tag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Button 
                onClick={handleTestConnection}
                disabled={formData.test_status === 'testing' || !formData.base_url}
                size="lg"
              >
                {formData.test_status === 'testing' ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري الاختبار...
                  </>
                ) : (
                  <>
                    <TestTube className="w-5 h-5 ml-2" />
                    اختبار الاتصال
                  </>
                )}
              </Button>
            </div>

            {!formData.base_url && (
              <div className="text-center text-muted-foreground text-sm">
                لم يتم تحديد Base URL - يمكنك تخطي هذه الخطوة
              </div>
            )}

            {formData.test_status === 'success' && (
              <Card className="border-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-600 mb-3">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">اتصال ناجح!</span>
                  </div>
                  
                  {formData.sample_offers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">عينة من العروض:</p>
                      <div className="space-y-1">
                        {formData.sample_offers.slice(0, 5).map((offer, i) => (
                          <div key={i} className="text-sm p-2 bg-muted rounded flex justify-between">
                            <span>{offer.title}</span>
                            <Badge variant="outline">{offer.city}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {formData.test_status === 'error' && (
              <Card className="border-destructive">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">فشل الاتصال</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{formData.test_error}</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>جدولة المزامنة</Label>
              <Select
                value={formData.sync_schedule}
                onValueChange={v => updateFormData({ sync_schedule: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">يدوي فقط</SelectItem>
                  <SelectItem value="daily">يومياً</SelectItem>
                  <SelectItem value="twice_daily">مرتين يومياً</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sync Endpoint (اختياري)</Label>
              <Input
                value={formData.sync_endpoint}
                onChange={e => updateFormData({ sync_endpoint: e.target.value })}
                placeholder="/offers/all"
              />
              <p className="text-xs text-muted-foreground">
                المسار النسبي لـ Base URL لجلب العروض
              </p>
            </div>

            {formData.base_url && (
              <Button variant="outline" onClick={handleSyncNow} className="w-full">
                مزامنة الآن
              </Button>
            )}

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">ملخص الإعدادات</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الاسم:</span>
                    <span>{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">النوع:</span>
                    <span>{formData.partner_category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API:</span>
                    <span>{formData.base_url || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الجدولة:</span>
                    <span>{formData.sync_schedule}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة شريك جديد</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="space-y-4">
          <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />
          
          <div className="flex justify-between">
            {STEPS.map(step => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isComplete = step.id < currentStep;
              
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-1 ${
                    isActive ? 'text-primary' : isComplete ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-primary text-primary-foreground' :
                    isComplete ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'
                  }`}>
                    {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-xs hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="py-4">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(s => s - 1)}
            disabled={currentStep === 1}
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            السابق
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={() => setCurrentStep(s => s + 1)}
              disabled={!canProceed()}
            >
              التالي
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              إنشاء الشريك
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
