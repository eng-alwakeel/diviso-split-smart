import { useState, useEffect } from 'react';
import { Check, Crown, Sparkles, Zap, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SubscriptionPlan {
  id: string;
  plan_id: string;
  name: string;
  name_ar: string;
  price_monthly_sar: number;
  price_yearly_sar: number;
  credits_monthly: number;
  credits_yearly: number;
  features: string[];
  features_ar: string[];
  is_popular: boolean;
  sort_order: number;
}

export function SubscriptionPlansGrid() {
  const { t, i18n } = useTranslation('credits');
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isYearly, setIsYearly] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching plans:', error);
        toast({
          title: t('common:error'),
          description: t('subscriptions.load_error'),
          variant: 'destructive',
        });
      } else {
        setPlans(data || []);
      }
      setLoading(false);
    };

    fetchPlans();
  }, [t, toast]);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    // Navigate to pricing page for subscription handling
    navigate('/pricing', { state: { selectedPlan: plan.plan_id, isYearly } });
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Zap className="h-6 w-6" />;
      case 'pro':
        return <Sparkles className="h-6 w-6" />;
      case 'max':
        return <Crown className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'starter':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600';
      case 'pro':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600';
      case 'max':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (plans.length === 0) {
    return null;
  }

  const yearlySavings = 36; // Approximate yearly savings percentage

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">{t('subscriptions.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('subscriptions.subtitle')}</p>
      </div>

      {/* Yearly/Monthly Toggle */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <Label htmlFor="billing-toggle" className={`text-sm ${!isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
          {t('plans.monthly')}
        </Label>
        <Switch
          id="billing-toggle"
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <Label htmlFor="billing-toggle" className={`text-sm ${isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
          {t('plans.yearly')}
        </Label>
        {isYearly && (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
            {t('paywall.save_36')}
          </Badge>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const price = isYearly ? plan.price_yearly_sar : plan.price_monthly_sar;
          const credits = isYearly ? plan.credits_yearly : plan.credits_monthly;
          const features = isRTL ? plan.features_ar : plan.features;
          const name = isRTL ? plan.name_ar : plan.name;
          const monthlyEquivalent = isYearly ? Math.round(price / 12) : price;

          return (
            <Card 
              key={plan.id}
              className={`relative transition-all ${
                plan.is_popular 
                  ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/50'
              } hover:shadow-lg`}
            >
              {plan.is_popular && (
                <Badge 
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-0 text-xs px-3 py-0.5"
                >
                  {t('plans.recommended')}
                </Badge>
              )}

              <CardHeader className="text-center pb-2 pt-5">
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${getPlanColor(plan.plan_id)}`}>
                  {getPlanIcon(plan.plan_id)}
                </div>
                <CardTitle className="text-lg">{name}</CardTitle>
              </CardHeader>

              <CardContent className="text-center space-y-4">
                {/* Price */}
                <div>
                  <span className="text-3xl font-bold text-foreground">{price}</span>
                  <span className="text-muted-foreground mr-1 text-sm"> {t('common:sar')}</span>
                  <span className="text-muted-foreground text-sm">
                    /{isYearly ? t('plans.year') : t('plans.month')}
                  </span>
                  {isYearly && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ({monthlyEquivalent} {t('common:sar')}/{t('plans.month')})
                    </p>
                  )}
                </div>

                {/* Credits */}
                <div className="space-y-1">
                  <div className="text-2xl font-semibold text-primary">
                    {credits}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('plans.credits_per_month')}
                  </div>
                </div>

                {/* Features */}
                {features && features.length > 0 && (
                  <ul className="text-sm space-y-2 text-right">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Subscribe Button */}
                <Button 
                  className="w-full"
                  variant={plan.is_popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan)}
                >
                  {t('subscriptions.subscribe_btn')}
                </Button>

                {/* Auto-renew note */}
                <p className="text-xs text-muted-foreground">
                  {t('plans.auto_renew_note')}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
