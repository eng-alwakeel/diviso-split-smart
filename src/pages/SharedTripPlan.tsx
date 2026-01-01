import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Calendar,
  Hotel,
  Utensils,
  Car,
  Share2,
  Download,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
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

interface TripPlan {
  id: string;
  destination: string;
  destination_ar: string | null;
  days: number;
  budget: string;
  interests: string[];
  plan_data: { days: DayPlan[] };
  created_at: string;
}

const itemTypeIcons: Record<string, any> = {
  accommodation: Hotel,
  activity: MapPin,
  restaurant: Utensils,
  transport: Car
};

export default function SharedTripPlan() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchPlan();
      incrementViews();
    }
  }, [token]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('trip_plans')
        .select('*')
        .eq('share_token', token)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError(isRTL ? 'الخطة غير موجودة' : 'Plan not found');
        } else {
          throw fetchError;
        }
        return;
      }

      // Type assertion for plan_data
      const planData = data as unknown as TripPlan;
      setPlan(planData);
    } catch (err) {
      console.error('Error fetching plan:', err);
      setError(isRTL ? 'تعذر تحميل الخطة' : 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    // View count increment - optional feature
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: isRTL ? 'تم النسخ!' : 'Copied!',
        description: isRTL ? 'تم نسخ رابط الخطة' : 'Plan link copied'
      });

      if (navigator.share) {
        await navigator.share({
          title: plan ? `${isRTL ? 'رحلة إلى' : 'Trip to'} ${plan.destination}` : 'Trip Plan',
          url: shareUrl
        });
      }
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-background p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-dark-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {error || (isRTL ? 'الخطة غير موجودة' : 'Plan not found')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isRTL 
                ? 'قد يكون الرابط غير صحيح أو انتهت صلاحيته'
                : 'The link may be incorrect or expired'
              }
            </p>
            <Button onClick={() => navigate('/trip-planner')}>
              {isRTL ? 'أنشئ خطتك الخاصة' : 'Create Your Own Plan'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const days = plan.plan_data?.days || [];
  const destination = isRTL && plan.destination_ar ? plan.destination_ar : plan.destination;

  return (
    <div className="min-h-screen bg-dark-background pb-8">
      <SEO 
        title={`${isRTL ? 'رحلة إلى' : 'Trip to'} ${destination}`}
        description={`${plan.days} ${isRTL ? 'أيام في' : 'days in'} ${destination}`}
      />

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Header */}
        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="py-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  {isRTL ? `رحلة إلى ${destination}` : `Trip to ${destination}`}
                </h1>
                <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{plan.days} {isRTL ? 'أيام' : 'days'}</span>
                  </div>
                  <Badge variant="outline">
                    {plan.budget === 'luxury' ? (isRTL ? 'فخم' : 'Luxury') :
                     plan.budget === 'high' ? (isRTL ? 'فاخر' : 'High') :
                     plan.budget === 'medium' ? (isRTL ? 'متوسط' : 'Medium') :
                     (isRTL ? 'اقتصادي' : 'Budget')}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {plan.interests && plan.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {plan.interests.map(interest => (
                  <Badge key={interest} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Days */}
        {days.map(day => (
          <Card key={day.day}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge>{isRTL ? `اليوم ${day.day}` : `Day ${day.day}`}</Badge>
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
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {/* CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-6 text-center">
            <h3 className="font-semibold mb-2">
              {isRTL ? 'أعجبتك الخطة؟' : 'Like this plan?'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isRTL 
                ? 'أنشئ خطتك الخاصة مع Diviso' 
                : 'Create your own plan with Diviso'
              }
            </p>
            <Button onClick={() => navigate('/trip-planner')}>
              {isRTL ? 'خطط رحلتك الآن' : 'Plan Your Trip Now'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
