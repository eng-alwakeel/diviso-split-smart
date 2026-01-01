import { useState, useEffect } from 'react';
import { Check, Crown, Sparkles, Zap, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SubscriptionPlan {
  id: string;
  name: string;
  name_ar: string;
  billing_cycle: string;
  price_sar: number;
  credits_per_month: number;
  features: string[] | null;
  is_active: boolean | null;
}

export function SubscriptionPlansGrid() {
  const { t, i18n } = useTranslation('credits');
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_sar', { ascending: true });

      if (error) {
        console.error('Error fetching plans:', error);
        toast({
          title: t('common:error'),
          description: t('subscriptions.load_error'),
          variant: 'destructive',
        });
      } else {
        // Transform features from Json to string array
        const transformedPlans = (data || []).map(plan => ({
          ...plan,
          features: Array.isArray(plan.features) ? plan.features as string[] : null
        }));
        setPlans(transformedPlans);
      }
      setLoading(false);
    };

    fetchPlans();
  }, [t, toast]);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    // Navigate to pricing page for subscription handling
    navigate('/pricing', { state: { selectedPlan: plan.name.toLowerCase() } });
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    switch (name) {
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

  const getPlanColor = (planName: string) => {
    const name = planName.toLowerCase();
    switch (name) {
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

  const isPopularPlan = (planName: string) => {
    return planName.toLowerCase() === 'pro';
  };

  const isBestValuePlan = (planName: string) => {
    return planName.toLowerCase() === 'max';
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

  const filteredPlans = plans.filter(plan => plan.billing_cycle === billingCycle);

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">{t('subscriptions.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('subscriptions.subtitle')}</p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className={`text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
          {t('plans.monthly')}
        </span>
        
        <Switch 
          checked={billingCycle === 'yearly'}
          onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
        />
        
        <span className={`text-sm font-medium transition-colors ${billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
          {t('plans.yearly')}
        </span>
        
        {billingCycle === 'yearly' && (
          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0">
            {t('plans.save_up_to', { percent: 36 })}
          </Badge>
        )}
      </div>

      {/* Plans Grid - Horizontal scroll on mobile */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:overflow-visible sm:mx-0 sm:px-0">
        <div className="flex gap-4 sm:grid sm:grid-cols-3 min-w-max sm:min-w-0">
        {filteredPlans.map((plan) => {
          const name = isRTL ? plan.name_ar : plan.name;
          const isPopular = isPopularPlan(plan.name);
          const isBestValue = isBestValuePlan(plan.name);

          return (
            <Card 
              key={plan.id}
              className={`relative transition-all w-[260px] sm:w-auto flex-shrink-0 sm:flex-shrink ${
                isPopular 
                  ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20' 
                  : isBestValue
                  ? 'border-green-500 shadow-lg shadow-green-500/10 ring-2 ring-green-500/20'
                  : 'border-border hover:border-primary/50'
              } hover:shadow-lg`}
            >
              {isPopular && (
                <Badge 
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-0 text-xs px-3 py-0.5"
                >
                  {t('plans.recommended')}
                </Badge>
              )}

              {isBestValue && (
                <Badge 
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-500 text-white border-0 text-xs px-3 py-0.5"
                >
                  {t('packages.best_value')}
                </Badge>
              )}

              <CardHeader className="text-center pb-2 pt-5">
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${getPlanColor(plan.name)}`}>
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-lg">{name}</CardTitle>
              </CardHeader>

              <CardContent className="text-center space-y-4">
                {/* Price */}
                <div>
                  <span className="text-3xl font-bold text-foreground">{plan.price_sar}</span>
                  <span className="text-muted-foreground mr-1 text-sm"> {t('common:sar')}</span>
                  <span className="text-muted-foreground text-sm">
                    /{billingCycle === 'yearly' ? t('plans.year') : t('plans.month')}
                  </span>
                </div>

                {/* Credits */}
                <div className="space-y-1">
                  <div className="text-2xl font-semibold text-primary">
                    {plan.credits_per_month}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('plans.credits_per_month')}
                  </div>
                </div>

                {/* Features */}
                {plan.features && plan.features.length > 0 && (
                  <ul className="text-sm space-y-2 text-right">
                    {plan.features.map((feature, index) => (
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
                  variant={isPopular ? 'default' : 'outline'}
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

      {/* Scroll indicator for mobile */}
      <div className="flex justify-center gap-1.5 sm:hidden">
        {filteredPlans.map((_, index) => (
          <div key={index} className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        ))}
      </div>
    </div>
  );
}
