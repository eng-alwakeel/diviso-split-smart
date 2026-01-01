import { useState } from "react";
import { SEO } from "@/components/SEO";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Calendar,
  Wallet,
  Sparkles,
  Loader2,
  Share2,
  Hotel,
  Utensils,
  Car,
  Clock,
  Copy,
  Check,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface DayPlan {
  day: number;
  title: string;
  titleAr: string;
  items: PlanItem[];
}

interface PlanItem {
  id: string;
  type: 'accommodation' | 'activity' | 'restaurant' | 'transport';
  time: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  estimatedPrice?: number;
  currency: string;
  affiliateUrl?: string;
}

type Budget = 'low' | 'medium' | 'high' | 'luxury';

const interestOptions = [
  { value: 'culture', labelAr: 'ثقافة وتاريخ', labelEn: 'Culture & History' },
  { value: 'adventure', labelAr: 'مغامرة', labelEn: 'Adventure' },
  { value: 'food', labelAr: 'طعام', labelEn: 'Food' },
  { value: 'shopping', labelAr: 'تسوق', labelEn: 'Shopping' },
  { value: 'nature', labelAr: 'طبيعة', labelEn: 'Nature' },
  { value: 'relaxation', labelAr: 'استرخاء', labelEn: 'Relaxation' },
  { value: 'nightlife', labelAr: 'حياة ليلية', labelEn: 'Nightlife' },
  { value: 'family', labelAr: 'عائلي', labelEn: 'Family' },
];

const itemTypeIcons: Record<string, any> = {
  accommodation: Hotel,
  activity: MapPin,
  restaurant: Utensils,
  transport: Car
};

export default function TripPlanner() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    destination: '',
    days: 3,
    budget: 'medium' as Budget,
    interests: [] as string[]
  });

  const [plan, setPlan] = useState<{
    id: string;
    shareToken: string;
    days: DayPlan[];
  } | null>(null);

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleGenerate = async () => {
    if (!formData.destination) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'الرجاء إدخال الوجهة' : 'Please enter a destination',
        variant: 'destructive'
      });
      return;
    }

    setStep('loading');

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://iwthriddasxzbjddpzzf.functions.supabase.co/generate-trip-plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`
          },
          body: JSON.stringify({
            destination: formData.destination,
            days: formData.days,
            budget: formData.budget,
            interests: formData.interests
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.plan) {
          setPlan({
            id: data.plan.id,
            shareToken: data.plan.share_token,
            days: data.plan.plan_data?.days || []
          });
          setStep('result');
        }
      } else {
        throw new Error('Failed to generate plan');
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'تعذر إنشاء الخطة' : 'Failed to generate plan',
        variant: 'destructive'
      });
      setStep('form');
    }
  };

  const handleShare = async () => {
    if (!plan) return;

    const shareUrl = `${window.location.origin}/trip/${plan.shareToken}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: isRTL ? 'تم النسخ!' : 'Copied!',
        description: isRTL ? 'تم نسخ رابط الخطة' : 'Plan link copied to clipboard'
      });

      // Try native share if available
      if (navigator.share) {
        await navigator.share({
          title: isRTL ? `خطة رحلة إلى ${formData.destination}` : `Trip plan to ${formData.destination}`,
          text: isRTL ? 'شاهد خطة رحلتي!' : 'Check out my trip plan!',
          url: shareUrl
        });
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const renderForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {isRTL ? 'خطط رحلتك' : 'Plan Your Trip'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Destination */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {isRTL ? 'الوجهة' : 'Destination'}
          </Label>
          <Input
            value={formData.destination}
            onChange={e => setFormData(p => ({ ...p, destination: e.target.value }))}
            placeholder={isRTL ? 'مثال: دبي، باريس، طوكيو' : 'e.g. Dubai, Paris, Tokyo'}
          />
        </div>

        {/* Days */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {isRTL ? 'عدد الأيام' : 'Number of Days'}
          </Label>
          <div className="flex gap-2">
            {[1, 2, 3, 5, 7, 10, 14].map(d => (
              <Button
                key={d}
                variant={formData.days === d ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData(p => ({ ...p, days: d }))}
              >
                {d}
              </Button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            {isRTL ? 'الميزانية' : 'Budget'}
          </Label>
          <RadioGroup
            value={formData.budget}
            onValueChange={v => setFormData(p => ({ ...p, budget: v as Budget }))}
            className="flex flex-wrap gap-2"
          >
            {[
              { value: 'low', labelAr: 'اقتصادي', labelEn: 'Budget' },
              { value: 'medium', labelAr: 'متوسط', labelEn: 'Medium' },
              { value: 'high', labelAr: 'فاخر', labelEn: 'High' },
              { value: 'luxury', labelAr: 'فخم', labelEn: 'Luxury' },
            ].map(opt => (
              <Label
                key={opt.value}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                  formData.budget === opt.value 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value={opt.value} className="sr-only" />
                {isRTL ? opt.labelAr : opt.labelEn}
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Interests */}
        <div className="space-y-2">
          <Label>{isRTL ? 'الاهتمامات' : 'Interests'}</Label>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map(interest => (
              <Badge
                key={interest.value}
                variant={formData.interests.includes(interest.value) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleInterest(interest.value)}
              >
                {isRTL ? interest.labelAr : interest.labelEn}
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={handleGenerate} className="w-full" size="lg">
          <Sparkles className="w-4 h-4 mr-2" />
          {isRTL ? 'أنشئ الخطة' : 'Generate Plan'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderLoading = () => (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div className="text-center">
            <h3 className="font-semibold">
              {isRTL ? 'جاري إنشاء خطتك...' : 'Creating your plan...'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL 
                ? 'نحن نبحث عن أفضل الأماكن لك' 
                : 'We are finding the best places for you'
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderResult = () => {
    if (!plan) return null;

    return (
      <div className="space-y-4">
        {/* Header */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {isRTL ? `رحلة إلى ${formData.destination}` : `Trip to ${formData.destination}`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formData.days} {isRTL ? 'أيام' : 'days'}
                </p>
              </div>
              <Button onClick={handleShare} variant="outline">
                {copied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Share2 className="w-4 h-4 mr-2" />
                )}
                {isRTL ? 'شارك' : 'Share'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Days */}
        {plan.days.map(day => (
          <Card key={day.day}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="secondary">{isRTL ? `اليوم ${day.day}` : `Day ${day.day}`}</Badge>
                {isRTL ? day.titleAr : day.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {day.items.map((item, idx) => {
                const Icon = itemTypeIcons[item.type] || MapPin;
                return (
                  <div 
                    key={item.id || idx} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-2 rounded-lg bg-background">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">
                        {isRTL ? item.nameAr : item.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isRTL ? item.descriptionAr : item.description}
                      </p>
                      {item.estimatedPrice && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          ~{item.estimatedPrice} {item.currency}
                        </Badge>
                      )}
                    </div>

                    {item.affiliateUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(item.affiliateUrl, '_blank')}
                      >
                        {isRTL ? 'احجز' : 'Book'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
            {isRTL ? 'خطة جديدة' : 'New Plan'}
          </Button>
          <Button onClick={handleShare} className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            {isRTL ? 'شارك مع الأصدقاء' : 'Share with Friends'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-background pb-20">
      <SEO 
        title={isRTL ? "مخطط الرحلات" : "Trip Planner"} 
        description={isRTL ? "خطط رحلتك بسهولة مع الذكاء الاصطناعي" : "Plan your trip easily with AI"}
      />
      <AppHeader />

      <div className="page-container py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          {isRTL ? 'رجوع' : 'Back'}
        </Button>

        {step === 'form' && renderForm()}
        {step === 'loading' && renderLoading()}
        {step === 'result' && renderResult()}
      </div>

      <BottomNav />
    </div>
  );
}
